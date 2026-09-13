// Deterministic Timeline Sort generator -- same house style as the other
// games (seeded PRNG in, reproducible puzzle out), built on top of the
// curated src/data/bibleTimeline.ts roster (see that file's own comment
// on why raw WEB text has no date/event metadata to derive this from).
// Tap-events-in-order interaction -- no typing, same pattern as
// VerseRebuildScreen.tsx's word tiles.
import { getTimelineEvents, mulberry32, seededShuffle, type TimelineEvent } from './bibleGamesContent';
import type { Difficulty } from '../data/gamesCatalog';

interface DifficultyParams {
  count: number;
  spread: 'wide' | 'medium' | 'tight';
}

// Easy spreads events across the whole narrative sweep (obviously far
// apart in time, easy to reason about); hard clusters them tightly
// together (e.g. all within the Exodus story), where the actual order
// of nearby events is much harder to recall.
const DIFFICULTY_PARAMS: Record<Difficulty, DifficultyParams> = {
  easy: { count: 4, spread: 'wide' },
  medium: { count: 6, spread: 'medium' },
  hard: { count: 8, spread: 'tight' },
};

function pickWide(pool: TimelineEvent[], count: number, random: () => number): TimelineEvent[] {
  const bucketSize = pool.length / count;
  const picks: TimelineEvent[] = [];
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * bucketSize);
    const end = Math.max(start + 1, Math.floor((i + 1) * bucketSize));
    const idx = Math.min(pool.length - 1, start + Math.floor(random() * (end - start)));
    picks.push(pool[idx]);
  }
  return picks;
}

function pickTight(pool: TimelineEvent[], count: number, random: () => number): TimelineEvent[] {
  const size = Math.min(pool.length, count);
  const maxStart = Math.max(0, pool.length - size);
  const start = Math.floor(random() * (maxStart + 1));
  return pool.slice(start, start + size);
}

function pickMedium(pool: TimelineEvent[], count: number, random: () => number): TimelineEvent[] {
  const windowSize = Math.min(pool.length, count * 3);
  const maxStart = Math.max(0, pool.length - windowSize);
  const start = Math.floor(random() * (maxStart + 1));
  const window = pool.slice(start, start + windowSize);
  return pickWide(window, Math.min(count, window.length), random);
}

export interface TimelineSortPuzzle {
  seed: number;
  difficulty: Difficulty;
  sequence: TimelineEvent[]; // correct chronological order
  shuffled: TimelineEvent[]; // display order (tap targets)
}

export function generateTimelineSortPuzzle(seed: number, difficulty: Difficulty): TimelineSortPuzzle {
  const random = mulberry32(seed);
  const { count, spread } = DIFFICULTY_PARAMS[difficulty];
  const sorted = [...getTimelineEvents()].sort((a, b) => a.order - b.order);

  let picks: TimelineEvent[];
  if (spread === 'wide') picks = pickWide(sorted, count, random);
  else if (spread === 'tight') picks = pickTight(sorted, count, random);
  else picks = pickMedium(sorted, count, random);

  const uniquePicks = Array.from(new Map(picks.map((e) => [e.id, e])).values());
  const sequence = uniquePicks.sort((a, b) => a.order - b.order);
  const shuffled = seededShuffle(sequence, random);

  return { seed, difficulty, sequence, shuffled };
}

export function getRandomTimelineSortSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}
