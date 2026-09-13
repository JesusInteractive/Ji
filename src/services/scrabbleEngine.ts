// Bible Scrabble core engine: tile bag, board model, move validation +
// scoring, and a bounded legal-move finder the AI (scrabbleAI.ts) reuses.
// Word legality always goes through bibleGamesContent's isLegalWord --
// the SAME vocabulary Set every other game in this hub validates
// against -- so there's exactly one dictionary in this whole feature,
// not a second copy living here.
import { isLegalWord, mulberry32, seededShuffle } from './bibleGamesContent';
import { BOARD_SIZE, PREMIUM_GRID, CENTER, LETTER_DATA, BLANK_COUNT, RACK_SIZE, type PremiumType } from '../data/scrabbleBoardLayout';

export interface BoardTile {
  letter: string; // 'A'-'Z'
  isBlank: boolean;
  value: number; // 0 for a blank
}

export type Board = (BoardTile | null)[][];

export interface RackTile {
  id: number;
  letter: string; // '' for an unassigned blank sitting in the rack
  isBlank: boolean;
}

export interface Placement {
  row: number;
  col: number;
  letter: string; // the letter this tile represents (blank's chosen letter included)
  isBlank: boolean;
  rackTileId: number;
}

export interface FormedWord {
  word: string;
  cells: { row: number; col: number }[];
}

export interface MoveValidation {
  valid: boolean;
  error?: string;
  score: number;
  words: FormedWord[];
}

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array<BoardTile | null>(BOARD_SIZE).fill(null));
}

export function isBoardEmpty(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell === null));
}

// --- Tile bag ----------------------------------------------------------

export function createTileBag(seed: number): RackTile[] {
  const random = mulberry32(seed);
  const tiles: RackTile[] = [];
  let id = 0;
  for (const [letter, [count]] of Object.entries(LETTER_DATA)) {
    for (let i = 0; i < count; i++) tiles.push({ id: id++, letter, isBlank: false });
  }
  for (let i = 0; i < BLANK_COUNT; i++) tiles.push({ id: id++, letter: '', isBlank: true });
  return seededShuffle(tiles, random);
}

export function letterValue(letter: string): number {
  return LETTER_DATA[letter]?.[1] ?? 0;
}

// --- Word extraction -----------------------------------------------------

function wordAt(board: Board, row: number, col: number, axis: 'across' | 'down'): FormedWord | null {
  const dRow = axis === 'down' ? 1 : 0;
  const dCol = axis === 'across' ? 1 : 0;
  let r = row;
  let c = col;
  while (board[r - dRow]?.[c - dCol]) {
    r -= dRow;
    c -= dCol;
  }
  const cells: { row: number; col: number }[] = [];
  let letters = '';
  let cr = r;
  let cc = c;
  while (board[cr]?.[cc]) {
    letters += board[cr]![cc]!.letter;
    cells.push({ row: cr, col: cc });
    cr += dRow;
    cc += dCol;
  }
  if (cells.length < 2) return null;
  return { word: letters, cells };
}

// --- Validation + scoring ------------------------------------------------

export function validateMove(board: Board, placements: Placement[]): MoveValidation {
  if (placements.length === 0) return { valid: false, error: 'No tiles placed', score: 0, words: [] };

  const seen = new Set<string>();
  for (const p of placements) {
    if (board[p.row]?.[p.col] !== null) return { valid: false, error: 'A tile is already there', score: 0, words: [] };
    const key = `${p.row}-${p.col}`;
    if (seen.has(key)) return { valid: false, error: 'Duplicate cell', score: 0, words: [] };
    seen.add(key);
  }

  const rows = new Set(placements.map((p) => p.row));
  const cols = new Set(placements.map((p) => p.col));
  if (rows.size > 1 && cols.size > 1) {
    return { valid: false, error: 'Tiles must form a single line', score: 0, words: [] };
  }

  const tempBoard: Board = board.map((row) => row.slice());
  for (const p of placements) {
    tempBoard[p.row][p.col] = { letter: p.letter, isBlank: p.isBlank, value: p.isBlank ? 0 : letterValue(p.letter) };
  }

  if (rows.size === 1 && cols.size > 1) {
    const row = placements[0].row;
    const colsArr = placements.map((p) => p.col).sort((a, b) => a - b);
    for (let c = colsArr[0]; c <= colsArr[colsArr.length - 1]; c++) {
      if (!tempBoard[row][c]) return { valid: false, error: 'Gap in the word', score: 0, words: [] };
    }
  } else if (cols.size === 1 && rows.size > 1) {
    const col = placements[0].col;
    const rowsArr = placements.map((p) => p.row).sort((a, b) => a - b);
    for (let r = rowsArr[0]; r <= rowsArr[rowsArr.length - 1]; r++) {
      if (!tempBoard[r][col]) return { valid: false, error: 'Gap in the word', score: 0, words: [] };
    }
  }

  const wordsFormed: FormedWord[] = [];
  const wordKeys = new Set<string>();
  const addWord = (w: FormedWord | null) => {
    if (!w) return;
    const key = w.cells.map((c) => `${c.row}-${c.col}`).join(',');
    if (wordKeys.has(key)) return;
    wordKeys.add(key);
    wordsFormed.push(w);
  };

  if (rows.size === 1 && cols.size > 1) {
    addWord(wordAt(tempBoard, placements[0].row, placements[0].col, 'across'));
  } else if (cols.size === 1 && rows.size > 1) {
    addWord(wordAt(tempBoard, placements[0].row, placements[0].col, 'down'));
  } else {
    // Single tile placed -- either axis (or both) may form a word.
    addWord(wordAt(tempBoard, placements[0].row, placements[0].col, 'across'));
    addWord(wordAt(tempBoard, placements[0].row, placements[0].col, 'down'));
  }
  for (const p of placements) {
    addWord(wordAt(tempBoard, p.row, p.col, 'across'));
    addWord(wordAt(tempBoard, p.row, p.col, 'down'));
  }

  if (wordsFormed.length === 0) {
    return { valid: false, error: 'Not connected to any word', score: 0, words: [] };
  }

  const wasEmpty = isBoardEmpty(board);
  if (wasEmpty) {
    const coversCenter = placements.some((p) => p.row === CENTER.row && p.col === CENTER.col);
    if (!coversCenter) return { valid: false, error: 'First word must cross the center square', score: 0, words: [] };
  } else {
    const placedKeys = new Set(placements.map((p) => `${p.row}-${p.col}`));
    const connected = wordsFormed.some((w) => w.cells.some((c) => !placedKeys.has(`${c.row}-${c.col}`)));
    if (!connected) return { valid: false, error: 'Must connect to an existing word', score: 0, words: [] };
  }

  for (const w of wordsFormed) {
    if (!isLegalWord(w.word)) {
      return { valid: false, error: `"${w.word}" is not in the word list`, score: 0, words: [] };
    }
  }

  const placedKeys = new Set(placements.map((p) => `${p.row}-${p.col}`));
  let totalScore = 0;
  for (const w of wordsFormed) {
    let wordScore = 0;
    let wordMultiplier = 1;
    for (const cell of w.cells) {
      const tile = tempBoard[cell.row][cell.col]!;
      const isNew = placedKeys.has(`${cell.row}-${cell.col}`);
      let letterScore = tile.value;
      if (isNew) {
        const premium: PremiumType = PREMIUM_GRID[cell.row][cell.col];
        if (premium === 'DL') letterScore *= 2;
        else if (premium === 'TL') letterScore *= 3;
        else if (premium === 'DW') wordMultiplier *= 2;
        else if (premium === 'TW') wordMultiplier *= 3;
      }
      wordScore += letterScore;
    }
    totalScore += wordScore * wordMultiplier;
  }
  if (placements.length === RACK_SIZE) totalScore += 50;

  return { valid: true, score: totalScore, words: wordsFormed };
}
