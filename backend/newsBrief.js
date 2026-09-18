// "Jesus Interactive News Brief" -- fetches the RSS sources in
// newsBriefSources.js, normalizes/dedupes them into a flat headline
// list, and asks Claude to turn the newest few into a short spoken-style
// brief. server.js wires this into GET /v1/news-brief (cache read) and
// a 15-minute refresh loop (see startNewsBriefRefreshLoop below) --
// nothing here talks to Express directly, so it's also callable from a
// one-off admin route or a script without dragging in the whole app.
const Parser = require('rss-parser');
const { NEWS_BRIEF_SOURCES } = require('./newsBriefSources');
const { NEWS_BRIEF_VIDEO_SOURCES } = require('./newsBriefVideoSources');

// Counter-intuitively confirmed by direct curl testing: YouTube's feed
// endpoint 404s a real browser User-Agent but 200s rss-parser's own
// default ("rss-parser") -- it appears to allow known feed-reader UAs
// and block ones that look like a bare/faked browser. The handful of
// publisher feeds that also 404 (see newsBriefSources.js) do so
// regardless of User-Agent -- those are dead/moved URLs, not a header
// problem, and fetchOneFeed below already skips a failing feed without
// taking the others down with it. So: no custom headers, just the
// library default.
const parser = new Parser({ timeout: 10_000 });
// YouTube's channel Atom feeds carry the video id in a <yt:videoId>
// element rss-parser doesn't know about by default -- this maps it onto
// item.videoId alongside the fields rss-parser already parses (title,
// link, isoDate) for free.
const videoParser = new Parser({ timeout: 10_000, customFields: { item: [['yt:videoId', 'videoId']] } });

const MAX_HEADLINES = 40;
const BRIEF_ITEM_COUNT = 8;
const SUMMARY_MAX_LENGTH = 240;
const MAX_VIDEO_CLIPS = 20;
const VIDEOS_PER_CHANNEL = 5;

function stripHtml(input) {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitleForDedupe(title) {
  return (title || '')
    .toLowerCase()
    .replace(/\bthe\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// One feed timing out or 404ing must never take the others down with
// it -- each fetch is caught individually and just contributes nothing.
async function fetchOneFeed(source) {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items || []).map((item) => {
      const rawSummary = item.contentSnippet || item.content || item.summary || '';
      const summary = stripHtml(rawSummary).slice(0, SUMMARY_MAX_LENGTH);
      return {
        title: stripHtml(item.title || '').slice(0, 200),
        summary,
        link: item.link || '',
        source: source.name,
        publishedAt: item.isoDate || item.pubDate || null,
      };
    });
  } catch (err) {
    console.warn(`[newsBrief] skipping feed "${source.name}" (${source.url}):`, err.message);
    return [];
  }
}

async function fetchAllHeadlines() {
  const results = await Promise.all(NEWS_BRIEF_SOURCES.map(fetchOneFeed));
  const all = results.flat().filter((item) => item.title);

  const seen = new Set();
  const deduped = [];
  for (const item of all) {
    const key = normalizeTitleForDedupe(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  deduped.sort((a, b) => {
    const at = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bt = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bt - at;
  });

  return deduped.slice(0, MAX_HEADLINES);
}

// Same "one bad feed never takes the others down" approach as
// fetchOneFeed above. thumbnailUrl needs no API key -- YouTube serves
// video thumbnails at this fixed, public path for any video id.
async function fetchOneVideoChannel(source) {
  try {
    const feed = await videoParser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${source.channelId}`);
    return (feed.items || [])
      .slice(0, VIDEOS_PER_CHANNEL)
      .filter((item) => item.videoId)
      .map((item) => ({
        videoId: item.videoId,
        title: stripHtml(item.title || '').slice(0, 200),
        channelName: source.name,
        link: item.link || `https://www.youtube.com/watch?v=${item.videoId}`,
        publishedAt: item.isoDate || item.pubDate || null,
        thumbnailUrl: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
      }));
  } catch (err) {
    console.warn(`[newsBrief] skipping video channel "${source.name}" (${source.channelId}):`, err.message);
    return [];
  }
}

async function fetchAllVideoClips() {
  const results = await Promise.all(NEWS_BRIEF_VIDEO_SOURCES.map(fetchOneVideoChannel));
  const all = results.flat();
  all.sort((a, b) => {
    const at = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bt = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bt - at;
  });
  return all.slice(0, MAX_VIDEO_CLIPS);
}

const BRIEF_SYSTEM_PROMPT =`You are writing a news brief for Jesus Interactive, a literary/educational app. This is not revelation and you are not speaking as Jesus -- write as a neutral, careful news editor. Tone: clear, respectful, non-partisan. No prophecy claims, no political campaigning, no date-setting, unless a claim like that is itself what a source reported -- in that case attribute it plainly to that source rather than asserting it. Do not add any fact that is not present in the items you were given.`;

function buildBriefUserPrompt(items) {
  const payload = items.map((item) => ({
    title: item.title,
    summary: item.summary,
    source: item.source,
    url: item.link,
    published: item.publishedAt,
  }));
  return `Here are today's items as a JSON array of {title, summary, source, url, published}:\n\n${JSON.stringify(payload, null, 2)}\n\nWrite a 90-second spoken brief (roughly 4-7 short sentences). Attribute every fact to its source in parentheses at the end of the sentence, e.g. "(Christian Post)". If an item has no summary, work from its title only. Plain text only, no markdown, no headings -- just the brief itself.`;
}

async function generateBriefText(items, { anthropicApiKey, anthropicModel }) {
  if (items.length === 0) return '';
  if (!anthropicApiKey) return '';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: anthropicModel,
        max_tokens: 512,
        system: BRIEF_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildBriefUserPrompt(items.slice(0, BRIEF_ITEM_COUNT)) }],
        thinking: { type: 'disabled' },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error('[newsBrief] Anthropic API error:', await res.text());
      return '';
    }
    const data = await res.json();
    const textBlock = data.content?.find((block) => block.type === 'text');
    return (textBlock?.text || '').trim();
  } catch (err) {
    console.warn('[newsBrief] brief generation failed:', err.message);
    return '';
  } finally {
    clearTimeout(timeoutId);
  }
}

// The actual refresh: fetch every source, generate the brief, write both
// to news_brief_cache (id=1). Returns the row it wrote so callers (the
// interval loop, or an admin route) can log/inspect without a re-read.
async function refreshNewsBrief({ sql, anthropicApiKey, anthropicModel }) {
  const [headlines, videoClips] = await Promise.all([fetchAllHeadlines(), fetchAllVideoClips()]);
  const briefText = await generateBriefText(headlines, { anthropicApiKey, anthropicModel });

  // YouTube's public feed endpoint has proven flaky toward Vercel's
  // serverless IPs -- a channel that 404s this cycle often works the
  // next one. A cycle that comes back with zero clips (but the fetch
  // itself didn't throw) must not blow away whatever clips are already
  // cached; only overwrite video_clips when this cycle actually found
  // some. headlines/brief_text always overwrite since those sources
  // have been reliable and stale news is worse than an empty section.
  const rows = await sql`
    INSERT INTO news_brief_cache (id, headlines, brief_text, video_clips, updated_at)
    VALUES (1, ${JSON.stringify(headlines)}::jsonb, ${briefText}, ${JSON.stringify(videoClips)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET
      headlines = ${JSON.stringify(headlines)}::jsonb,
      brief_text = ${briefText},
      video_clips = CASE
        WHEN jsonb_array_length(${JSON.stringify(videoClips)}::jsonb) > 0
        THEN ${JSON.stringify(videoClips)}::jsonb
        ELSE news_brief_cache.video_clips
      END,
      updated_at = now()
    RETURNING headlines, brief_text, video_clips, updated_at
  `;
  return rows[0];
}

// Fixed 15-minute cadence -- no cron dependency needed for that. Skips
// overlapping runs (a slow refresh must never stack with the next
// timer tick) and never lets one failed cycle stop future ones.
function startNewsBriefRefreshLoop({ sql, anthropicApiKey, anthropicModel, intervalMs = 15 * 60 * 1000 }) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await refreshNewsBrief({ sql, anthropicApiKey, anthropicModel });
      console.log('[newsBrief] refresh cycle complete');
    } catch (err) {
      console.error('[newsBrief] refresh cycle failed:', err);
    } finally {
      running = false;
    }
  };
  tick(); // seed the cache on boot rather than waiting 15 minutes
  return setInterval(tick, intervalMs);
}

module.exports = { fetchAllHeadlines, fetchAllVideoClips, generateBriefText, refreshNewsBrief, startNewsBriefRefreshLoop };
