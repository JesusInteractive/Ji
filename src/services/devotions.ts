// Client for Daily Devotions -- combines the deterministic reading plan
// (constants/devotionalReadingPlan.ts) with the backend's AI-generated
// reflection/prayer (backend/server.js's POST /v1/devotions/generate)
// and the app's existing Bible API (services/bibleApi.ts) for the day's
// actual scripture text, then caches the assembled result locally so a
// given day+year+language combination is only generated once, not
// re-requested (and re-billed) on every screen visit.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDayOfYear, getDevotionForDay, BIBLE_BOOKS, type DevotionDay } from '../constants/devotionalReadingPlan';
import { getChapter } from './bibleApi';
import { withAuthRetry } from './backendAuth';
import { PROMISES_OF_GOD, type PromiseReference } from '../constants/promisesOfGod';

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
  // Local year, not UTC -- same reasoning as getDayOfYear in
  // devotionalReadingPlan.ts: keeps this in sync with the day-of-year
  // calculation right around New Year's, where UTC and local year can
  // briefly disagree depending on timezone.
  return ((date.getFullYear() % 3) + 3) % 3;
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

export interface DailyVerse {
  day: number;
  reference: string;
  text: string;
}

const DAILY_VERSE_CACHE_PREFIX = 'ji_daily_verse_v1_';

// A lightweight sibling to getDevotion() above -- for a quick "verse of
// the day" teaser (Home screen), not the full devotion. Deliberately
// does NOT call generateReflectionAndPrayer(): that's a billed
// Anthropic request, and firing it every time someone opens Home (not
// just when they actually open Daily Devotions) would multiply real
// cost for no benefit -- this only fetches the first verse of the
// day's passage via the same free Bible API Scripture already uses.
// Cached separately from the full devotion (its own key/shape), so
// visiting Home never triggers or depends on the full devotion having
// been generated first.
export async function getDailyVerse(translationId: string, date: Date = new Date()): Promise<DailyVerse> {
  const day = getDayOfYear(date);
  const plan: DevotionDay = getDevotionForDay(day);
  const cacheKey = `${DAILY_VERSE_CACHE_PREFIX}${day}_${translationId}`;

  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as DailyVerse;
    } catch {
      // Fall through and refetch if the cached value is somehow corrupt.
    }
  }

  const chapter = await getChapter(plan.bookId, plan.chapterStart, translationId);
  const firstVerse = chapter.verses[0];
  const dailyVerse: DailyVerse = {
    day,
    reference: `${plan.reference.replace(/\s+\d+(-\d+)?$/, '')} ${plan.chapterStart}:${firstVerse.number}`,
    text: firstVerse.text,
  };

  await AsyncStorage.setItem(cacheKey, JSON.stringify(dailyVerse)).catch(() => {});
  return dailyVerse;
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

// ---------------------------------------------------------------------
// Today's Promise -- a curated, independently-assembled list of 365 real
// Bible promise references (see constants/promisesOfGod.ts for the full
// provenance note on why this is safe from a copyright standpoint: only
// bare book/chapter/verse references are stored, never any third
// party's paraphrase, and the actual inspired text is always fetched
// live here exactly like every other Scripture feature in this app).
// This is a sibling to getDailyVerse() above, NOT a replacement for it
// in this file -- it follows the identical fetch/cache pattern but reads
// from PROMISES_OF_GOD instead of the devotional reading plan, so a
// given day's "promise" is a real, on-topic promise verse rather than
// wherever the 365-day reading plan happens to land that day.
// ---------------------------------------------------------------------

export interface DailyPromise {
  day: number;
  reference: string;
  text: string;
}

const DAILY_PROMISE_CACHE_PREFIX = 'ji_daily_promise_v1_';

// Same 3-letter -> display-name lookup the rest of this app already
// uses (BIBLE_BOOKS from devotionalReadingPlan.ts) -- reused here rather
// than hardcoding a second book-name table.
function getBookDisplayName(bookId: string): string {
  return BIBLE_BOOKS.find((b) => b.id === bookId)?.name ?? bookId;
}

export async function getDailyPromise(translationId: string, date: Date = new Date()): Promise<DailyPromise> {
  const day = getDayOfYear(date);
  const entry: PromiseReference = PROMISES_OF_GOD[day - 1];
  const cacheKey = `${DAILY_PROMISE_CACHE_PREFIX}${day}_${translationId}`;

  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as DailyPromise;
    } catch {
      // Fall through and refetch if the cached value is somehow corrupt.
    }
  }

  const chapter = await getChapter(entry.bookId, entry.chapter, translationId);
  const verseEnd = entry.verseEnd ?? entry.verseStart;
  const verses = chapter.verses.filter((v) => v.number >= entry.verseStart && v.number <= verseEnd);
  const text = verses.map((v) => v.text).join(' ');

  const verseLabel = entry.verseEnd ? `${entry.verseStart}-${entry.verseEnd}` : `${entry.verseStart}`;
  const dailyPromise: DailyPromise = {
    day,
    reference: `${getBookDisplayName(entry.bookId)} ${entry.chapter}:${verseLabel}`,
    text,
  };

  await AsyncStorage.setItem(cacheKey, JSON.stringify(dailyPromise)).catch(() => {});
  return dailyPromise;
}
