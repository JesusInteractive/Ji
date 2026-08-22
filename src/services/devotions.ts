// Client for Daily Devotions -- combines the deterministic reading plan
// (constants/devotionalReadingPlan.ts) with the backend's AI-generated
// reflection/prayer (backend/server.js's POST /v1/devotions/generate)
// and the app's existing Bible API (services/bibleApi.ts) for the day's
// actual scripture text, then caches the assembled result locally so a
// given day+year+language combination is only generated once, not
// re-requested (and re-billed) on every screen visit.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDayOfYear, getDevotionForDay, type DevotionDay } from '../constants/devotionalReadingPlan';
import { getChapter } from './bibleApi';
import { withAuthRetry } from './backendAuth';

const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.jesusinteractive.com';
// v2: verses now carry a `chapter` field (see fetchPassageVerses) --
// bumped so any devotion cached under the old shape (no chapter field,
// which broke multi-chapter passages' React keys) gets regenerated
// instead of being read back stale.
const CACHE_KEY_PREFIX = 'ji_devotion_v2_';

export interface Devotion {
  day: number;
  year: number;
  reference: string;
  verses: { chapter: number; number: number; text: string }[];
  reflection: string;
  prayer: string;
}

// "Year" here is a 3-way rotating devotional lens (see backend's
// DEVOTION_LENSES), not a literal saved year -- deriving it from the
// actual calendar year means it advances automatically with no extra
// state to persist, satisfying "yearly shuffling" without a counter that
// could drift out of sync with reality.
export function getDevotionYear(date: Date = new Date()): number {
  return ((date.getUTCFullYear() % 3) + 3) % 3;
}

async function generateReflectionAndPrayer(
  reference: string,
  year: number,
  languageCode: string
): Promise<{ reflection: string; prayer: string }> {
  return withAuthRetry(async (token) => {
    const res = await fetch(`${API_BASE_URL}/v1/devotions/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reference, year, languageCode }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Devotion generation failed (${res.status}): ${body}`);
    }
    return res.json();
  });
}

// Fetches (or returns the cached) devotion for a given day/year, in the
// given Bible translation and app language. Assembles real scripture
// text (via the same getChapter() Scripture screen uses) alongside the
// AI-generated reflection/prayer, so the passage the user reads is
// always the actual translation text, never something baked into this
// app's bundle.
export async function getDevotion(
  translationId: string,
  languageCode: string,
  date: Date = new Date()
): Promise<Devotion> {
  const day = getDayOfYear(date);
  const year = getDevotionYear(date);
  const plan: DevotionDay = getDevotionForDay(day);
  const cacheKey = `${CACHE_KEY_PREFIX}${year}_${day}_${translationId}_${languageCode}`;

  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as Devotion;
    } catch {
      // Fall through and regenerate if the cached value is somehow corrupt.
    }
  }

  const [chapterVerses, { reflection, prayer }] = await Promise.all([
    fetchPassageVerses(plan, translationId),
    generateReflectionAndPrayer(plan.reference, year, languageCode),
  ]);

  const devotion: Devotion = {
    day,
    year,
    reference: plan.reference,
    verses: chapterVerses,
    reflection,
    prayer,
  };

  await AsyncStorage.setItem(cacheKey, JSON.stringify(devotion)).catch(() => {});
  return devotion;
}

// A devotion day can span multiple chapters (e.g. "Genesis 1-4") --
// fetches each chapter in the range and concatenates their verses in
// order. Verse numbers restart at 1 in every chapter, so each verse
// carries its own chapter number (not just implied by position) -- both
// so the UI has a stable unique key across a multi-chapter passage, and
// so it can label where one chapter ends and the next begins.
async function fetchPassageVerses(
  plan: DevotionDay,
  translationId: string
): Promise<{ chapter: number; number: number; text: string }[]> {
  const chapterNumbers: number[] = [];
  for (let c = plan.chapterStart; c <= plan.chapterEnd; c++) chapterNumbers.push(c);

  const chapters = await Promise.all(
    chapterNumbers.map((num) => getChapter(plan.bookId, num, translationId))
  );
  return chapters.flatMap((chapter) =>
    chapter.verses.map((v) => ({ chapter: chapter.number, number: v.number, text: v.text }))
  );
}
