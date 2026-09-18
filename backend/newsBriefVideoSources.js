// Public YouTube channels for the News Brief's video clips -- each
// channel's own public Atom feed (no API key needed):
//   https://www.youtube.com/feeds/videos.xml?channel_id=<id>
// Videos are embedded via YouTube's own official embed player
// (see YouTubePlayer.tsx), never re-hosted or downloaded -- same legal
// footing as linking to YouTube, just with our own chrome around their
// player. YouTube's own ads on a given video are entirely YouTube's/the
// channel's call; nothing here can or should try to strip them.
const NEWS_BRIEF_VIDEO_SOURCES = [
  { name: 'CBN News', channelId: 'UCYI_ychRnL7sJrG6PUSBpQA' },
  { name: 'GOD TV', channelId: 'UC1_JSuk0BSA_FWzSvMsezGg' },
];

module.exports = { NEWS_BRIEF_VIDEO_SOURCES };
