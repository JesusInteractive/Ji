// Fill-in-the-Blank -- one of the 9 Jesus Interactive Games Hub tiles.
// Colorful/playful tile board (see GamesHubScreen.tsx's own comment on
// why this whole feature breaks from the app's usual navy/gold look).
//
// Every blank is multiple-choice, tap-only -- no typing anywhere, same
// safe pattern as VerseRebuildScreen.tsx and MemoryMatchScreen.tsx.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { GAMES_CATALOG, type Difficulty } from '../../data/gamesCatalog';
import { generateFillInBlankPuzzle, getRandomFillInBlankSeed } from '../../services/fillInBlankPuzzle';

const ACCENT = GAMES_CATALOG.find((g) => g.id === 'GameFillInBlank')!.color;

export default function FillInBlankScreen() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [seed, setSeed] = useState(() => getRandomFillInBlankSeed());
  const puzzle = useMemo(() => generateFillInBlankPuzzle(seed, difficulty), [seed, difficulty]);

  const [activeBlank, setActiveBlank] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [wrongOption, setWrongOption] = useState<string | null>(null);

  const puzzleKey = `${puzzle.seed}-${puzzle.difficulty}`;
  const [lastPuzzleKey, setLastPuzzleKey] = useState(puzzleKey);
  if (puzzleKey !== lastPuzzleKey) {
    setLastPuzzleKey(puzzleKey);
    setActiveBlank(0);
    setAnswers({});
    setWrongOption(null);
  }

  const won = activeBlank >= puzzle.blanks.length;
  const currentBlank = won ? null : puzzle.blanks[activeBlank];

  const handleOptionPress = (option: string) => {
    if (!currentBlank) return;
    if (option === currentBlank.correctText) {
      setAnswers((prev) => ({ ...prev, [currentBlank.tokenIndex]: option }));
      setActiveBlank((i) => i + 1);
      setWrongOption(null);
    } else {
      setWrongOption(option);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: ACCENT }]}>
        <Text style={styles.headerTitle}>Fill-in-the-Blank</Text>
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
        <Text style={styles.instructions}>Tap the word that correctly completes each blank.</Text>
        <Text style={styles.hintText}>{puzzle.bookName} {puzzle.reference.chapter}:{puzzle.reference.verse}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.verseCard}>
          <Text style={styles.verseText}>
            {puzzle.tokens.map((tok, i) => {
              const blank = puzzle.blanks.find((b) => b.tokenIndex === i);
              if (!blank) return `${tok} `;
              const answered = answers[i];
              return answered ? `${answered} ` : '_____ ';
            })}
          </Text>
        </View>

        {won && (
          <View style={[styles.resultBanner, { backgroundColor: '#6FCF97' }]}>
            <Ionicons name="sparkles" size={18} color={Colors.white} />
            <Text style={styles.resultBannerText}>Solved!</Text>
          </View>
        )}

        {won && (
          <Pressable style={[styles.newPuzzleButton, { borderColor: ACCENT }]} onPress={() => setSeed(getRandomFillInBlankSeed())}>
            <Text style={[styles.newPuzzleButtonText, { color: ACCENT }]}>New Puzzle</Text>
          </Pressable>
        )}

        {currentBlank && (
          <View style={styles.options}>
            {currentBlank.options.map((option) => {
              const isWrong = wrongOption === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.option, isWrong && styles.optionWrong]}
                  onPress={() => handleOptionPress(option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
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
  safeArea: { flex: 1, backgroundColor: '#FFF6E9' },
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
  verseCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  verseText: { fontSize: 17, lineHeight: 26, color: '#1C1006', fontWeight: '700' },
  resultBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, marginTop: 18,
  },
  resultBannerText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  newPuzzleButton: { marginTop: 20, borderWidth: 2, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 32 },
  newPuzzleButtonText: { fontWeight: '800', fontSize: 14 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24, justifyContent: 'center' },
  option: {
    borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12,
    backgroundColor: Colors.white, borderWidth: 2, borderColor: ACCENT,
  },
  optionWrong: { borderColor: '#EF6C4D', backgroundColor: '#FDEAE3' },
  optionText: { fontSize: 15, fontWeight: '700', color: '#1C1006' },
});
