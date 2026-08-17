// Bible text client -- Free Use Bible API (https://bible.helloao.org).
// No key, no signup, cleared for commercial use. Default translation BSB.
//
// NOTE: this sandbox's network allowlist blocks bible.helloao.org, so the
// exact chapter-response shape below is written from the documented API
// pattern rather than a live test response. normalizeChapter() is
// deliberately defensive about field names. Test against a real
// device/simulator with network access before shipping.

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BibleBook {
  id: string;
  name: string;
  testament: 'Old Testament' | 'New Testament';
  chapters: number;
}

export interface BibleVerse {
  number: number;
  text: string;
}

export interface BibleChapter {
  number: number;
  verses: BibleVerse[];
}

export interface BibleTranslation {
  id: string;
  name: string;
  language: string;
}

const BASE = 'https://bible.helloao.org/api';
const DEFAULT_TRANSLATION = 'BSB';
const CACHE_PREFIX = 'ji_bible_cache_';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

async function cachedFetch<T>(cacheKey: string, url: string): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + cacheKey);
    if (raw) {
      const { data, savedAt } = JSON.parse(raw);
      if (Date.now() - savedAt < CACHE_TTL_MS) return data as T;
    }
  } catch {
    // Cache read failure should never block a fetch.
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Bible API request failed (${res.status}): ${url}`);
  const data = (await res.json()) as T;

  try {
    await AsyncStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // Cache write failure is non-fatal.
  }
  return data;
}

// Shown if the live /available_translations.json call fails (offline,
// endpoint moved, etc.) so the picker in ScriptureSearchScreen never
// renders empty -- a small set of well-known free/public-domain English
// translations this API hosts. Not exhaustive; the live list (when
// reachable) is always preferred and typically includes many more,
// including non-English translations.
const FALLBACK_TRANSLATIONS: BibleTranslation[] = [
  { id: 'BSB', name: 'Berean Standard Bible', language: 'eng' },
  { id: 'KJV', name: 'King James Version', language: 'eng' },
  { id: 'ASV', name: 'American Standard Version', language: 'eng' },
  { id: 'WEB', name: 'World English Bible', language: 'eng' },
  { id: 'YLT', name: "Young's Literal Translation", language: 'eng' },
  // Original-language texts, both public domain / openly licensed
  // (unfoldingWord's Door43 editions). getBooks() naturally scopes each
  // to the testament it actually covers -- UHB's own books.json only
  // lists the Old Testament, UGNT's only the New -- so no extra
  // client-side filtering is needed for these.
  { id: 'UHB', name: 'Hebrew Old Testament (UHB)', language: 'heb' },
  { id: 'UGNT', name: 'Greek New Testament (UGNT)', language: 'grc' },
];

// English translations first, then everything else in whatever order the
// API returned it (stable sort -- only the eng/non-eng grouping changes,
// nothing is alphabetized within each group). Most users picking a
// translation are looking for an English one; without this, the live
// API's own ordering (not English-first) made them scroll past every
// other language's editions first.
function englishFirst(translations: BibleTranslation[]): BibleTranslation[] {
  return [...translations].sort((a, b) => {
    const aEng = a.language?.toLowerCase().startsWith('eng') ? 0 : 1;
    const bEng = b.language?.toLowerCase().startsWith('eng') ? 0 : 1;
    return aEng - bEng;
  });
}

export async function getTranslations(): Promise<BibleTranslation[]> {
  try {
    const data = await cachedFetch<any>('translations', `${BASE}/available_translations.json`);
    const list = data.translations || data;
    const translations: BibleTranslation[] = list.map((t: any) => ({
      id: t.id || t.abbreviation || t.shortName,
      name: t.name || t.englishName || t.title || t.id,
      language: t.language || t.languageName || 'eng',
    }));
    return translations.length ? englishFirst(translations) : FALLBACK_TRANSLATIONS;
  } catch {
    return FALLBACK_TRANSLATIONS;
  }
}

export async function getBooks(translation = DEFAULT_TRANSLATION): Promise<BibleBook[]> {
  const data = await cachedFetch<any>(`books_${translation}`, `${BASE}/${translation}/books.json`);
  const books = data.books || data;
  return books.map((b: any, i: number) => ({
    id: b.id || b.bookId || String(i + 1),
    name: b.commonName || b.name || b.id,
    testament: b.order != null && b.order > 39 ? 'New Testament' : b.testament || 'Old Testament',
    chapters: b.numberOfChapters || b.chapters || b.chapterCount || 0,
  }));
}

function normalizeChapter(raw: any): BibleChapter {
  const chapterContent = raw?.chapter?.content ?? raw?.content ?? raw?.verses ?? [];
  const verses: BibleVerse[] = chapterContent
    .filter((item: any) => (item.type ? item.type === 'verse' : true))
    .map((item: any) => {
      const text = Array.isArray(item.content)
        ? item.content.filter((c: any) => typeof c === 'string').join(' ')
        : item.text || item.content || '';
      return { number: item.number ?? item.verse, text: String(text).trim() };
    })
    .filter((v: BibleVerse) => v.text);
  return { number: raw?.chapter?.number ?? raw?.number, verses };
}

export async function getChapter(
  bookId: string,
  chapterNumber: number,
  translation = DEFAULT_TRANSLATION
): Promise<BibleChapter> {
  const data = await cachedFetch<any>(
    `chapter_${translation}_${bookId}_${chapterNumber}`,
    `${BASE}/${translation}/${bookId}/${chapterNumber}.json`
  );
  return normalizeChapter(data);
}

export async function clearBibleCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const bibleKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
  await AsyncStorage.multiRemove(bibleKeys);
}

// "Torah" (the first five books) and "Talmud" quick-access, per spec
// section 3. Torah maps directly onto Genesis-Deuteronomy in the Bible
// API above. The Talmud is a separate, much larger rabbinic corpus not
// covered by this API -- Sefaria (sefaria.org) has a free public API
// with Talmud text; wire a second client for it the same way as this
// file once you're ready to add that source.
export const TORAH_BOOK_IDS = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU'];
