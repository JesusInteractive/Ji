// Live search against the Internet Archive's public catalog
// (archive.org/advancedsearch.php -- no key, no signup, verified working
// live) for public-domain/free Christian books, commentaries, and
// testimonies in a given language. No hosting or bulk downloading of
// content here -- this only fetches metadata + a details-page link per
// result; GlobalLibraryScreen opens that link (archive.org's own reader)
// rather than this app trying to render arbitrary book formats itself.

import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = 'https://archive.org/advancedsearch.php';
const CACHE_PREFIX = 'ji_christian_lib_cache_';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // a week -- this catalog changes slowly

export interface ChristianLibraryItem {
  identifier: string;
  title: string;
  creator?: string;
  year?: number;
  language?: string;
  detailsUrl: string; // archive.org's own reader/details page for this item
}

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
  if (!res.ok) throw new Error(`Archive.org search failed (${res.status})`);
  const data = (await res.json()) as T;
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // Cache write failure is non-fatal.
  }
  return data;
}

// languageEnglishName: e.g. "Swahili", "Korean" -- matched against
// Internet Archive's own (inconsistently-coded, but name-searchable)
// language metadata field, which is far more robust across 117 languages
// than trying to maintain a second ISO-code mapping table for this
// entirely separate catalog.
export async function searchChristianLibrary(
  languageEnglishName: string,
  rows = 30
): Promise<ChristianLibraryItem[]> {
  const q = `subject:(christian OR bible OR gospel OR sermon OR testimony OR scripture) AND mediatype:texts AND language:("${languageEnglishName}")`;
  const params = new URLSearchParams({
    q,
    rows: String(rows),
    output: 'json',
  });
  params.append('fl[]', 'identifier');
  params.append('fl[]', 'title');
  params.append('fl[]', 'creator');
  params.append('fl[]', 'year');
  params.append('fl[]', 'language');

  const url = `${BASE}?${params.toString()}`;
  const data = await cachedFetch<any>(`search_${languageEnglishName}`, url);
  const docs = data?.response?.docs ?? [];
  return docs.map((d: any) => ({
    identifier: d.identifier,
    title: d.title || d.identifier,
    creator: Array.isArray(d.creator) ? d.creator[0] : d.creator,
    year: typeof d.year === 'number' ? d.year : undefined,
    language: Array.isArray(d.language) ? d.language[0] : d.language,
    detailsUrl: `https://archive.org/details/${d.identifier}`,
  }));
}
