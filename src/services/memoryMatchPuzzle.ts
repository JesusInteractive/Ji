// Deterministic Memory Match generator -- same house style as the other
// games (seeded PRNG in, reproducible puzzle out). Each puzzle is a mix
// of two pair types, chosen per-pair by the seed: a verse reference
// paired with its text, and a Bible character's name paired with their
// one-line summary. Lowest-risk game to build of the nine -- it's pure
// tap-to-flip, no typing or free-text input anywhere.
import { getRandomVerse, getCharacters, mulberry32, seededShuffle } from './bibleGamesContent';
import type { Difficulty } from '../data/gamesCatalog';

const PAIR_COUNTS: Record<Difficulty, number> = { easy: 6, medium: 9, hard: 14 };

export interface MemoryCard {
  id: number;
  pairId: number;
  text: string;
}

export interface MemoryPuzzle {
  seed: number;
  difficulty: Difficulty;
  pairCount: number;
  cards: MemoryCard[];
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function generateMemoryPuzzle(seed: number, difficulty: Difficulty): MemoryPuzzle {
  const random = mulberry32(seed);
  const pairCount = PAIR_COUNTS[difficulty];
  const characters = getCharacters();

  const cards: MemoryCard[] = [];
  let cardId = 0;

  for (let pairId = 0; pairId < pairCount; pairId++) {
    const useCharacter = characters.length > 0 && random() < 0.5;
    if (useCharacter) {
      const character = characters[Math.floor(random() * characters.length)];
      cards.push({ id: cardId++, pairId, text: character.name });
      cards.push({ id: cardId++, pairId, text: truncate(character.summary, 56) });
    } else {
      const verse = getRandomVerse(Math.floor(random() * 1_000_000) + 1);
      cards.push({ id: cardId++, pairId, text: `${verse.bookName} ${verse.ref.chapter}:${verse.ref.verse}` });
      cards.push({ id: cardId++, pairId, text: truncate(verse.text, 56) });
    }
  }

  return { seed, difficulty, pairCount, cards: seededShuffle(cards, random) };
}

export function getRandomMemorySeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}
