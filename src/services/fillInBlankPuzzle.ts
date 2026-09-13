// Deterministic Fill-in-the-Blank generator -- same house style as the
// other games (seeded PRNG in, reproducible puzzle out). Every blank is
// multiple-choice at every difficulty (not free-text, even on hard) --
// a deliberate departure from the original plan, made after Verse
// Wordle's free-text on-screen keyboard turned out to be an unreliable
// interaction; tap-a-choice is the same safe pattern VerseRebuildScreen
// and MemoryMatchScreen already use.
import { getRandomVerse, getWordsByLength, mulberry32, seededShuffle, type VerseRef, type Testament } from './bibleGamesContent';
import { STOPWORDS } from './crosswordPuzzle';
import type { Difficulty } from '../data/gamesCatalog';

interface DifficultyParams {
  blankCount: number;
  optionsPerBlank: number;
}

const DIFFICULTY_PARAMS: Record<Difficulty, DifficultyParams> = {
  easy: { blankCount: 1, optionsPerBlank: 3 },
  medium: { blankCount: 2, optionsPerBlank: 4 },
  hard: { blankCount: 4, optionsPerBlank: 4 },
};

function normalize(word: string): string {
  return word.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

function isContentWord(token: string): boolean {
  const clean = normalize(token);
  return clean.length >= 3 && !STOPWORDS.has(clean);
}

export interface FillInBlank {
  tokenIndex: number;
  correctText: string;
  options: string[];
}

export interface FillInBlankPuzzle {
  seed: number;
  difficulty: Difficulty;
  reference: VerseRef;
  bookName: string;
  testament: Testament;
  tokens: string[];
  blanks: FillInBlank[];
}

export function generateFillInBlankPuzzle(seed: number, difficulty: Difficulty): FillInBlankPuzzle {
  const random = mulberry32(seed);
  const { blankCount, optionsPerBlank } = DIFFICULTY_PARAMS[difficulty];

  let verse = getRandomVerse(seed);
  let tokens = verse.text.trim().split(/\s+/);
  let contentIndices = tokens.map((t, i) => (isContentWord(t) ? i : -1)).filter((i) => i >= 0);

  for (let attempt = 0; attempt < 60 && contentIndices.length < blankCount; attempt++) {
    verse = getRandomVerse(Math.floor(random() * 1_000_000) + 1);
    tokens = verse.text.trim().split(/\s+/);
    contentIndices = tokens.map((t, i) => (isContentWord(t) ? i : -1)).filter((i) => i >= 0);
  }

  const actualBlankCount = Math.min(blankCount, contentIndices.length) || 1;
  const chosenIndices = seededShuffle(contentIndices, random)
    .slice(0, actualBlankCount)
    .sort((a, b) => a - b);

  const usedNormalized = new Set(chosenIndices.map((i) => normalize(tokens[i])));

  const blanks: FillInBlank[] = chosenIndices.map((tokenIndex) => {
    const correctText = tokens[tokenIndex];
    const correctLen = normalize(correctText).length;
    const pool = getWordsByLength(correctLen).filter((w) => !usedNormalized.has(w));

    const distractors: string[] = [];
    let attempts = 0;
    while (distractors.length < optionsPerBlank - 1 && attempts < 100 && pool.length > 0) {
      attempts++;
      const candidate = pool[Math.floor(random() * pool.length)];
      if (!distractors.includes(candidate)) distractors.push(candidate);
    }

    const options = seededShuffle([correctText, ...distractors], random);
    return { tokenIndex, correctText, options };
  });

  return {
    seed,
    difficulty,
    reference: verse.ref,
    bookName: verse.bookName,
    testament: verse.testament,
    tokens,
    blanks,
  };
}

export function getRandomFillInBlankSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}
