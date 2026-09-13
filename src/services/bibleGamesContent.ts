// The ONE shared content library every Jesus Interactive Bible Games
// screen reads from -- built on the bundled World English Bible dataset
// (src/data/web-bible/*.json + bible-word-index.json +
// scrabble-vocabulary.json, generated once by scripts/fetch-web-bible.js,
// see that script's own comment). Everything here is fully offline: no
// network call, no AsyncStorage, just local `require()`d JSON, loaded and
// memoized lazily on first access so an app launch that never opens the
// Games hub never pays the parse cost of any of this.
//
// This is deliberately separate from src/services/bibleApi.ts, which
// fetches whatever translation a user picks, one chapter at a time, live
// -- that's for reading Scripture. This module is for procedurally
// generating game content from ONE bundled, offline, public-domain
// translation (WEB), and never makes a network request.
import BOOK_META from '../data/web-bible-books.json';

export type Testament = 'OT' | 'NT';

export interface VerseRef {
  bookId: string;
  chapter: number;
  verse: number;
}

export interface VerseRecord {
  ref: VerseRef;
  text: string;
  bookName: string;
  testament: Testament;
}

export interface BibleCharacter {
  id: string;
  name: string;
  aliases: string[];
  testament: Testament;
  category: string; // e.g. 'patriarch', 'prophet', 'apostle', 'king', 'judge'
  summary: string;
  traits: string[];
  keyReferences: VerseRef[];
}

export interface TimelineEvent {
  id: string;
  order: number;
  title: string;
  era: string;
  summary: string;
  keyReferences: VerseRef[];
  relatedCharacterIds: string[];
}

interface BookFile {
  id: string;
  name: string;
  commonName: string;
  testament: Testament;
  order: number;
  chapters: { number: number; verses: { number: number; text: string }[] }[];
}

type WordRef = { b: string; c: number; v: number };

// Static require() map -- Metro needs a literal path per call, a
// dynamically-computed require(bookId) won't bundle correctly. Generated
// mechanically from the same 66 ids scripts/fetch-web-bible.js writes.
const BOOK_FILES: Record<string, () => BookFile> = {
  GEN: () => require('../data/web-bible/GEN.json'),
  EXO: () => require('../data/web-bible/EXO.json'),
  LEV: () => require('../data/web-bible/LEV.json'),
  NUM: () => require('../data/web-bible/NUM.json'),
  DEU: () => require('../data/web-bible/DEU.json'),
  JOS: () => require('../data/web-bible/JOS.json'),
  JDG: () => require('../data/web-bible/JDG.json'),
  RUT: () => require('../data/web-bible/RUT.json'),
  '1SA': () => require('../data/web-bible/1SA.json'),
  '2SA': () => require('../data/web-bible/2SA.json'),
  '1KI': () => require('../data/web-bible/1KI.json'),
  '2KI': () => require('../data/web-bible/2KI.json'),
  '1CH': () => require('../data/web-bible/1CH.json'),
  '2CH': () => require('../data/web-bible/2CH.json'),
  EZR: () => require('../data/web-bible/EZR.json'),
  NEH: () => require('../data/web-bible/NEH.json'),
  EST: () => require('../data/web-bible/EST.json'),
  JOB: () => require('../data/web-bible/JOB.json'),
  PSA: () => require('../data/web-bible/PSA.json'),
  PRO: () => require('../data/web-bible/PRO.json'),
  ECC: () => require('../data/web-bible/ECC.json'),
  SNG: () => require('../data/web-bible/SNG.json'),
  ISA: () => require('../data/web-bible/ISA.json'),
  JER: () => require('../data/web-bible/JER.json'),
  LAM: () => require('../data/web-bible/LAM.json'),
  EZK: () => require('../data/web-bible/EZK.json'),
  DAN: () => require('../data/web-bible/DAN.json'),
  HOS: () => require('../data/web-bible/HOS.json'),
  JOL: () => require('../data/web-bible/JOL.json'),
  AMO: () => require('../data/web-bible/AMO.json'),
  OBA: () => require('../data/web-bible/OBA.json'),
  JON: () => require('../data/web-bible/JON.json'),
  MIC: () => require('../data/web-bible/MIC.json'),
  NAM: () => require('../data/web-bible/NAM.json'),
  HAB: () => require('../data/web-bible/HAB.json'),
  ZEP: () => require('../data/web-bible/ZEP.json'),
  HAG: () => require('../data/web-bible/HAG.json'),
  ZEC: () => require('../data/web-bible/ZEC.json'),
  MAL: () => require('../data/web-bible/MAL.json'),
  MAT: () => require('../data/web-bible/MAT.json'),
  MRK: () => require('../data/web-bible/MRK.json'),
  LUK: () => require('../data/web-bible/LUK.json'),
  JHN: () => require('../data/web-bible/JHN.json'),
  ACT: () => require('../data/web-bible/ACT.json'),
  ROM: () => require('../data/web-bible/ROM.json'),
  '1CO': () => require('../data/web-bible/1CO.json'),
  '2CO': () => require('../data/web-bible/2CO.json'),
  GAL: () => require('../data/web-bible/GAL.json'),
  EPH: () => require('../data/web-bible/EPH.json'),
  PHP: () => require('../data/web-bible/PHP.json'),
  COL: () => require('../data/web-bible/COL.json'),
  '1TH': () => require('../data/web-bible/1TH.json'),
  '2TH': () => require('../data/web-bible/2TH.json'),
  '1TI': () => require('../data/web-bible/1TI.json'),
  '2TI': () => require('../data/web-bible/2TI.json'),
  TIT: () => require('../data/web-bible/TIT.json'),
  PHM: () => require('../data/web-bible/PHM.json'),
  HEB: () => require('../data/web-bible/HEB.json'),
  JAS: () => require('../data/web-bible/JAS.json'),
  '1PE': () => require('../data/web-bible/1PE.json'),
  '2PE': () => require('../data/web-bible/2PE.json'),
  '1JN': () => require('../data/web-bible/1JN.json'),
  '2JN': () => require('../data/web-bible/2JN.json'),
  '3JN': () => require('../data/web-bible/3JN.json'),
  JUD: () => require('../data/web-bible/JUD.json'),
  REV: () => require('../data/web-bible/REV.json'),
};

const bookCache = new Map<string, BookFile>();
function loadBook(bookId: string): BookFile {
  let book = bookCache.get(bookId);
  if (!book) {
    const loader = BOOK_FILES[bookId];
    if (!loader) throw new Error(`Unknown book id: ${bookId}`);
    book = loader();
    bookCache.set(bookId, book);
  }
  return book;
}

// Deterministic PRNG -- same mulberry32 shape src/services/wordSearchPuzzle.ts
// already uses, so every game in this feature shares one house RNG
// convention (seed in, reproducible sequence out).
export function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: T[], rand: () => number): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getVerse(ref: VerseRef): VerseRecord {
  const book = loadBook(ref.bookId);
  const chapter = book.chapters.find((c) => c.number === ref.chapter);
  const verse = chapter?.verses.find((v) => v.number === ref.verse);
  if (!chapter || !verse) throw new Error(`Verse not found: ${ref.bookId} ${ref.chapter}:${ref.verse}`);
  return { ref, text: verse.text, bookName: book.commonName, testament: book.testament };
}

const BOOK_IDS = Object.keys(BOOK_FILES);

// Cheap random-verse picker for games that just need "some verse" (e.g.
// Fill-in-the-Blank) -- picks a book/chapter/verse uniformly by index
// rather than loading every book to know exact verse counts up front.
// Retries on out-of-range picks (chapters/verses vary per book), bounded
// so a bad seed can't spin forever.
export function getRandomVerse(seed: number, filters?: { testament?: Testament; bookIds?: string[] }): VerseRecord {
  const rand = mulberry32(seed);
  const pool = filters?.bookIds ?? BOOK_IDS;
  for (let attempt = 0; attempt < 50; attempt++) {
    const bookId = pool[Math.floor(rand() * pool.length)];
    const book = loadBook(bookId);
    if (filters?.testament && book.testament !== filters.testament) continue;
    const chapter = book.chapters[Math.floor(rand() * book.chapters.length)];
    const verse = chapter.verses[Math.floor(rand() * chapter.verses.length)];
    return { ref: { bookId, chapter: chapter.number, verse: verse.number }, text: verse.text, bookName: book.commonName, testament: book.testament };
  }
  throw new Error('getRandomVerse: could not find a verse matching filters');
}

// --- Word index (src/data/bible-word-index.json) ---------------------
let wordIndexCache: Record<string, WordRef[]> | null = null;
function getRawWordIndex(): Record<string, WordRef[]> {
  if (!wordIndexCache) {
    wordIndexCache = require('../data/bible-word-index.json');
  }
  return wordIndexCache!;
}

export function getWordOccurrences(word: string): VerseRef[] {
  const refs = getRawWordIndex()[word.toLowerCase()] ?? [];
  return refs.map((r) => ({ bookId: r.b, chapter: r.c, verse: r.v }));
}

let wordsByLengthCache: Map<number, string[]> | null = null;
export function getWordsByLength(len: number): string[] {
  if (!wordsByLengthCache) {
    wordsByLengthCache = new Map();
    for (const word of Object.keys(getRawWordIndex())) {
      const arr = wordsByLengthCache.get(word.length) ?? [];
      arr.push(word);
      wordsByLengthCache.set(word.length, arr);
    }
  }
  return wordsByLengthCache.get(len) ?? [];
}

export function getAllIndexedWords(): string[] {
  return Object.keys(getRawWordIndex());
}

// --- Scrabble vocabulary (src/data/scrabble-vocabulary.json) ---------
let vocabularySetCache: Set<string> | null = null;
export function getVocabularySet(): Set<string> {
  if (!vocabularySetCache) {
    const list: string[] = require('../data/scrabble-vocabulary.json');
    vocabularySetCache = new Set(list);
  }
  return vocabularySetCache;
}

export function isLegalWord(word: string): boolean {
  return getVocabularySet().has(word.toLowerCase());
}

// --- Book metadata (id/name/testament/order, no verse text) -----------
export interface BookMeta {
  id: string;
  name: string;
  commonName: string;
  testament: Testament;
  order: number;
}
export function getBookMeta(): BookMeta[] {
  return BOOK_META as BookMeta[];
}

// --- Curated datasets (hand-authored, see their own files) -----------
export function getCharacters(): BibleCharacter[] {
  return require('../data/bibleCharacters').BIBLE_CHARACTERS;
}

export function getTimelineEvents(): TimelineEvent[] {
  return require('../data/bibleTimeline').BIBLE_TIMELINE;
}

// A character's own curated keyReferences PLUS every verse where their
// literal name/alias appears as an ordinary word in the text (names like
// "David" or "Moses" genuinely are indexed words) -- the curated roster
// itself can't be automated (see this file's own top comment), but once
// a character exists, most of their verse pool is text-derived, not
// hand-picked one at a time.
export function getCharacterVerses(characterId: string, seed?: number): VerseRef[] {
  const character = getCharacters().find((c) => c.id === characterId);
  if (!character) return [];
  const fromNameIndex = [character.name, ...character.aliases].flatMap((n) => getWordOccurrences(n));
  const all = [...character.keyReferences, ...fromNameIndex];
  return seed !== undefined ? seededShuffle(all, mulberry32(seed)) : all;
}
