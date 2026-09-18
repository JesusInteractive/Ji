// Client for backend/server.js's GET /v1/news-brief -- the "Jesus
// Interactive News Brief" cache (deduped headlines + a generated "Now
// Brief" paragraph), fetched at runtime the same way radioApi.ts fetches
// the 24/7 radio config. The backend refreshes this cache itself every
// 15 minutes (see backend/newsBrief.js); this client never touches any
// publisher's RSS feed directly.
import { withAuthRetry } from './backendAuth';

const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.jesusinteractive.com';

async function request<T>(path: string, authToken: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API request failed (${res.status}): ${path} ${body}`);
  }
  return res.json() as Promise<T>;
}

export interface NewsBriefHeadline {
  title: string;
  summary: string;
  link: string;
  source: string;
  publishedAt: string | null;
}

// Public YouTube clips from backend/newsBriefVideoSources.js, embedded
// via YouTube's own player (see YouTubePlayer.tsx) -- never re-hosted.
export interface NewsBriefVideoClip {
  videoId: string;
  title: string;
  channelName: string;
  link: string;
  publishedAt: string | null;
  thumbnailUrl: string;
}

export interface NewsBrief {
  headlines: NewsBriefHeadline[];
  videoClips: NewsBriefVideoClip[];
  briefText: string;
  updatedAt: string;
}

export async function fetchNewsBrief(): Promise<NewsBrief> {
  return withAuthRetry((token) => request<NewsBrief>('/v1/news-brief', token));
}
