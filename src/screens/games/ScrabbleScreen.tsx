// Bible Scrabble -- the last of the original 9 Jesus Interactive Games
// Hub tiles. Colorful/playful board (see GamesHubScreen.tsx's own
// comment on why this whole feature breaks from the app's usual
// navy/gold look) -- deliberately vivid premium squares and warm gold
// tiles (Words With Friends-style), not the muted classic Scrabble
// board, per explicit design direction this session.
//
// Two modes: pass-and-play (2 humans, same device) and vs. AI (3 tiers,
// see services/scrabbleAI.ts). Every action is a single tap -- select a
// rack tile, tap a board cell to place it, tap a placed-this-turn tile
// to recall it -- no drag-and-drop, matching the tap-only pattern every
// other game in this hub settled on.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { GAMES_CATALOG, type Difficulty } from '../../data/gamesCatalog';
import { BOARD_SIZE, PREMIUM_GRID, CENTER, RACK_SIZE, type PremiumType } from '../../data/scrabbleBoardLayout';
import {
  createEmptyBoard,
  createTileBag,
  validateMove,
  letterValue,
  type Board,
  type RackTile,
  type Placement,
} from '../../services/scrabbleEngine';
import { chooseAiMove, type AiTier } from '../../services/scrabbleAI';

const ACCENT = GAMES_CATALOG.find((g) => g.id === 'GameScrabble')!.color;

const PREMIUM_COLORS: Record<Exclude<PremiumType, null>, string> = {
  TW: '#FF8FAB',
  DW: '#A66DD4',
  TL: '#4ECDC4',
  DL: '#5B8DEF',
};
const PREMIUM_NAMES: Record<Exclude<PremiumType, null>, string> = {
  TW: 'Triple Word',
  DW: 'Double Word',
  TL: 'Triple Letter',
  DL: 'Double Letter',
};
const PREMIUM_LABELS: Record<Exclude<PremiumType, null>, string> = {
  TW: '3W',
  DW: '2W',
  TL: '3L',
  DL: '2L',
};

const AI_MOVE_DELAY_MS = 900;

type Mode = 'ai' | 'passAndPlay';

interface PlayerState {
  rack: RackTile[];
  score: number;
  isAi: boolean;
}

function refillRack(rack: RackTile[], bag: RackTile[]): RackTile[] {
  const next = rack.slice();
  while (next.length < RACK_SIZE && bag.length > 0) {
    next.push(bag.shift()!);
  }
  return next;
}

export default function ScrabbleScreen() {
  const [mode, setMode] = useState<Mode>('ai');
  const [aiTier, setAiTier] = useState<Difficulty>('medium');
  const [gameKey, setGameKey] = useState(0);

  const initial = useMemo(() => {
    const bag = createTileBag(Date.now() % 1_000_000);
    const rack0 = refillRack([], bag);
    const rack1 = refillRack([], bag);
    return { bag, rack0, rack1 };
  }, [gameKey]);

  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [bag, setBag] = useState<RackTile[]>(initial.bag);
  const [players, setPlayers] = useState<PlayerState[]>([
    { rack: initial.rack0, score: 0, isAi: false },
    { rack: initial.rack1, score: 0, isAi: mode === 'ai' },
  ]);
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0);
  const [pending, setPending] = useState<Placement[]>([]);
  const [selectedRackId, setSelectedRackId] = useState<number | null>(null);
  const [blankPickerFor, setBlankPickerFor] = useState<{ row: number; col: number; rackTileId: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passStreak, setPassStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset everything when starting a new game (mode/tier change or "New Game").
  useEffect(() => {
    setBoard(createEmptyBoard());
    setBag(initial.bag);
    setPlayers([
      { rack: initial.rack0, score: 0, isAi: false },
      { rack: initial.rack1, score: 0, isAi: mode === 'ai' },
    ]);
    setCurrentPlayer(0);
    setPending([]);
    setSelectedRackId(null);
    setBlankPickerFor(null);
    setMessage(null);
    setPassStreak(0);
    setGameOver(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameKey, mode]);

  useEffect(() => () => {
    if (aiTimer.current) clearTimeout(aiTimer.current);
  }, []);

  const activePlayer = players[currentPlayer];
  const pendingCellKeys = useMemo(() => new Set(pending.map((p) => `${p.row}-${p.col}`)), [pending]);
  const rackTilesRemaining = new Set(pending.map((p) => p.rackTileId));
  const visibleRack = activePlayer.rack.filter((t) => !rackTilesRemaining.has(t.id));

  function applyMove(playerIndex: 0 | 1, placements: Placement[], score: number) {
    setBoard((prevBoard) => {
      const next = prevBoard.map((row) => row.slice());
      for (const p of placements) {
        next[p.row][p.col] = { letter: p.letter, isBlank: p.isBlank, value: p.isBlank ? 0 : letterValue(p.letter) };
      }
      return next;
    });
    setBag((prevBag) => {
      const nextBag = prevBag.slice();
      setPlayers((prevPlayers) => {
        const usedIds = new Set(placements.map((p) => p.rackTileId));
        const nextPlayers = prevPlayers.slice() as PlayerState[];
        const player = nextPlayers[playerIndex];
        const remainingRack = player.rack.filter((t) => !usedIds.has(t.id));
        const refilled = refillRack(remainingRack, nextBag);
        nextPlayers[playerIndex] = { ...player, rack: refilled, score: player.score + score };
        return nextPlayers;
      });
      return nextBag;
    });
  }

  function endTurn(playedThisTurn: boolean) {
    setPassStreak((s) => (playedThisTurn ? 0 : s + 1));
    setPending([]);
    setSelectedRackId(null);
    setMessage(null);
    setCurrentPlayer((p) => (p === 0 ? 1 : 0));
  }

  // Game ends when someone empties their rack with the bag exhausted, or
  // both players pass in a row with nothing to play.
  useEffect(() => {
    if (gameOver) return;
    const bagEmpty = bag.length === 0;
    const someoneEmptied = bagEmpty && players.some((p) => p.rack.length === 0);
    if (someoneEmptied || passStreak >= 4) {
      setGameOver(true);
    }
  }, [bag, players, passStreak, gameOver]);

  // AI's turn -- pick a move (or pass) after a short, readable delay.
  useEffect(() => {
    if (gameOver) return;
    if (!players[currentPlayer].isAi) return;
    aiTimer.current = setTimeout(() => {
      const aiPlayer = players[currentPlayer];
      const move = chooseAiMove(board, aiPlayer.rack, aiTier as AiTier);
      if (move) {
        applyMove(currentPlayer, move.placements, move.score);
        endTurn(true);
      } else {
        endTurn(false);
      }
    }, AI_MOVE_DELAY_MS);
    return () => {
      if (aiTimer.current) clearTimeout(aiTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, board, gameOver]);

  const handleRackTilePress = (tileId: string | number) => {
    if (activePlayer.isAi || gameOver) return;
    setSelectedRackId((prev) => (prev === tileId ? null : (tileId as number)));
    setMessage(null);
  };

  const handleCellPress = (row: number, col: number) => {
    if (activePlayer.isAi || gameOver) return;
    if (board[row][col] || pendingCellKeys.has(`${row}-${col}`)) {
      // Tapping a tile placed THIS turn recalls it back to the rack.
      const existingPendingIndex = pending.findIndex((p) => p.row === row && p.col === col);
      if (existingPendingIndex >= 0) {
        setPending((prev) => prev.filter((_, i) => i !== existingPendingIndex));
      }
      return;
    }
    if (selectedRackId === null) return;
    const tile = activePlayer.rack.find((t) => t.id === selectedRackId);
    if (!tile) return;

    if (tile.isBlank) {
      setBlankPickerFor({ row, col, rackTileId: tile.id });
      return;
    }
    setPending((prev) => [...prev, { row, col, letter: tile.letter, isBlank: false, rackTileId: tile.id }]);
    setSelectedRackId(null);
    setMessage(null);
  };

  const handleBlankLetterChosen = (letter: string) => {
    if (!blankPickerFor) return;
    setPending((prev) => [...prev, { ...blankPickerFor, letter, isBlank: true }]);
    setBlankPickerFor(null);
    setSelectedRackId(null);
    setMessage(null);
  };

  const handleRecallAll = () => {
    setPending([]);
    setSelectedRackId(null);
    setMessage(null);
  };

  const handleSubmit = () => {
    if (pending.length === 0) return;
    const result = validateMove(board, pending);
    if (!result.valid) {
      setMessage(result.error ?? 'Invalid move');
      return;
    }
    applyMove(currentPlayer, pending, result.score);
    endTurn(true);
  };

  const handlePass = () => {
    endTurn(false);
  };

  const finalScores = useMemo(() => {
    if (!gameOver) return players.map((p) => p.score);
    // Standard Scrabble endgame adjustment: whoever emptied their rack
    // gains everyone else's unplayed tile value; everyone else loses theirs.
    const leftover = players.map((p) => p.rack.reduce((sum, t) => sum + (t.isBlank ? 0 : letterValue(t.letter)), 0));
    const emptiedIndex = players.findIndex((p) => p.rack.length === 0);
    if (emptiedIndex < 0) return players.map((p, i) => p.score - leftover[i]);
    const totalOthers = leftover.reduce((sum, v, i) => (i === emptiedIndex ? sum : sum + v), 0);
    return players.map((p, i) => {
      if (i === emptiedIndex) return p.score + totalOthers;
      return p.score - leftover[i];
    });
  }, [gameOver, players]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: ACCENT }]}>
        <Text style={styles.headerTitle}>Bible Scrabble</Text>
        <View style={styles.modeRow}>
          {(['ai', 'passAndPlay'] as Mode[]).map((m) => (
            <Pressable
              key={m}
              style={[styles.modeChip, mode === m && styles.modeChipActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.modeChipText, mode === m && styles.modeChipTextActive]}>
                {m === 'ai' ? 'Vs. AI' : 'Pass & Play'}
              </Text>
            </Pressable>
          ))}
        </View>
        {mode === 'ai' && (
          <View style={styles.modeRow}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <Pressable
                key={d}
                style={[styles.modeChip, aiTier === d && styles.modeChipActive]}
                onPress={() => setAiTier(d)}
              >
                <Text style={[styles.modeChipText, aiTier === d && styles.modeChipTextActive]}>
                  {d[0].toUpperCase() + d.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        <View style={styles.scoreboard}>
          <View style={[styles.scoreCard, currentPlayer === 0 && styles.scoreCardActive]}>
            <Text style={[styles.scoreCardLabel, currentPlayer === 0 && { color: ACCENT }]}>You</Text>
            <Text style={[styles.scoreCardValue, currentPlayer === 0 && { color: ACCENT }]}>{players[0].score}</Text>
          </View>
          <View style={styles.bagCard}>
            <Ionicons name="albums-outline" size={14} color={Colors.white} />
            <Text style={styles.bagCardValue}>{bag.length}</Text>
          </View>
          <View style={[styles.scoreCard, currentPlayer === 1 && styles.scoreCardActive]}>
            <Text style={[styles.scoreCardLabel, currentPlayer === 1 && { color: ACCENT }]}>{mode === 'ai' ? 'AI' : 'Player 2'}</Text>
            <Text style={[styles.scoreCardValue, currentPlayer === 1 && { color: ACCENT }]}>{players[1].score}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {gameOver ? (
          <View style={[styles.resultBanner, { backgroundColor: '#6FCF97' }]}>
            <Ionicons name="sparkles" size={18} color={Colors.white} />
            <Text style={styles.resultBannerText}>
              {finalScores[0] === finalScores[1]
                ? `Tied at ${finalScores[0]}!`
                : finalScores[0] > finalScores[1]
                ? `You win, ${finalScores[0]}-${finalScores[1]}!`
                : `${mode === 'ai' ? 'AI' : 'Player 2'} wins, ${finalScores[1]}-${finalScores[0]}!`}
            </Text>
          </View>
        ) : (
          <Text style={styles.turnText}>
            {activePlayer.isAi ? 'AI is thinking...' : mode === 'passAndPlay' ? `${currentPlayer === 0 ? 'Player 1' : 'Player 2'}'s turn` : 'Your turn'}
          </Text>
        )}
        {message && <Text style={styles.message}>{message}</Text>}

        <View style={styles.legend}>
          {(['TW', 'DW', 'TL', 'DL'] as const).map((key) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: PREMIUM_COLORS[key] }]} />
              <Text style={styles.legendText}>{PREMIUM_NAMES[key]}</Text>
            </View>
          ))}
        </View>

        <View style={styles.board}>
          {Array.from({ length: BOARD_SIZE }, (_, row) => (
            <View key={row} style={styles.boardRow}>
              {Array.from({ length: BOARD_SIZE }, (_, col) => {
                const tile = board[row][col];
                const pendingTile = pending.find((p) => p.row === row && p.col === col);
                const premium = PREMIUM_GRID[row][col];
                const isCenter = row === CENTER.row && col === CENTER.col;
                return (
                  <Pressable
                    key={col}
                    style={[
                      styles.cell,
                      premium && { backgroundColor: PREMIUM_COLORS[premium] },
                      (tile || pendingTile) && styles.cellFilled,
                      pendingTile && styles.cellPending,
                    ]}
                    onPress={() => handleCellPress(row, col)}
                  >
                    {tile || pendingTile ? (
                      <>
                        <Text style={styles.cellLetter}>{(tile ?? pendingTile)!.letter}</Text>
                        <Text style={styles.cellValue}>{tile ? tile.value : letterValue(pendingTile!.letter)}</Text>
                      </>
                    ) : isCenter ? (
                      <Ionicons name="star" size={12} color={Colors.white} />
                    ) : premium ? (
                      <Text style={styles.premiumLabel}>{PREMIUM_LABELS[premium]}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.rackArea}>
          <View style={styles.rack}>
            {visibleRack.map((tile) => (
              <Pressable
                key={tile.id}
                style={[styles.rackTile, selectedRackId === tile.id && styles.rackTileSelected]}
                onPress={() => handleRackTilePress(tile.id)}
              >
                <Text style={styles.rackTileLetter}>{tile.isBlank ? '?' : tile.letter}</Text>
                <Text style={styles.rackTileValue}>{tile.isBlank ? 0 : letterValue(tile.letter)}</Text>
              </Pressable>
            ))}
          </View>

          {!activePlayer.isAi && !gameOver && (
            <View style={styles.actionRow}>
              <Pressable style={styles.actionButtonSecondary} onPress={handleRecallAll} disabled={pending.length === 0}>
                <Text style={styles.actionButtonSecondaryText}>Recall</Text>
              </Pressable>
              <Pressable style={styles.actionButtonSecondary} onPress={handlePass}>
                <Text style={styles.actionButtonSecondaryText}>Pass</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButtonPrimary, pending.length === 0 && styles.actionButtonDisabled]}
                onPress={handleSubmit}
                disabled={pending.length === 0}
              >
                <Text style={styles.actionButtonPrimaryText}>Play Word</Text>
              </Pressable>
            </View>
          )}

          {gameOver && (
            <Pressable style={[styles.actionButtonPrimary, { marginTop: 14 }]} onPress={() => setGameKey((k) => k + 1)}>
              <Text style={styles.actionButtonPrimaryText}>New Game</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {blankPickerFor && (
        <View style={styles.blankPickerOverlay}>
          <View style={styles.blankPickerCard}>
            <Text style={styles.blankPickerTitle}>Choose a letter for the blank</Text>
            <View style={styles.blankPickerGrid}>
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => (
                <Pressable key={letter} style={styles.blankPickerKey} onPress={() => handleBlankLetterChosen(letter)}>
                  <Text style={styles.blankPickerKeyText}>{letter}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.blankPickerCancel} onPress={() => setBlankPickerFor(null)}>
              <Text style={[styles.blankPickerCancelText, { color: ACCENT }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FBE9EA' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  modeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  modeChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)' },
  modeChipActive: { backgroundColor: Colors.white },
  modeChipText: { fontSize: 12.5, fontWeight: '700', color: Colors.white },
  modeChipTextActive: { color: ACCENT },
  scoreboard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  scoreCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14,
    paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center',
  },
  scoreCardActive: { backgroundColor: Colors.white },
  scoreCardLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  scoreCardValue: { fontSize: 18, fontWeight: '800', color: Colors.white, marginTop: 2 },
  bagCard: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  bagCardValue: { fontSize: 12.5, fontWeight: '700', color: Colors.white },
  content: { alignItems: 'center', paddingVertical: 16, paddingBottom: 40, paddingHorizontal: 10 },
  turnText: { fontSize: 14, fontWeight: '700', color: ACCENT, marginBottom: 8 },
  message: { fontSize: 12.5, fontWeight: '700', color: '#EF6C4D', marginBottom: 8, textAlign: 'center' },
  resultBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, marginBottom: 12,
  },
  resultBannerText: { color: Colors.white, fontWeight: '800', fontSize: 14, textAlign: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 10.5, fontWeight: '700', color: '#5A6470' },
  board: {
    width: '100%', aspectRatio: 1, backgroundColor: Colors.white, borderRadius: 10,
    borderWidth: 2, borderColor: '#E8D9C5', overflow: 'hidden',
  },
  boardRow: { flex: 1, flexDirection: 'row' },
  cell: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: '#EDEDED', backgroundColor: '#FBF9F4',
  },
  cellFilled: {
    backgroundColor: '#FFD166',
    shadowColor: '#8A6416', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 1, elevation: 2,
  },
  cellPending: { borderWidth: 1.5, borderColor: '#2E9C63' },
  cellLetter: { fontSize: 11, fontWeight: '800', color: '#3A2C1E' },
  cellValue: { position: 'absolute', bottom: 1, right: 2, fontSize: 6, fontWeight: '700', color: '#3A2C1E' },
  premiumLabel: { fontSize: 8, fontWeight: '800', color: Colors.white, letterSpacing: -0.3 },
  rackArea: { width: '100%', marginTop: 18, alignItems: 'center' },
  rack: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  rackTile: {
    width: 42, height: 42, borderRadius: 8, backgroundColor: '#FFD166',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E8B84B',
  },
  rackTileSelected: { borderColor: ACCENT, borderWidth: 3 },
  rackTileLetter: { fontSize: 18, fontWeight: '800', color: '#3A2C1E' },
  rackTileValue: { position: 'absolute', bottom: 2, right: 4, fontSize: 8, fontWeight: '700', color: '#3A2C1E' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionButtonSecondary: {
    borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 2, borderColor: ACCENT, backgroundColor: Colors.white,
  },
  actionButtonSecondaryText: { color: ACCENT, fontWeight: '700', fontSize: 13 },
  actionButtonPrimary: { borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: ACCENT },
  actionButtonDisabled: { opacity: 0.4 },
  actionButtonPrimaryText: { color: Colors.white, fontWeight: '800', fontSize: 13 },
  blankPickerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  blankPickerCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 20, width: '100%' },
  blankPickerTitle: { fontSize: 15, fontWeight: '800', color: '#1C1006', marginBottom: 14, textAlign: 'center' },
  blankPickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  blankPickerKey: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: '#F5C9A0',
    alignItems: 'center', justifyContent: 'center',
  },
  blankPickerKeyText: { fontSize: 14, fontWeight: '800', color: '#3A2C1E' },
  blankPickerCancel: { marginTop: 16, alignItems: 'center' },
  blankPickerCancelText: { fontWeight: '700', fontSize: 14 },
});
