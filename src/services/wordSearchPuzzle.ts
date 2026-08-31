// Deterministic puzzle generator for the Bible Word Search game (see
// screens/BibleWordSearchScreen.tsx). Puzzles are generated on the fly
// from a numeric seed rather than stored -- a given seed always produces
// the exact same grid, so "today's puzzle" is reproducible across app
// restarts with zero persisted puzzle data, and the "roughly a thousand
// unique puzzles, cycling daily" requirement is satisfied by simply
// having ~1095 valid seeds (see getPuzzleIndexForDate), not by hand-
// authoring that many grids.
import { BIBLE_WORD_SEARCH_BANK } from '../constants/bibleWordSearchBank';
import { getDayOfYear } from '../constants/devotionalReadingPlan';
import { getDevotionYear } from './devotions';

export const GRID_SIZE = 15;
export const WORDS_PER_PUZZLE = 30;
// getDevotionYear() rotates 0/1/2 by calendar year, and getDayOfYear()
// is 1-365 -- so valid puzzle indices run 1..(3*365), matching the "3-
// year rotation" spec without needing a separate day-count constant here.
export const TOTAL_PUZZLES = 3 * 365;

export interface PlacedWord {
  word: string;
  row: number;
  col: number;
  dRow: number;
  dCol: number;
}

export interface WordSearchPuzzle {
  seed: number;
  grid: string[][];
  words: PlacedWord[];
}

// mulberry32 -- a small, fast, deterministic PRNG. Cryptographic
// randomness isn't the goal here (a word-search grid), reproducibility
// from a plain numeric seed is.
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// All 8 compass directions -- horizontal, vertical, and both diagonals,
// each forward and backward, per spec. Exported so
// BibleWordSearchScreen.tsx can snap a finger-drag to the nearest of
// these same 8 directions, rather than duplicating the list.
export const DIRECTIONS: [number, number][] = [
  [0, 1], [0, -1], [1, 0], [-1, 0],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// How many random position/direction attempts before giving up on
// placing a given word and moving to the next candidate -- generous
// enough that placement failures are rare with this grid size/word
// count, cheap enough that a full puzzle generates in well under a
// frame's worth of time.
const MAX_PLACEMENT_ATTEMPTS = 60;

export function generatePuzzle(seed: number): WordSearchPuzzle {
  const random = mulberry32(seed);
  const uniqueWords = Array.from(new Set(BIBLE_WORD_SEARCH_BANK.map((w) => w.toUpperCase())));
  const candidates = shuffle(uniqueWords, random).filter((w) => w.length <= GRID_SIZE);

  const grid: (string | null)[][] = Array.from({ length: GRID_SIZE }, () =>
    new Array(GRID_SIZE).fill(null)
  );
  const placed: PlacedWord[] = [];

  for (const word of candidates) {
    if (placed.length >= WORDS_PER_PUZZLE) break;
    const shuffledDirections = shuffle(DIRECTIONS, random);
    let didPlace = false;
    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS && !didPlace; attempt++) {
      const [dRow, dCol] = shuffledDirections[attempt % shuffledDirections.length];
      const row = Math.floor(random() * GRID_SIZE);
      const col = Math.floor(random() * GRID_SIZE);
      const endRow = row + dRow * (word.length - 1);
      const endCol = col + dCol * (word.length - 1);
      if (endRow < 0 || endRow >= GRID_SIZE || endCol < 0 || endCol >= GRID_SIZE) continue;

      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const existing = grid[row + dRow * i][col + dCol * i];
        if (existing !== null && existing !== word[i]) {
          fits = false;
          break;
        }
      }
      if (!fits) continue;

      for (let i = 0; i < word.length; i++) {
        grid[row + dRow * i][col + dCol * i] = word[i];
      }
      placed.push({ word, row, col, dRow, dCol });
      didPlace = true;
    }
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = ALPHABET[Math.floor(random() * ALPHABET.length)];
      }
    }
  }

  return { seed, grid: grid as string[][], words: placed };
}

// 1..TOTAL_PUZZLES -- same day-of-year + year-rotation pattern
// services/devotions.ts already uses for Daily Devotions and
// constants/promisesOfGod.ts uses for Today's Promise, so returning
// users see a fresh puzzle every day for 3 full years before any repeat.
export function getPuzzleIndexForDate(date: Date = new Date()): number {
  const day = getDayOfYear(date);
  const year = getDevotionYear(date);
  return year * 365 + day;
}

export function getPuzzleForDate(date: Date = new Date()): WordSearchPuzzle {
  return generatePuzzle(getPuzzleIndexForDate(date));
}

// "Next Puzzle" on the completion screen -- advances to the next seed in
// the rotation (wrapping back to 1 after TOTAL_PUZZLES) rather than
// jumping back to today's, so working through the completion screen
// repeatedly moves forward through the full 3-year set.
export function getNextPuzzle(currentSeed: number): WordSearchPuzzle {
  const next = (currentSeed % TOTAL_PUZZLES) + 1;
  return generatePuzzle(next);
}

// "Refresh" -- an on-demand fresh puzzle outside the daily rotation
// entirely, so replaying immediately never just reshows the same grid.
export function getRandomPuzzle(): WordSearchPuzzle {
  return generatePuzzle(Math.floor(Math.random() * 1_000_000) + TOTAL_PUZZLES + 1);
}
