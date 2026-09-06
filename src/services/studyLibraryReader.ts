// Fetches and paginates the plain-text body of a Read Aloud title
// (constants/studyLibraryAudio.ts) directly from Project Gutenberg --
// live, on demand, cached locally after the first read. No server-side
// ingestion pipeline: Gutenberg's /cache/epub/{id}/pg{id}.txt URL shape
// is stable enough that fetching client-side, once, is the whole job.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReadAloudTitle } from '../constants/studyLibraryAudio';

const CACHE_PREFIX = 'ji_study_library_text_';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 days -- public-domain text never changes

export interface ReadAloudPage {
  index: number;
  paragraphs: string[];
}

// Strips Project Gutenberg's standard license header/footer block so the
// reader (and the voice reading it aloud) starts at the book's own first
// line, not boilerplate -- these markers have been stable across
// Gutenberg's whole catalog for years.
function stripGutenbergBoilerplate(raw: string): string {
  const startMarker = /\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i;
  const endMarker = /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i;
  const startMatch = raw.match(startMarker);
  const endMatch = raw.match(endMarker);
  const start = startMatch ? (startMatch.index ?? 0) + startMatch[0].length : 0;
  const end = endMatch ? endMatch.index ?? raw.length : raw.length;
  return raw.slice(start, end).trim();
}

function paginate(body: string, paragraphsPerPage = 6): ReadAloudPage[] {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0);

  const pages: ReadAloudPage[] = [];
  for (let i = 0; i < paragraphs.length; i += paragraphsPerPage) {
    pages.push({ index: pages.length, paragraphs: paragraphs.slice(i, i + paragraphsPerPage) });
  }
  return pages;
}

export async function getReadAloudPages(title: ReadAloudTitle): Promise<ReadAloudPage[]> {
  const cacheKey = CACHE_PREFIX + title.id;
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) {
      const { pages, savedAt } = JSON.parse(raw);
      if (Date.now() - savedAt < CACHE_TTL_MS) return pages as ReadAloudPage[];
    }
  } catch {
    // Cache read failure should never block a fetch.
  }

  const url = `https://www.gutenberg.org/cache/epub/${title.gutenbergId}/pg${title.gutenbergId}.txt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load this book's text (${res.status})`);
  const raw = await res.text();
  const body = stripGutenbergBoilerplate(raw);
  const pages = paginate(body);

  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify({ pages, savedAt: Date.now() }));
  } catch {
    // Cache write failure is non-fatal.
  }
  return pages;
}
