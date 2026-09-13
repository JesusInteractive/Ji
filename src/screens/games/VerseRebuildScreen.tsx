// Verse Rebuild -- one of the 9 Jesus Interactive Games Hub tiles.
// Colorful/playful tile board (see GamesHubScreen.tsx's own comment on
// why this whole feature breaks from the app's usual navy/gold look).
//
// Replaces Verse Wordle: every action here is a single tap on a word
// tile (no on-screen keyboard, no free-text typing), which is a much
// more reliable interaction than per-letter typing turned out to be.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { GAMES_CATALOG, type Difficulty } from '../../data/gamesCatalog';
import { generateRebuildPuzzle, getRandomRebuildSeed } from '../../services/verseRebuildPuzzle';

const ACCENT = GAMES_CATALOG.find((g) => g.id === 'GameVerseRebuild')!.color;

export default function VerseRebuildScreen() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [seed, setSeed] = useState(() => getRandomRebuildSeed());
  const puzzle = useMemo(() => generateRebuildPuzzle(seed, difficulty), [seed, difficulty]);

  const [builtCount, setBuiltCount] = useState(0);
  const [usedBankIds, setUsedBankIds] = useState<Set<number>>(new Set());
  const [wrongTileId, setWrongTileId] = useState<number | null>(null);

  const won = builtCount === puzzle.tokens.length;

  const resetProgress = () => {
    setBuiltCount(0);
    setUsedBankIds(new Set());
    setWrongTileId(null);
  };

  const puzzleKey = `${puzzle.seed}-${puzzle.difficulty}`;
  const [lastPuzzleKey, setLastPuzzleKey] = useState(puzzleKey);
  if (puzzleKey !== lastPuzzleKey) {
    setLastPuzzleKey(puzzleKey);
    resetProgress();
  }

  const handleTilePress = (id: number, text: string) => {
    if (won || usedBankIds.has(id)) return;
    if (text === puzzle.tokens[builtCount]) {
      setUsedBankIds((prev) => new Set(prev).add(id));
      setBuiltCount((c) => c + 1);
      setWrongTileId(null);
    } else {
      setWrongTileId(id);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: ACCENT }]}>
        <Text style={styles.headerTitle}>Verse Rebuild</Text>
        <View style={styles.difficultyRow}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <Pressable
              key={d}
              style={[styles.difficultyChip, difficulty === d && styles.difficultyChipActive]}
              onPress={() => setDifficulty(d)}
            >
              <Text style={[styles.difficultyChipText, difficulty === d && styles.difficultyChipTextActive]}>
                {d[0].toUpperCase() + d.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.instructions}>
          Tap the words in order to rebuild the verse exactly as it's written.
          {puzzle.bank.length > puzzle.tokens.length ? ' A few words in the bank don’t belong.' : ''}
        </Text>
        <Text style={styles.hintText}>
          {puzzle.bookName} {puzzle.reference.chapter}:{puzzle.reference.verse}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.builtCard}>
          <Text style={styles.builtText}>
            {puzzle.tokens.map((t, i) => (i < builtCount ? t : '_____')).join(' ')}
          </Text>
        </View>

        {won && (
          <View style={[styles.resultBanner, { backgroundColor: '#6FCF97' }]}>
            <Ionicons name="sparkles" size={18} color={Colors.white} />
            <Text style={styles.resultBannerText}>Rebuilt!</Text>
          </View>
        )}

        {won && (
          <View style={styles.verseCard}>
            <Text style={styles.verseReference}>
              {puzzle.bookName} {puzzle.reference.chapter}:{puzzle.reference.verse}
            </Text>
            <Text style={styles.verseText}>"{puzzle.verseText}"</Text>
          </View>
        )}

        {won && (
          <Pressable style={[styles.newPuzzleButton, { borderColor: ACCENT }]} onPress={() => setSeed(getRandomRebuildSeed())}>
            <Text style={[styles.newPuzzleButtonText, { color: ACCENT }]}>New Puzzle</Text>
          </Pressable>
        )}

        {!won && (
          <View style={styles.bank}>
            {puzzle.bank.map((tile) => {
              const used = usedBankIds.has(tile.id);
              const isWrong = wrongTileId === tile.id;
              return (
                <Pressable
                  key={tile.id}
                  disabled={used}
                  style={[
                    styles.tile,
                    used && styles.tileUsed,
                    isWrong && styles.tileWrong,
                  ]}
                  onPress={() => handleTilePress(tile.id, tile.text)}
                >
                  <Text style={[styles.tileText, used && styles.tileTextUsed]}>{tile.text}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EAFBF9' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  difficultyRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  difficultyChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)' },
  difficultyChipActive: { backgroundColor: Colors.white },
  difficultyChipText: { fontSize: 12.5, fontWeight: '700', color: Colors.white },
  difficultyChipTextActive: { color: ACCENT },
  instructions: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 10, lineHeight: 16 },
  hintText: { fontSize: 12.5, color: Colors.white, fontWeight: '700', marginTop: 8 },
  content: { alignItems: 'center', paddingVertical: 20, paddingBottom: 40, paddingHorizontal: 16 },
  builtCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  builtText: { fontSize: 17, lineHeight: 26, color: '#1C1006', fontWeight: '700' },
  resultBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, marginTop: 18,
  },
  resultBannerText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  verseCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginTop: 14, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  verseReference: { fontSize: 13, fontWeight: '800', color: ACCENT, marginBottom: 6 },
  verseText: { fontSize: 14, lineHeight: 20, color: '#1C1006', fontStyle: 'italic' },
  newPuzzleButton: { marginTop: 20, borderWidth: 2, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 32 },
  newPuzzleButtonText: { fontWeight: '800', fontSize: 14 },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22, justifyContent: 'center' },
  tile: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.white, borderWidth: 2, borderColor: ACCENT,
  },
  tileUsed: { backgroundColor: '#DCE3E8', borderColor: '#DCE3E8' },
  tileWrong: { borderColor: '#EF6C4D', backgroundColor: '#FDEAE3' },
  tileText: { fontSize: 15, fontWeight: '700', color: '#1C1006' },
  tileTextUsed: { color: '#9AA5B1' },
});
