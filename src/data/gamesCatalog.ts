// The 9 tiles on the Jesus Interactive Bible Games hub. Deliberately its
// own small, vivid palette (not the app's usual navy/gold brand colors)
// -- same reasoning HighlighterToolbar.tsx's HIGHLIGHT_COLOR_HEX gives
// for its own literal pigment colors: this is meant to read as playful
// and inviting, not as a brand accent.
import type { Ionicons } from '@expo/vector-icons';
import type { GamesStackParamList } from '../navigation/GamesStack';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameCatalogEntry {
  id: keyof Omit<GamesStackParamList, 'GamesHub'>;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

// 10 tiles -- an even 2-column grid with no orphan tile.

export const GAMES_CATALOG: GameCatalogEntry[] = [
  { id: 'GameCrossword', title: 'Bible Crossword', subtitle: 'Fill the grid from Scripture clues', icon: 'grid-outline', color: '#FF6B6B' },
  { id: 'GameVerseRebuild', title: 'Verse Rebuild', subtitle: 'Restore the scrambled verse', icon: 'shuffle-outline', color: '#4ECDC4' },
  { id: 'GameMemoryMatch', title: 'Memory Match', subtitle: 'Flip and match Bible pairs', icon: 'copy-outline', color: '#A66DD4' },
  { id: 'GameFillInBlank', title: 'Fill-in-the-Blank', subtitle: 'Complete the verse', icon: 'create-outline', color: '#FFB454' },
  { id: 'GameGuessCharacter', title: 'Guess the Character', subtitle: 'Clues reveal who it is', icon: 'help-buoy-outline', color: '#FF8FAB' },
  { id: 'GameTimelineSort', title: 'Timeline Sort', subtitle: 'Put events in order', icon: 'time-outline', color: '#5B8DEF' },
  { id: 'GameWordSearch', title: 'Word Search', subtitle: 'Find hidden Bible words', icon: 'search-outline', color: '#6FCF97' },
  { id: 'GameTrivia', title: 'Trivia', subtitle: 'Test your Bible knowledge', icon: 'bulb-outline', color: '#FFD166' },
  { id: 'GameScrabble', title: 'Bible Scrabble', subtitle: 'Build words, score points', icon: 'apps-outline', color: '#B23A48' },
  { id: 'GameBibleMazes', title: 'Bible Mazes', subtitle: 'Answer your way through the story', icon: 'git-network-outline', color: '#3E9C7F' },
];
