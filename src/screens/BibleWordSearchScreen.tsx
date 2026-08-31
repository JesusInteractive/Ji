import React, { useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import { useI18n, interpolate } from '../i18n';
import {
  DIRECTIONS,
  GRID_SIZE,
  getNextPuzzle,
  getPuzzleForDate,
  getRandomPuzzle,
  type PlacedWord,
  type WordSearchPuzzle,
} from '../services/wordSearchPuzzle';

interface Cell {
  row: number;
  col: number;
}

const cellKey = (c: Cell) => `${c.row}-${c.col}`;

// Snaps a raw finger-drag (start -> current cell) to the nearest of the
// puzzle's 8 straight-line directions, then walks that direction out to
// the drag's actual length (clipped to the grid) -- the standard "swipe
// across a straight line of letters" word-search interaction, not a
// freeform path.
function computeSelectionPath(start: Cell, current: Cell): Cell[] {
  const dRow = current.row - start.row;
  const dCol = current.col - start.col;
  if (dRow === 0 && dCol === 0) return [start];

  const absRow = Math.abs(dRow);
  const absCol = Math.abs(dCol);
  let stepRow: number;
  let stepCol: number;
  if (absRow === 0 || absCol === 0 || absRow === absCol) {
    stepRow = Math.sign(dRow);
    stepCol = Math.sign(dCol);
  } else {
    // Off-axis drag -- snap to whichever of the 8 canonical directions is
    // closest by angle, so an imprecise diagonal swipe still resolves to
    // a clean straight line instead of doing nothing.
    const angle = Math.atan2(dRow, dCol);
    let best: [number, number] = DIRECTIONS[0];
    let bestDiff = Infinity;
    for (const [r, c] of DIRECTIONS) {
      let diff = Math.abs(Math.atan2(r, c) - angle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff < bestDiff) {
        bestDiff = diff;
        best = [r, c];
      }
    }
    [stepRow, stepCol] = best;
  }

  const length = Math.max(absRow, absCol) + 1;
  const path: Cell[] = [];
  for (let i = 0; i < length; i++) {
    const row = start.row + stepRow * i;
    const col = start.col + stepCol * i;
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) break;
    path.push({ row, col });
  }
  return path;
}

// True if the dragged path exactly traces this placed word, start-to-end
// in either direction (backward swipes should count same as forward).
function pathMatchesWord(path: Cell[], word: PlacedWord): boolean {
  if (path.length !== word.word.length) return false;
  const start = path[0];
  const end = path[path.length - 1];
  const wordStart = { row: word.row, col: word.col };
  const wordEnd = {
    row: word.row + word.dRow * (word.word.length - 1),
    col: word.col + word.dCol * (word.word.length - 1),
  };
  const sameForward = start.row === wordStart.row && start.col === wordStart.col && end.row === wordEnd.row && end.col === wordEnd.col;
  const sameBackward = start.row === wordEnd.row && start.col === wordEnd.col && end.row === wordStart.row && end.col === wordStart.col;
  return sameForward || sameBackward;
}

export default function BibleWordSearchScreen() {
  const navigation = useNavigation();
  const { t } = useI18n();
  const { completedWordSearchPuzzles, addCompletedWordSearchPuzzle } = useApp();
  const [puzzle, setPuzzle] = useState<WordSearchPuzzle>(() => getPuzzleForDate());
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<Cell[]>([]);
  const [flashIncorrect, setFlashIncorrect] = useState(false);

  const gridOrigin = useRef({ x: 0, y: 0 });
  const gridSize = useRef(0);
  const gridContainerRef = useRef<View>(null);
  const startCellRef = useRef<Cell | null>(null);

  const isComplete = foundWords.size >= puzzle.words.length;
  const alreadyCompletedBefore = completedWordSearchPuzzles.includes(puzzle.seed);

  // The PanResponder below is built exactly once via useRef (same
  // reasoning/tradeoff as DraggableScrollbar.tsx's own PanResponder --
  // rebuilding it every render, e.g. on every selection change during a
  // drag, reads as the drag sticking rather than following the finger).
  // That means its handlers close over whatever `selection`/`puzzle`/
  // `foundWords` were at the moment it was created, NOT their current
  // values -- keeping these refs in sync on every render (direct
  // assignment, not useEffect, so they're current before the very next
  // touch event) is what lets onPanResponderRelease below check the
  // ACTUAL just-completed drag against the ACTUAL current puzzle state
  // instead of silently comparing against stale, empty data forever.
  const selectionRef = useRef<Cell[]>(selection);
  const puzzleRef = useRef(puzzle);
  const foundWordsRef = useRef(foundWords);
  selectionRef.current = selection;
  puzzleRef.current = puzzle;
  foundWordsRef.current = foundWords;

  const foundCellKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const word of puzzle.words) {
      if (!foundWords.has(word.word)) continue;
      for (let i = 0; i < word.word.length; i++) {
        keys.add(cellKey({ row: word.row + word.dRow * i, col: word.col + word.dCol * i }));
      }
    }
    return keys;
  }, [puzzle, foundWords]);

  const selectedCellKeys = useMemo(() => new Set(selection.map(cellKey)), [selection]);

  // Captures the grid's actual on-screen position/size for
  // cellFromTouch below to map raw touch coordinates against. Called
  // from the grid's onLayout AND once after this screen's own
  // slide_from_bottom modal transition finishes (see the effect below)
  // -- onLayout alone fires mid-slide, while the view's window position
  // is still animating into place, so a measurement taken only there
  // captures a moving target and drifts from where the grid actually
  // settles (this is what caused touches to resolve several rows off
  // from the finger).
  function measureGrid() {
    gridContainerRef.current?.measureInWindow((x, y, width) => {
      gridOrigin.current = { x, y };
      gridSize.current = width;
    });
  }

  useEffect(() => {
    // The actual fix: this screen is presented as a modal that slides in
    // (see RootNavigator.tsx's `animation: 'slide_from_bottom'`), which
    // is a native UIKit/View-controller transition -- InteractionManager
    // has no idea it's even happening, so runAfterInteractions alone
    // still fires before the slide genuinely settles (kept below as a
    // harmless extra pass, not the real fix). React Navigation's own
    // 'transitionEnd' event is what actually fires when THIS screen's
    // specific transition finishes, so that's the reliable moment to
    // (re-)measure the grid's true resting position.
    const handle = InteractionManager.runAfterInteractions(measureGrid);
    const unsubscribe = navigation.addListener('transitionEnd' as never, measureGrid);
    return () => {
      handle.cancel();
      unsubscribe();
    };
  }, [navigation]);

  function cellFromTouch(pageX: number, pageY: number): Cell | null {
    if (gridSize.current === 0) return null;
    const cellSize = gridSize.current / GRID_SIZE;
    const localX = pageX - gridOrigin.current.x;
    const localY = pageY - gridOrigin.current.y;
    const col = Math.floor(localX / cellSize);
    const row = Math.floor(localY / cellSize);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    return { row, col };
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => foundWordsRef.current.size < puzzleRef.current.words.length,
      onMoveShouldSetPanResponder: () => foundWordsRef.current.size < puzzleRef.current.words.length,
      onPanResponderGrant: (evt) => {
        const cell = cellFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (!cell) return;
        startCellRef.current = cell;
        selectionRef.current = [cell];
        setSelection([cell]);
        setFlashIncorrect(false);
      },
      onPanResponderMove: (evt) => {
        const start = startCellRef.current;
        if (!start) return;
        const current = cellFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (!current) return;
        const path = computeSelectionPath(start, current);
        selectionRef.current = path;
        setSelection(path);
      },
      onPanResponderRelease: () => {
        const path = selectionRef.current;
        const puzzleNow = puzzleRef.current;
        const foundNow = foundWordsRef.current;
        startCellRef.current = null;
        if (path.length < 2) {
          selectionRef.current = [];
          setSelection([]);
          return;
        }
        const match = puzzleNow.words.find((w) => !foundNow.has(w.word) && pathMatchesWord(path, w));
        if (match) {
          const next = new Set(foundNow);
          next.add(match.word);
          selectionRef.current = [];
          foundWordsRef.current = next;
          setFoundWords(next);
          setSelection([]);
          if (next.size >= puzzleNow.words.length) {
            addCompletedWordSearchPuzzle(puzzleNow.seed);
          }
        } else {
          // Brief fade-away instead of vanishing instantly, so an
          // incorrect swipe still reads as acknowledged, not ignored.
          setFlashIncorrect(true);
          setTimeout(() => {
            selectionRef.current = [];
            setSelection([]);
            setFlashIncorrect(false);
          }, 220);
        }
      },
    })
  ).current;

  const handleNextPuzzle = () => {
    setPuzzle(getNextPuzzle(puzzle.seed));
    setFoundWords(new Set());
    setSelection([]);
  };

  const handleRefresh = () => {
    setPuzzle(getRandomPuzzle());
    setFoundWords(new Set());
    setSelection([]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {interpolate(t.wordSearch.progressLabel, { count: foundWords.size, total: puzzle.words.length })}
        </Text>
        {alreadyCompletedBefore && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.gold} />
            <Text style={styles.completedBadgeText}>{t.wordSearch.completedBadge}</Text>
          </View>
        )}
      </View>

      <View
        ref={gridContainerRef}
        style={styles.gridWrapper}
        onLayout={measureGrid}
        {...panResponder.panHandlers}
      >
        {puzzle.grid.map((rowLetters, row) => (
          <View key={row} style={styles.gridRow}>
            {rowLetters.map((letter, col) => {
              const key = cellKey({ row, col });
              const isFound = foundCellKeys.has(key);
              const isSelected = selectedCellKeys.has(key);
              return (
                <View
                  key={col}
                  style={[
                    styles.cell,
                    isFound && styles.cellFound,
                    isSelected && !isFound && (flashIncorrect ? styles.cellIncorrect : styles.cellSelected),
                  ]}
                >
                  <Text
                    style={[
                      styles.cellText,
                      isFound && styles.cellTextFound,
                      isSelected && !isFound && styles.cellTextSelected,
                    ]}
                  >
                    {letter}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.wordListWrapper}>
        <View style={styles.wordList}>
          {puzzle.words
            .slice()
            .sort((a, b) => a.word.localeCompare(b.word))
            .map((w) => {
              const found = foundWords.has(w.word);
              return (
                <View key={w.word} style={[styles.wordChip, found && styles.wordChipFound]}>
                  <Text style={[styles.wordChipText, found && styles.wordChipTextFound]}>{w.word}</Text>
                </View>
              );
            })}
        </View>
      </View>

      {isComplete && (
        <View style={styles.completionOverlay}>
          <View style={styles.completionCard}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.gold} />
            <Text style={styles.completionTitle}>
              {interpolate(t.wordSearch.completionTitle, { total: puzzle.words.length })}
            </Text>
            <Text style={styles.completionSubtitle}>{t.wordSearch.completionSubtitle}</Text>
            <View style={styles.completionButtons}>
              <TouchableOpacity style={styles.completionBtnPrimary} onPress={handleNextPuzzle}>
                <Text style={styles.completionBtnPrimaryText}>{t.wordSearch.nextPuzzleButton}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.completionBtnSecondary} onPress={handleRefresh}>
                <Text style={styles.completionBtnSecondaryText}>{t.wordSearch.refreshButton}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ivory,
    paddingHorizontal: 12,
    paddingTop: 12,
    borderWidth: 5,
    borderColor: Colors.royal,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#B8933E',
    borderRadius: 18,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.royal,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 11,
    color: Colors.royal,
    fontWeight: '600',
  },
  gridWrapper: {
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    margin: 0.5,
  },
  cellSelected: {
    backgroundColor: Colors.gold,
  },
  cellIncorrect: {
    backgroundColor: Colors.danger,
  },
  cellFound: {
    backgroundColor: Colors.goldLight,
  },
  cellText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.royal,
  },
  cellTextSelected: {
    color: Colors.royal,
  },
  cellTextFound: {
    color: Colors.goldDark,
  },
  wordListWrapper: {
    flex: 1,
    marginTop: 14,
  },
  wordList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordChip: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  wordChipFound: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  wordChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.royal,
    letterSpacing: 0.3,
  },
  wordChipTextFound: {
    color: Colors.royal,
    textDecorationLine: 'line-through',
  },
  completionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 27, 76, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  completionCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  completionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.royal,
    marginTop: 6,
  },
  completionSubtitle: {
    fontSize: 13,
    color: Colors.royal,
    textAlign: 'center',
    marginBottom: 10,
  },
  completionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  completionBtnPrimary: {
    backgroundColor: Colors.gold,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  completionBtnPrimaryText: {
    color: Colors.royal,
    fontWeight: '800',
    fontSize: 14,
  },
  completionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  completionBtnSecondaryText: {
    color: Colors.gold,
    fontWeight: '700',
    fontSize: 14,
  },
});
