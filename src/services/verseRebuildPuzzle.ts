// Deterministic Verse Rebuild generator -- same house style as
// verseWordlePuzzle.ts (seeded PRNG in, reproducible puzzle out), but the
// interaction is tap-a-word-tile rather than type-a-letter: a verse's
// words are shuffled into a word bank (plus a few decoy words on hard),
// and the player taps them back into their original order. Chosen as
// Verse Wordle's replacement because it needs no on-screen keyboard --
// every action is a single discrete tap, which sidesteps the touch/typing
// reliability problems that game ran into.
import { getRandomVerse, getAllIndexedWords, seededShuffle, mulberry32, type VerseRef, type Testament } from './bibleGamesContent';
import type { Difficulty } from '../data/gamesCatalog';

interface DifficultyParams {
  minWords: number;
  maxWords: number;
  decoys: number;
}

const DIFFICULTY_PARAMS: Record<Difficulty, DifficultyParams> = {
  easy: { minWords: 5, maxWords: 8, decoys: 0 },
  medium: { minWords: 8, maxWords: 13, decoys: 2 },
  hard: { minWords: 11, maxWords: 16, decoys: 4 },
};

export interface BankTile {
  id: number;
  text: string;
}

export interface RebuildPuzzle {
  seed: number;
  difficulty: Difficulty;
  reference: VerseRef;
  bookName: string;
  testament: Testament;
  verseText: string;
  tokens: string[]; // correct word order, punctuation intact
  bank: BankTile[]; // shuffled tokens + decoys
}

function normalize(word: string): string {
  return word.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

export function generateRebuildPuzzle(seed: number, difficulty: Difficulty): RebuildPuzzle {
  const random = mulberry32(seed);
  const { minWords, maxWords, decoys } = DIFFICULTY_PARAMS[difficulty];

  let verse = getRandomVerse(seed);
  let tokens = verse.text.trim().split(/\s+/);
  for (let attempt = 0; attempt < 60 && (tokens.length < minWords || tokens.length > maxWords); attempt++) {
    verse = getRandomVerse(Math.floor(random() * 1_000_000) + 1);
    tokens = verse.text.trim().split(/\s+/);
  }
  if (tokens.length > maxWords) tokens = tokens.slice(0, maxWords);

  const tokenKeys = new Set(tokens.map(normalize));
  const allWords = getAllIndexedWords();
  const decoyWords: string[] = [];
  let decoyAttempts = 0;
  while (decoyWords.length < decoys && decoyAttempts < 200) {
    decoyAttempts++;
    const candidate = allWords[Math.floor(random() * allWords.length)];
    if (!candidate || tokenKeys.has(candidate) || decoyWords.includes(candidate)) continue;
    decoyWords.push(candidate);
  }

  const bankSource = [...tokens, ...decoyWords];
  const bank = seededShuffle(
    bankSource.map((text, id) => ({ id, text })),
    random
  );

  return {
    seed,
    difficulty,
    reference: verse.ref,
    bookName: verse.bookName,
    testament: verse.testament,
    verseText: verse.text,
    tokens,
    bank,
  };
}

export function getRandomRebuildSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}
