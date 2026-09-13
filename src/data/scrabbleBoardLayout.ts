// Bible Scrabble board + tile data. The 15x15 premium-square arrangement
// below is the standard, long-published Scrabble board layout -- public
// domain (only the brand name/logo are trademarked, and this feature is
// deliberately called "Bible Scrabble", not "Scrabble").
//
// Tile counts and point values are NOT the stock Scrabble set -- they're
// derived from actual letter frequency across scrabble-vocabulary.json
// (see scripts/fetch-web-bible.js), computed once via a quick Node
// frequency count over that file: common letters are cheap, rare ones
// score high, same spirit as the real game but calibrated to this app's
// own Bible-text vocabulary rather than general English. Q and X are
// effectively dead letters in WEB prose (0.11% and 0.19% of all letters)
// and are dropped from the bag entirely; Z stays in (proper nouns like
// "Zion" keep it playable).
export type PremiumType = 'TW' | 'DW' | 'TL' | 'DL' | null;

export const BOARD_SIZE = 15;

const TW: [number, number][] = [
  [0, 0], [0, 7], [0, 14],
  [7, 0], [7, 14],
  [14, 0], [14, 7], [14, 14],
];
const DW: [number, number][] = [
  [1, 1], [2, 2], [3, 3], [4, 4],
  [1, 13], [2, 12], [3, 11], [4, 10],
  [10, 4], [11, 3], [12, 2], [13, 1],
  [10, 10], [11, 11], [12, 12], [13, 13],
  [7, 7],
];
const TL: [number, number][] = [
  [1, 5], [1, 9], [5, 1], [5, 5], [5, 9], [5, 13],
  [9, 1], [9, 5], [9, 9], [9, 13], [13, 5], [13, 9],
];
const DL: [number, number][] = [
  [0, 3], [0, 11], [2, 6], [2, 8], [3, 0], [3, 7], [3, 14],
  [6, 2], [6, 6], [6, 8], [6, 12], [7, 3], [7, 11],
  [8, 2], [8, 6], [8, 8], [8, 12], [11, 0], [11, 7], [11, 14],
  [12, 6], [12, 8], [14, 3], [14, 11],
];

function buildPremiumGrid(): PremiumType[][] {
  const grid: PremiumType[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
  for (const [r, c] of TW) grid[r][c] = 'TW';
  for (const [r, c] of DW) grid[r][c] = 'DW';
  for (const [r, c] of TL) grid[r][c] = 'TL';
  for (const [r, c] of DL) grid[r][c] = 'DL';
  return grid;
}

export const PREMIUM_GRID: PremiumType[][] = buildPremiumGrid();
export const CENTER = { row: 7, col: 7 };

// Letter -> [tile count in the 100-tile bag, point value]. Blanks are
// tracked separately (2 in the bag, worth 0, playable as any letter).
export const LETTER_DATA: Record<string, [count: number, value: number]> = {
  E: [12, 1], A: [9, 1], S: [8, 1], I: [8, 1], R: [7, 1], N: [6, 1], T: [6, 1], O: [5, 1],
  H: [5, 2], L: [5, 2], D: [4, 2], M: [3, 2], C: [3, 2], U: [3, 2], P: [3, 2],
  G: [2, 3], B: [2, 3],
  F: [1, 4], Y: [1, 4], W: [1, 4], V: [1, 4],
  K: [1, 5],
  Z: [1, 8],
  J: [1, 10],
};

export const BLANK_COUNT = 2;
export const RACK_SIZE = 7;
