// Deterministic Guess the Character generator -- same house style as the
// other games (seeded PRNG in, reproducible puzzle out), built on top of
// the curated src/data/bibleCharacters.ts roster (see that file's own
// comment on why this dataset can't be automated from raw WEB text).
// Progressive clue reveal + tap-a-name multiple choice -- no typing.
import { getCharacters, getBookMeta, mulberry32, seededShuffle, type BibleCharacter } from './bibleGamesContent';
import type { Difficulty } from '../data/gamesCatalog';

type ClueType = 'testament' | 'category' | 'trait' | 'reference' | 'summary';
type DistractorStrategy = 'any' | 'sameTestament' | 'sameCategory';

interface DifficultyParams {
  clueOrder: ClueType[];
  optionCount: number;
  distractorStrategy: DistractorStrategy;
}

// Easy reveals a lot (ends on the full summary, essentially a giveaway);
// hard stays vague (trait + chapter-only reference) and pits the answer
// against distractors from the very same category, so "a king" doesn't
// trivially rule out every other king.
const DIFFICULTY_PARAMS: Record<Difficulty, DifficultyParams> = {
  easy: { clueOrder: ['testament', 'category', 'trait', 'summary'], optionCount: 3, distractorStrategy: 'any' },
  medium: { clueOrder: ['category', 'trait', 'reference'], optionCount: 4, distractorStrategy: 'sameTestament' },
  hard: { clueOrder: ['trait', 'reference'], optionCount: 4, distractorStrategy: 'sameCategory' },
};

function buildClueText(type: ClueType, character: BibleCharacter, random: () => number): string {
  switch (type) {
    case 'testament':
      return `${character.testament === 'OT' ? 'Old' : 'New'} Testament figure.`;
    case 'category':
      return `Known as: ${character.category}.`;
    case 'trait': {
      const trait = character.traits[Math.floor(random() * character.traits.length)] ?? character.traits[0];
      return `Clue: ${trait}.`;
    }
    case 'reference': {
      const ref = character.keyReferences[Math.floor(random() * character.keyReferences.length)] ?? character.keyReferences[0];
      const book = getBookMeta().find((b) => b.id === ref.bookId);
      return `Mentioned in ${book?.commonName ?? ref.bookId}, chapter ${ref.chapter}.`;
    }
    case 'summary':
      return character.summary;
  }
}

export interface GuessCharacterPuzzle {
  seed: number;
  difficulty: Difficulty;
  character: BibleCharacter;
  clues: string[];
  options: string[];
}

export function generateGuessCharacterPuzzle(seed: number, difficulty: Difficulty): GuessCharacterPuzzle {
  const random = mulberry32(seed);
  const { clueOrder, optionCount, distractorStrategy } = DIFFICULTY_PARAMS[difficulty];
  const characters = getCharacters();
  const character = characters[Math.floor(random() * characters.length)];

  const clues = clueOrder.map((type) => buildClueText(type, character, random));

  let candidatePool = characters.filter((c) => c.id !== character.id);
  if (distractorStrategy === 'sameCategory') {
    const sameCategory = candidatePool.filter((c) => c.category === character.category);
    candidatePool = sameCategory.length >= optionCount - 1 ? sameCategory : candidatePool.filter((c) => c.testament === character.testament);
    if (candidatePool.length < optionCount - 1) candidatePool = characters.filter((c) => c.id !== character.id);
  } else if (distractorStrategy === 'sameTestament') {
    const sameTestament = candidatePool.filter((c) => c.testament === character.testament);
    if (sameTestament.length >= optionCount - 1) candidatePool = sameTestament;
  }

  const distractors = seededShuffle(candidatePool, random).slice(0, optionCount - 1).map((c) => c.name);
  const options = seededShuffle([character.name, ...distractors], random);

  return { seed, difficulty, character, clues, options };
}

export function getRandomGuessCharacterSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}
