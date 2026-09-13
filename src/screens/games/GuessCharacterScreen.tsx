// Guess the Character -- one of the 9 Jesus Interactive Games Hub tiles.
// Colorful/playful tile board (see GamesHubScreen.tsx's own comment on
// why this whole feature breaks from the app's usual navy/gold look).
//
// Progressive clue reveal + tap-a-name multiple choice -- no typing
// anywhere, same safe pattern as VerseRebuildScreen.tsx and the other
// games built after Verse Wordle's free-text keyboard proved unreliable.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { GAMES_CATALOG, type Difficulty } from '../../data/gamesCatalog';
import { generateGuessCharacterPuzzle, getRandomGuessCharacterSeed } from '../../services/guessCharacterPuzzle';

const ACCENT = GAMES_CATALOG.find((g) => g.id === 'GameGuessCharacter')!.color;

export default function GuessCharacterScreen() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [seed, setSeed] = useState(() => getRandomGuessCharacterSeed());
  const puzzle = useMemo(() => generateGuessCharacterPuzzle(seed, difficulty), [seed, difficulty]);

  const [revealedCount, setRevealedCount] = useState(1);
  const [wrongNames, setWrongNames] = useState<Set<string>>(new Set());
  const [won, setWon] = useState(false);

  const puzzleKey = `${puzzle.seed}-${puzzle.difficulty}`;
  const [lastPuzzleKey, setLastPuzzleKey] = useState(puzzleKey);
  if (puzzleKey !== lastPuzzleKey) {
    setLastPuzzleKey(puzzleKey);
    setRevealedCount(1);
    setWrongNames(new Set());
    setWon(false);
  }

  const handleOptionPress = (name: string) => {
    if (won) return;
    if (name === puzzle.character.name) {
      setWon(true);
    } else {
      setWrongNames((prev) => new Set(prev).add(name));
      setRevealedCount((c) => Math.min(c + 1, puzzle.clues.length));
    }
  };

  const remainingOptions = puzzle.options.filter((name) => !wrongNames.has(name));

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: ACCENT }]}>
        <Text style={styles.headerTitle}>Guess the Character</Text>
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
        <Text style={styles.instructions}>Read the clues and tap who you think it is. A wrong guess reveals another clue.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cluesCard}>
          {puzzle.clues.slice(0, revealedCount).map((clue, i) => (
            <View key={i} style={styles.clueRow}>
              <Ionicons name="sparkles-outline" size={14} color={ACCENT} />
              <Text style={styles.clueText}>{clue}</Text>
            </View>
          ))}
        </View>

        {won ? (
          <>
            <View style={[styles.resultBanner, { backgroundColor: '#6FCF97' }]}>
              <Ionicons name="sparkles" size={18} color={Colors.white} />
              <Text style={styles.resultBannerText}>It was {puzzle.character.name}!</Text>
            </View>
            <View style={styles.verseCard}>
              <Text style={styles.verseReference}>{puzzle.character.name}</Text>
              <Text style={styles.verseText}>{puzzle.character.summary}</Text>
            </View>
            <Pressable style={[styles.newPuzzleButton, { borderColor: ACCENT }]} onPress={() => setSeed(getRandomGuessCharacterSeed())}>
              <Text style={[styles.newPuzzleButtonText, { color: ACCENT }]}>New Puzzle</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.options}>
            {remainingOptions.map((name) => (
              <Pressable key={name} style={styles.option} onPress={() => handleOptionPress(name)}>
                <Text style={styles.optionText}>{name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {!won && revealedCount < puzzle.clues.length && (
          <Pressable style={styles.hintButton} onPress={() => setRevealedCount((c) => Math.min(c + 1, puzzle.clues.length))}>
            <Text style={[styles.hintButtonText, { color: ACCENT }]}>Reveal another clue</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF3F7' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  difficultyRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  difficultyChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)' },
  difficultyChipActive: { backgroundColor: Colors.white },
  difficultyChipText: { fontSize: 12.5, fontWeight: '700', color: Colors.white },
  difficultyChipTextActive: { color: ACCENT },
  instructions: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 10, lineHeight: 16 },
  content: { alignItems: 'center', paddingVertical: 20, paddingBottom: 40, paddingHorizontal: 16 },
  cluesCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16, width: '100%', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  clueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  clueText: { flex: 1, fontSize: 14.5, lineHeight: 20, color: '#1C1006', fontWeight: '600' },
  resultBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, marginTop: 18,
  },
  resultBannerText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  verseCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginTop: 14, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  verseReference: { fontSize: 15, fontWeight: '800', color: ACCENT, marginBottom: 6 },
  verseText: { fontSize: 14, lineHeight: 20, color: '#1C1006' },
  newPuzzleButton: { marginTop: 20, borderWidth: 2, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 32 },
  newPuzzleButtonText: { fontWeight: '800', fontSize: 14 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22, justifyContent: 'center' },
  option: {
    borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12,
    backgroundColor: Colors.white, borderWidth: 2, borderColor: ACCENT,
  },
  optionText: { fontSize: 15, fontWeight: '700', color: '#1C1006' },
  hintButton: { marginTop: 16, paddingVertical: 8 },
  hintButtonText: { fontWeight: '700', fontSize: 13 },
});
