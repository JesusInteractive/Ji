// Bible Scrabble AI -- one shared, bounded legal-move search (anchor
// squares + a small Trie-guided DFS, not an exhaustive/optimal solver --
// "one-ply-plus-heuristics", per the original plan, not a research
// project), reused by all 3 difficulty tiers. Every candidate this finds
// is re-checked through scrabbleEngine's validateMove before it's ever
// offered to a tier, so a bug in the search can only make the AI miss a
// move -- it can never make it play an illegal one.
import { getVocabularySet } from './bibleGamesContent';
import { validateMove, isBoardEmpty, type Board, type RackTile, type Placement, type MoveValidation } from './scrabbleEngine';
import { BOARD_SIZE, CENTER, RACK_SIZE } from '../data/scrabbleBoardLayout';

interface TrieNode {
  children: Map<string, TrieNode>;
  isWord: boolean;
}

let trieRoot: TrieNode | null = null;
function getTrie(): TrieNode {
  if (trieRoot) return trieRoot;
  const root: TrieNode = { children: new Map(), isWord: false };
  for (const word of getVocabularySet()) {
    let node = root;
    for (const ch of word.toUpperCase()) {
      let next = node.children.get(ch);
      if (!next) {
        next = { children: new Map(), isWord: false };
        node.children.set(ch, next);
      }
      node = next;
    }
    node.isWord = true;
  }
  trieRoot = root;
  return root;
}

function getAnchors(board: Board): { row: number; col: number }[] {
  if (isBoardEmpty(board)) return [{ row: CENTER.row, col: CENTER.col }];
  const anchors: { row: number; col: number }[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c]) continue;
      const adjacent = board[r - 1]?.[c] || board[r + 1]?.[c] || board[r][c - 1] || board[r][c + 1];
      if (adjacent) anchors.push({ row: r, col: c });
    }
  }
  return anchors;
}

export interface ScoredMove {
  placements: Placement[];
  score: number;
}

const MAX_CANDIDATES = 400;

// Bounded DFS: extends a word through `anchor` along one axis, using
// existing board letters where present (forced, free) and rack tiles
// elsewhere (Trie-pruned so only real prefixes are ever explored). Every
// full path found is handed to the caller as a raw candidate -- final
// legality (including every crossing word) is scrabbleEngine's job, not
// this function's.
function searchAxis(
  board: Board,
  rack: RackTile[],
  anchor: { row: number; col: number },
  dRow: number,
  dCol: number,
  candidates: Placement[][]
) {
  const trie = getTrie();
  let maxBack = 0;
  {
    let r = anchor.row - dRow;
    let c = anchor.col - dCol;
    while (r >= 0 && c >= 0 && maxBack < RACK_SIZE) {
      maxBack++;
      r -= dRow;
      c -= dCol;
    }
  }

  for (let back = 0; back <= maxBack && candidates.length < MAX_CANDIDATES; back++) {
    const startRow = anchor.row - dRow * back;
    const startCol = anchor.col - dCol * back;
    if (startRow < 0 || startCol < 0) continue;

    const usedIds = new Set<number>();
    const path: Placement[] = [];

    const walk = (row: number, col: number, node: TrieNode, coveredAnchor: boolean) => {
      if (candidates.length >= MAX_CANDIDATES) return;
      if (row >= BOARD_SIZE || col >= BOARD_SIZE) return;

      const existing = board[row][col];
      if (existing) {
        const next = node.children.get(existing.letter);
        if (!next) return;
        const isAnchorCell = row === anchor.row && col === anchor.col;
        walk(row + dRow, col + dCol, next, coveredAnchor || isAnchorCell);
        return;
      }

      for (const tile of rack) {
        if (usedIds.has(tile.id)) continue;
        const letters = tile.isBlank ? Array.from(node.children.keys()) : [tile.letter];
        for (const letter of letters) {
          const next = node.children.get(letter);
          if (!next) continue;
          const isAnchorCell = row === anchor.row && col === anchor.col;
          const nowCovered = coveredAnchor || isAnchorCell;

          usedIds.add(tile.id);
          path.push({ row, col, letter, isBlank: tile.isBlank, rackTileId: tile.id });

          if (next.isWord && nowCovered && path.length > 0) {
            candidates.push(path.slice());
          }
          walk(row + dRow, col + dCol, next, nowCovered);

          path.pop();
          usedIds.delete(tile.id);
        }
      }
    };

    walk(startRow, startCol, trie, false);
  }
}

export function findLegalMoves(board: Board, rack: RackTile[]): ScoredMove[] {
  const anchors = getAnchors(board);
  const rawCandidates: Placement[][] = [];
  for (const anchor of anchors) {
    if (rawCandidates.length >= MAX_CANDIDATES) break;
    searchAxis(board, rack, anchor, 0, 1, rawCandidates); // across
    searchAxis(board, rack, anchor, 1, 0, rawCandidates); // down
  }

  const seen = new Set<string>();
  const moves: ScoredMove[] = [];
  for (const placements of rawCandidates) {
    const key = placements.map((p) => `${p.row},${p.col},${p.letter}`).sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    const result: MoveValidation = validateMove(board, placements);
    if (result.valid) moves.push({ placements, score: result.score });
  }
  return moves;
}

export type AiTier = 'easy' | 'medium' | 'hard';

function rackLeaveScore(rack: RackTile[], usedIds: Set<number>): number {
  // Cheap rack-leave heuristic for the hard tier: prefer leaves that keep
  // a vowel/consonant mix and hang on to blanks rather than dumping them.
  const remaining = rack.filter((t) => !usedIds.has(t.id));
  const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
  let vowelCount = 0;
  let blankCount = 0;
  for (const t of remaining) {
    if (t.isBlank) blankCount++;
    else if (vowels.has(t.letter)) vowelCount++;
  }
  const consonantCount = remaining.length - vowelCount - blankCount;
  const balancePenalty = Math.abs(vowelCount - consonantCount) * 1.5;
  return blankCount * 5 - balancePenalty;
}

export function chooseAiMove(board: Board, rack: RackTile[], tier: AiTier): ScoredMove | null {
  const moves = findLegalMoves(board, rack);
  if (moves.length === 0) return null;

  if (tier === 'easy') {
    const sorted = [...moves].sort((a, b) => a.score - b.score);
    const bottomHalf = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
    return bottomHalf[Math.floor(Math.random() * bottomHalf.length)];
  }

  if (tier === 'medium') {
    return moves.reduce((best, m) => (m.score > best.score ? m : best), moves[0]);
  }

  // hard: best-among-top-K by raw score, tie-broken by the healthiest rack leave
  const sorted = [...moves].sort((a, b) => b.score - a.score);
  const topK = sorted.slice(0, Math.min(8, sorted.length));
  let best = topK[0];
  let bestValue = best.score + rackLeaveScore(rack, new Set(best.placements.map((p) => p.rackTileId)));
  for (const move of topK.slice(1)) {
    const value = move.score + rackLeaveScore(rack, new Set(move.placements.map((p) => p.rackTileId)));
    if (value > bestValue) {
      best = move;
      bestValue = value;
    }
  }
  return best;
}
