// Client for backend/server.js's /v1/testimonies* and /v1/device/heartbeat
// routes -- the live, shared Testimony Stream (TestimonyStreamScreen.tsx) and
// the plan-heartbeat that backs the developer's /v1/admin/stats view
// (user count, subscriptions). Testimonies are always public and always
// anonymous by design (see server.js's own comment on POST
// /v1/testimonies) -- there is no author field anywhere in this flow.
import { withAuthRetry } from './backendAuth';
import { getDeviceId } from './deviceId';
import type { PlanId } from '../types';

const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.jesusinteractive.com';

async function request<T>(path: string, authToken: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API request failed (${res.status}): ${path} ${body}`);
  }
  return res.json() as Promise<T>;
}

// Must match backend/server.js's ALLOWED_REACTION_EMOJI exactly -- the
// server rejects anything outside this set, so the two lists drifting
// apart would make a reaction silently fail.
export const REACTION_EMOJI = ['🙏', '❤️', '🙌', '🔥', '✨'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJI)[number];

export interface RemoteTestimony {
  id: string;
  text: string;
  createdAt: string;
  reactions: { emoji: string; count: number }[];
  myReactions: string[];
}

export async function fetchTestimonies(before?: string): Promise<RemoteTestimony[]> {
  const deviceId = await getDeviceId();
  const params = new URLSearchParams({ deviceId });
  if (before) params.set('before', before);
  const data = await withAuthRetry((token) =>
    request<{ testimonies: RemoteTestimony[] }>(`/v1/testimonies?${params.toString()}`, token)
  );
  return data.testimonies;
}

export async function reactToTestimony(
  id: string,
  emoji: ReactionEmoji
): Promise<{ reactions: { emoji: string; count: number }[]; myReactions: string[] }> {
  const deviceId = await getDeviceId();
  return withAuthRetry((token) =>
    request(`/v1/testimonies/${id}/react`, token, {
      method: 'POST',
      body: JSON.stringify({ deviceId, emoji }),
    })
  );
}

export async function postTestimony(text: string): Promise<RemoteTestimony> {
  const deviceId = await getDeviceId();
  return withAuthRetry((token) =>
    request<RemoteTestimony>('/v1/testimonies', token, {
      method: 'POST',
      body: JSON.stringify({ deviceId, text }),
    })
  );
}

export interface TestimonyStats {
  total: number;
  today: number;
}

export async function fetchTestimonyStats(): Promise<TestimonyStats> {
  return withAuthRetry((token) => request<TestimonyStats>('/v1/testimonies/stats', token));
}

export async function reportTestimony(id: string): Promise<void> {
  const deviceId = await getDeviceId();
  await withAuthRetry((token) =>
    request<{ ok: boolean }>(`/v1/testimonies/${id}/report`, token, {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    })
  );
}

// Fire-and-forget from AppContext on launch and whenever selectPlan()
// changes the plan -- failures are swallowed (analytics, not a feature
// gate) so a flaky network never blocks app usage. Returns the server's
// createdAt for this device (null on any failure) -- AppContext uses
// this as the server-anchored trial start (see its own trialStartedAt
// comment): the server's value always wins over anything cached
// locally, so clearing local app storage alone can't reset the 5-day
// trial clock.
export async function sendDeviceHeartbeat(
  plan: PlanId,
  planExpiresAt: string | null
): Promise<{ createdAt: string } | null> {
  try {
    const deviceId = await getDeviceId();
    const result = await withAuthRetry((token) =>
      request<{ ok: boolean; createdAt: string }>('/v1/device/heartbeat', token, {
        method: 'POST',
        body: JSON.stringify({ deviceId, plan, planExpiresAt }),
      })
    );
    return { createdAt: result.createdAt };
  } catch {
    // Best-effort only.
    return null;
  }
}
