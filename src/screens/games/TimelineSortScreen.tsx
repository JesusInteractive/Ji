// Timeline Sort -- one of the 9 Jesus Interactive Games Hub tiles.
// Colorful/playful tile board (see GamesHubScreen.tsx's own comment on
// why this whole feature breaks from the app's usual navy/gold look).
//
// Tap events in chronological order -- no typing anywhere, same tap-tile
// pattern as VerseRebuildScreen.tsx.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { GAMES_CATALOG, type Difficulty } from '../../data/gamesCatalog';
import { generateTimelineSortPuzzle, getRandomTimelineSortSeed } from '../../services/timelineSortPuzzle';

const ACCENT = GAMES_CATALOG.find((g) => g.id === 'GameTimelineSort')!.color;

export default function TimelineSortScreen() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [seed, setSeed] = useState(() => getRandomTimelineSortSeed());
  const puzzle = useMemo(() => generateTimelineSortPuzzle(seed, difficulty), [seed, difficulty]);

  const [builtCount, setBuiltCount] = useState(0);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [wrongId, setWrongId] = useState<string | null>(null);

  const puzzleKey = `${puzzle.seed}-${puzzle.difficulty}`;
  const [lastPuzzleKey, setLastPuzzleKey] = useState(puzzleKey);
  if (puzzleKey !== lastPuzzleKey) {
    setLastPuzzleKey(puzzleKey);
    setBuiltCount(0);
    setUsedIds(new Set());
    setWrongId(null);
  }

  const won = builtCount === puzzle.sequence.length;

  const handleTilePress = (id: string) => {
    if (won || usedIds.has(id)) return;
    if (id === puzzle.sequence[builtCount].id) {
      setUsedIds((prev) => new Set(prev).add(id));
      setBuiltCount((c) => c + 1);
      setWrongId(null);
    } else {
      setWrongId(id);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: ACCENT }]}>
        <Text style={styles.headerTitle}>Timeline Sort</Text>
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
        <Text style={styles.instructions}>Tap the events in the order they happened, earliest first.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sequenceCard}>
          {puzzle.sequence.map((event, i) => (
            <View key={event.id} style={styles.sequenceRow}>
              <View style={[styles.sequenceBadge, i < builtCount && styles.sequenceBadgeFilled]}>
                <Text style={[styles.sequenceBadgeText, i < builtCount && styles.sequenceBadgeTextFilled]}>{i + 1}</Text>
              </View>
              <Text style={styles.sequenceText}>{i < builtCount ? event.title : '?????'}</Text>
            </View>
          ))}
        </View>

        {won && (
          <View style={[styles.resultBanner, { backgroundColor: '#6FCF97' }]}>
            <Ionicons name="sparkles" size={18} color={Colors.white} />
            <Text style={styles.resultBannerText}>Sorted!</Text>
          </View>
        )}

        {won && (
          <Pressable style={[styles.newPuzzleButton, { borderColor: ACCENT }]} onPress={() => setSeed(getRandomTimelineSortSeed())}>
            <Text style={[styles.newPuzzleButtonText, { color: ACCENT }]}>New Puzzle</Text>
          </Pressable>
        )}

        {!won && (
          <View style={styles.bank}>
            {puzzle.shuffled.map((event) => {
              const used = usedIds.has(event.id);
              const isWrong = wrongId === event.id;
              return (
                <Pressable
                  key={event.id}
                  disabled={used}
                  style={[styles.tile, used && styles.tileUsed, isWrong && styles.tileWrong]}
                  onPress={() => handleTilePress(event.id)}
                >
                  <Text style={[styles.tileText, used && styles.tileTextUsed]}>{event.title}</Text>
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
  safeArea: { flex: 1, backgroundColor: '#EEF3FE' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  difficultyRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  difficultyChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)' },
  difficultyChipActive: { backgroundColor: Colors.white },
  difficultyChipText: { fontSize: 12.5, fontWeight: '700', color: Colors.white },
  difficultyChipTextActive: { color: ACCENT },
  instructions: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 10, lineHeight: 16 },
  content: { alignItems: 'center', paddingVertical: 20, paddingBottom: 40, paddingHorizontal: 16 },
  sequenceCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16, width: '100%', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  sequenceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sequenceBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#DCE3E8',
    alignItems: 'center', justifyContent: 'center',
  },
  sequenceBadgeFilled: { backgroundColor: ACCENT },
  sequenceBadgeText: { fontSize: 12, fontWeight: '800', color: '#5A6470' },
  sequenceBadgeTextFilled: { color: Colors.white },
  sequenceText: { flex: 1, fontSize: 14.5, fontWeight: '700', color: '#1C1006' },
  resultBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, marginTop: 18,
  },
  resultBannerText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  newPuzzleButton: { marginTop: 20, borderWidth: 2, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 32 },
  newPuzzleButtonText: { fontWeight: '800', fontSize: 14 },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22, justifyContent: 'center' },
  tile: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.white, borderWidth: 2, borderColor: ACCENT, maxWidth: '100%',
  },
  tileUsed: { backgroundColor: '#DCE3E8', borderColor: '#DCE3E8' },
  tileWrong: { borderColor: '#EF6C4D', backgroundColor: '#FDEAE3' },
  tileText: { fontSize: 14, fontWeight: '700', color: '#1C1006' },
  tileTextUsed: { color: '#9AA5B1' },
});
