// Client-side caching + rate-limit awareness. Real rate limiting and load
// balancing MUST be enforced server-side (a client can always be
// bypassed) -- this module documents the intended architecture and
// implements the honest client-side half: response caching and a
// polite local throttle so a chatty UI doesn't hammer the API.
//
// SERVER-SIDE ARCHITECTURE (implement in your backend, not here):
// - Per-user token bucket rate limiting keyed on account ID + plan tier
//   (Free/Basic/Pro/Platinum daily limits from src/constants/pricing.ts
//   are enforced here, server-side -- never trust the client's counter).
// - A queue + worker pool in front of the model API so traffic spikes
//   degrade gracefully (longer wait) instead of failing outright; Pro/
//   Platinum requests can jump the queue for "priority responses."
// - Response caching for deterministic, non-personal content only (e.g.
//   the daily verse, Bible text, prophecy list) -- never cache or share
//   one user's personal chat response with another user.
// - Horizontal scaling behind a load balancer, health checks, and
//   circuit breaking to the upstream model API so one slow dependency
//   doesn't take the whole service down.

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'ji_cache_';

export async function getCached<T>(key: string, maxAgeMs: number): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > maxAgeMs) return null;
    return data as T;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, savedAt: Date.now() })
    );
  } catch {
    // Non-fatal: cache write failures shouldn't break the caller.
  }
}

// A minimal client-side throttle: prevents accidental double-sends (e.g.
// a fast double-tap on "Send") -- NOT a substitute for server rate
// limiting, which is the real enforcement point for plan daily limits.
let lastSendAt = 0;
const MIN_SEND_INTERVAL_MS = 600;

export function canSendNow(): boolean {
  const now = Date.now();
  if (now - lastSendAt < MIN_SEND_INTERVAL_MS) return false;
  lastSendAt = now;
  return true;
}
