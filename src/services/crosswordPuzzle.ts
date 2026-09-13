// Deterministic Bible Crossword generator -- same house style as
// services/wordSearchPuzzle.ts (seeded PRNG in, reproducible puzzle out,
// "1000+ puzzles" satisfied by many valid seeds feeding one generator
// rather than hand-authored grids). Words and clues come straight from
// the shared content library (services/bibleGamesContent.ts), which is
// itself built from the bundled World English Bible text -- nothing
// here is hand-picked per puzzle.
import { getWordsByLength, getWordOccurrences, getVerse, mulberry32, seededShuffle, type VerseRef } from './bibleGamesContent';
import type { Difficulty } from '../data/gamesCatalog';

export const GRID_SIZE = 15;
const MAX_PLACEMENT_ATTEMPTS = 80;

// A short, generic English stopword list -- filters out function words
// (articles, pronouns, conjunctions) that are common in every chapter
// but make dull/impossible-to-clue crossword answers. Everything else
// in the shared word index is fair game; there's no part-of-speech data
// to lean on more precisely than this.
export const STOPWORDS = new Set([
  'the', 'and', 'of', 'to', 'in', 'that', 'he', 'shall', 'unto', 'for', 'i', 'his', 'a', 'they', 'be',
  'is', 'him', 'not', 'them', 'it', 'with', 'all', 'thou', 'was', 'which', 'my', 'me', 'their', 'as',
  'have', 'from', 'this', 'said', 'but', 'you', 'will', 'when', 'so', 'your', 'are', 'we', 'her', 'she',
  'were', 'there', 'then', 'if', 'who', 'what', 'also', 'out', 'up', 'on', 'by', 'or', 'at', 'one',
  'had', 'has', 'been', 'into', 'more', 'than', 'no', 'do', 'did', 'our', 'us', 'yet', 'now', 'over',
  'these', 'those', 'because', 'about', 'after', 'before', 'again', 'even', 'come', 'came', 'go', 'went',
]);

interface WordLengthRange {
  min: number;
  max: number;
  wordCount: number;
}

const DIFFICULTY_PARAMS: Record<Difficulty, WordLengthRange> = {
  easy: { min: 3, max: 7, wordCount: 13 },
  medium: { min: 4, max: 9, wordCount: 17 },
  hard: { min: 5, max: 12, wordCount: 20 },
};

export interface PlacedCrosswordWord {
  answer: string; // uppercase
  row: number;
  col: number;
  direction: 'across' | 'down';
  number: number;
  clue: string;
  reference: VerseRef;
}

export interface CrosswordPuzzle {
  seed: number;
  difficulty: Difficulty;
  size: number;
  // null = blocked/unused cell, otherwise the correct uppercase letter.
  solution: (string | null)[][];
  words: PlacedCrosswordWord[];
}

function buildClue(word: string, difficulty: Difficulty): { clue: string; reference: VerseRef } {
  const occurrences = getWordOccurrences(word);
  const reference = occurrences[0] ?? { bookId: 'GEN', chapter: 1, verse: 1 };
  if (difficulty === 'hard') {
    // Hard: book + chapter only, no verse text and no verse number --
    // exact-chapter knowledge, not just "look at the blanked word."
    const verse = getVerse(reference);
    return { clue: `A word found in ${verse.bookName} chapter ${reference.chapter}`, reference };
  }
  // Easy/medium: the real source verse, with the answer word blanked out.
  const verse = getVerse(reference);
  const pattern = new RegExp(`\\b${word}\\b`, 'i');
  const blanked = verse.text.replace(pattern, '_____');
  return { clue: `${verse.bookName} ${reference.chapter}:${reference.verse} -- "${blanked}"`, reference };
}

export function generateCrossword(seed: number, difficulty: Difficulty): CrosswordPuzzle {
  const random = mulberry32(seed);
  const { min, max, wordCount } = DIFFICULTY_PARAMS[difficulty];

  const candidatePool: string[] = [];
  for (let len = max; len >= min; len--) {
    candidatePool.push(...getWordsByLength(len));
  }
  const shuffled = seededShuffle(
    candidatePool.filter((w) => !STOPWORDS.has(w) && w.length <= GRID_SIZE),
    random
  );

  const solution: (string | null)[][] = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(null));
  const placed: PlacedCrosswordWord[] = [];

  const fitsAt = (word: string, row: number, col: number, dRow: number, dCol: number): boolean => {
    // dRow/dCol are always 0 or 1 (never negative) in this file, so the
    // start (row, col) is always <= the end -- checking the end alone
    // isn't enough to catch a negative start (e.g. computing a crossing
    // word's start position by walking backward from a middle letter
    // can land row/col below 0 while endRow/endCol still lands safely
    // in-bounds).
    if (row < 0 || col < 0) return false;
    const endRow = row + dRow * (word.length - 1);
    const endCol = col + dCol * (word.length - 1);
    if (endRow < 0 || endRow >= GRID_SIZE || endCol < 0 || endCol >= GRID_SIZE) return false;
    // One empty buffer cell before/after the word so it never runs
    // directly into another word end-to-end (would misread as one
        // longer word) -- skip this check at the grid edge.
    const beforeRow = row - dRow;
    const beforeCol = col - dCol;
    if (beforeRow >= 0 && beforeRow < GRID_SIZE && beforeCol >= 0 && beforeCol < GRID_SIZE && solution[beforeRow][beforeCol]) return false;
    const afterRow = endRow + dRow;
    const afterCol = endCol + dCol;
    if (afterRow >= 0 && afterRow < GRID_SIZE && afterCol >= 0 && afterCol < GRID_SIZE && solution[afterRow][afterCol]) return false;

    for (let i = 0; i < word.length; i++) {
      const r = row + dRow * i;
      const c = col + dCol * i;
      const existing = solution[r][c];
      if (existing !== null) {
        if (existing !== word[i]) return false;
        continue; // valid intersection
      }
      // Perpendicular neighbor cells must be empty so a new letter
      // doesn't accidentally form an unintended adjacent word.
      const perpR = dRow === 0 ? 1 : 0;
      const perpC = dCol === 0 ? 1 : 0;
      if (solution[r + perpR]?.[c + perpC] || solution[r - perpR]?.[c - perpC]) return false;
    }
    return true;
  };

  const place = (word: string, row: number, col: number, direction: 'across' | 'down') => {
    const [dRow, dCol] = direction === 'across' ? [0, 1] : [1, 0];
    for (let i = 0; i < word.length; i++) {
      solution[row + dRow * i][col + dCol * i] = word[i];
    }
    placed.push({ answer: word, row, col, direction, number: 0, clue: '', reference: { bookId: 'GEN', chapter: 1, verse: 1 } });
  };

  for (const rawWord of shuffled) {
    if (placed.length >= wordCount) break;
    const word = rawWord.toUpperCase();
    if (word.length < 2) continue;

    if (placed.length === 0) {
      // First word: place it across, roughly centered.
      const row = Math.floor(GRID_SIZE / 2);
      const col = Math.max(0, Math.floor((GRID_SIZE - word.length) / 2));
      if (fitsAt(word, row, col, 0, 1)) place(word, row, col, 'across');
      continue;
    }

    // Try to intersect with an already-placed word via a shared letter.
    let didPlace = false;
    const placedWordsShuffled = seededShuffle(placed, random);
    for (const existing of placedWordsShuffled) {
      if (didPlace) break;
      const crossDirection: 'across' | 'down' = existing.direction === 'across' ? 'down' : 'across';
      for (let i = 0; i < existing.answer.length && !didPlace; i++) {
        const letter = existing.answer[i];
        for (let j = 0; j < word.length && !didPlace; j++) {
          if (word[j] !== letter) continue;
          const [existDRow, existDCol] = existing.direction === 'across' ? [0, 1] : [1, 0];
          const crossRow = existing.row + existDRow * i;
          const crossCol = existing.col + existDCol * i;
          const [dRow, dCol] = crossDirection === 'across' ? [0, 1] : [1, 0];
          const row = crossRow - dRow * j;
          const col = crossCol - dCol * j;
          if (fitsAt(word, row, col, dRow, dCol)) {
            place(word, row, col, crossDirection);
            didPlace = true;
          }
        }
      }
    }
    if (!didPlace) continue; // skip this candidate, try the next one
  }

  // Assign standard crossword numbering: scan row-major, number any
  // cell that starts an across word (nothing immediately left) or a
  // down word (nothing immediately above).
  const startCells = new Map<string, number>();
  let nextNumber = 1;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!solution[r][c]) continue;
      const startsAcross = !solution[r][c - 1] && solution[r][c + 1];
      const startsDown = !solution[r - 1]?.[c] && solution[r + 1]?.[c];
      if (startsAcross || startsDown) {
        startCells.set(`${r},${c}`, nextNumber);
        nextNumber++;
      }
    }
  }

  const finalWords: PlacedCrosswordWord[] = placed
    .map((w) => {
      const { clue, reference } = buildClue(w.answer, difficulty);
      return { ...w, number: startCells.get(`${w.row},${w.col}`) ?? 0, clue, reference };
    })
    .sort((a, b) => a.number - b.number);

  return { seed, difficulty, size: GRID_SIZE, solution, words: finalWords };
}

// Any positive integer is a valid seed -- there's no fixed catalog to
// stay within, so "1000+ puzzles" is inherent (every seed x difficulty
// combination is its own distinct puzzle).
export function getDailyCrosswordSeed(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function getRandomCrosswordSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}
