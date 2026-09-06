// Local AsyncStorage caching for Bible Trivia's Daily Challenge, mirroring
// devotions.ts's getDailyPromise() -- the SERVER already computes/caches
// one shared set per calendar date (see server.js's
// computeOrGetDailySlice), so this is client-side redundancy on top of
// that: a device that already fetched today's set doesn't re-hit the
// network every time the Trivia screen reopens the same day.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDailyChallenge, type DailyChallenge } from './triviaApi';

const DAILY_CACHE_PREFIX = 'ji_trivia_daily_v1_';
const COMPLETED_PREFIX = 'ji_trivia_daily_completed_v1_';

function todayKey(date: Date = new Date()): string {
  // Local calendar date, matching how the rest of the app keys daily
  // caches (see devotions.ts's own comment on using local, not UTC, time)
  // -- close enough to the server's UTC date for the "don't refetch
  // today" purpose this cache serves; a mismatch at most re-fetches once
  // near midnight, never shows stale data.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function getDailyChallenge(date: Date = new Date()): Promise<DailyChallenge> {
  const key = todayKey(date);
  const cacheKey = `${DAILY_CACHE_PREFIX}${key}`;

  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as DailyChallenge;
    } catch {
      // Fall through and refetch if the cached value is somehow corrupt.
    }
  }

  const challenge = await fetchDailyChallenge();
  await AsyncStorage.setItem(cacheKey, JSON.stringify(challenge)).catch(() => {});
  return challenge;
}

// Whether this device has already submitted a Daily Challenge score
// today -- set by ScoreView after a successful submitTriviaScore call,
// checked by ModeSelectView to disable replaying today's set for a
// second leaderboard entry.
export async function hasCompletedDailyChallengeToday(date: Date = new Date()): Promise<boolean> {
  const value = await AsyncStorage.getItem(`${COMPLETED_PREFIX}${todayKey(date)}`);
  return value === '1';
}

export async function markDailyChallengeCompleted(date: Date = new Date()): Promise<void> {
  await AsyncStorage.setItem(`${COMPLETED_PREFIX}${todayKey(date)}`, '1').catch(() => {});
}
