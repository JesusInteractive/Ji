import type { BibleBook } from '../services/bibleApi';

export interface ParsedReference {
  book: BibleBook;
  chapter: number;
  verse?: number;
}

const REFERENCE_PATTERN = /^(.+?)\s+(\d+)(?::(\d+))?\s*$/;

// HomeScreen's Quick Scripture Search bar hands raw typed text here (e.g.
// "John 3:16", "Galatians 1:1", "Genesis 1"). Matches the trailing
// chapter[:verse] first, then fuzzy-matches whatever's left against the
// already-loaded book list -- exact name match wins, otherwise the first
// book whose name starts with (or is started by) the typed text, so "1
// john" still finds "1 John" and "gal" still finds "Galatians". Returns
// null for anything that isn't a "book chapter[:verse]" shape (a bare
// book name, a keyword, etc.) so the caller can fall back to its
// existing book-list filter instead.
export function parseScriptureReference(query: string, books: BibleBook[]): ParsedReference | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const match = trimmed.match(REFERENCE_PATTERN);
  if (!match) return null;

  const bookPart = match[1].trim().toLowerCase();
  const chapter = parseInt(match[2], 10);
  const verse = match[3] ? parseInt(match[3], 10) : undefined;
  if (!bookPart || !Number.isFinite(chapter) || chapter < 1) return null;

  const book =
    books.find((b) => b.name.toLowerCase() === bookPart) ??
    books.find((b) => b.name.toLowerCase().startsWith(bookPart)) ??
    books.find((b) => bookPart.startsWith(b.name.toLowerCase()));
  if (!book) return null;

  if (book.chapters && chapter > book.chapters) return null;

  return { book, chapter, verse };
}
