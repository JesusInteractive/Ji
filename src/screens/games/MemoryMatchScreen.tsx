// Memory Match -- one of the 9 Jesus Interactive Games Hub tiles.
// Colorful/playful tile board (see GamesHubScreen.tsx's own comment on
// why this whole feature breaks from the app's usual navy/gold look).
//
// Pure tap-to-flip interaction, no typing anywhere -- deliberately the
// lowest-risk game to build, and a safe pattern given the touch/typing
// reliability problems Verse Wordle ran into (see VerseRebuildScreen.tsx).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { GAMES_CATALOG, type Difficulty } from '../../data/gamesCatalog';
import { generateMemoryPuzzle, getRandomMemorySeed } from '../../services/memoryMatchPuzzle';

const ACCENT = GAMES_CATALOG.find((g) => g.id === 'GameMemoryMatch')!.color;
const MISMATCH_DELAY_MS = 700;

export default function MemoryMatchScreen() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [seed, setSeed] = useState(() => getRandomMemorySeed());
  const puzzle = useMemo(() => generateMemoryPuzzle(seed, difficulty), [seed, difficulty]);

  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFlippedIds([]);
    setMatchedPairIds(new Set());
    setMoves(0);
    setLocked(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [puzzle]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const won = matchedPairIds.size === puzzle.pairCount;

  const handleCardPress = (card: { id: number; pairId: number }) => {
    if (locked || won) return;
    if (flippedIds.includes(card.id) || matchedPairIds.has(card.pairId)) return;

    if (flippedIds.length === 0) {
      setFlippedIds([card.id]);
      return;
    }

    const nextFlipped = [...flippedIds, card.id];
    setFlippedIds(nextFlipped);
    setMoves((m) => m + 1);

    const firstCard = puzzle.cards.find((c) => c.id === flippedIds[0]);
    if (firstCard && firstCard.pairId === card.pairId) {
      setMatchedPairIds((prev) => new Set(prev).add(card.pairId));
      setFlippedIds([]);
    } else {
      setLocked(true);
      timeoutRef.current = setTimeout(() => {
        setFlippedIds([]);
        setLocked(false);
      }, MISMATCH_DELAY_MS);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: ACCENT }]}>
        <Text style={styles.headerTitle}>Memory Match</Text>
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
          Flip two cards at a time and find every matching pair -- a verse with its reference, or a Bible character
          with their description.
        </Text>
        <Text style={styles.hintText}>{puzzle.pairCount} pairs -- {moves} moves</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {won && (
          <View style={[styles.resultBanner, { backgroundColor: '#6FCF97' }]}>
            <Ionicons name="sparkles" size={18} color={Colors.white} />
            <Text style={styles.resultBannerText}>All matched in {moves} moves!</Text>
          </View>
        )}

        <View style={styles.grid}>
          {puzzle.cards.map((card) => {
            const isFlipped = flippedIds.includes(card.id);
            const isMatched = matchedPairIds.has(card.pairId);
            const faceUp = isFlipped || isMatched;
            return (
              <Pressable
                key={card.id}
                style={[
                  styles.card,
                  faceUp && styles.cardFaceUp,
                  isMatched && styles.cardMatched,
                ]}
                onPress={() => handleCardPress(card)}
              >
                {faceUp ? (
                  <Text style={[styles.cardText, isMatched && styles.cardTextMatched]} numberOfLines={4}>
                    {card.text}
                  </Text>
                ) : (
                  <Ionicons name="book-outline" size={22} color={Colors.white} />
                )}
              </Pressable>
            );
          })}
        </View>

        {won && (
          <Pressable style={[styles.newPuzzleButton, { borderColor: ACCENT }]} onPress={() => setSeed(getRandomMemorySeed())}>
            <Text style={[styles.newPuzzleButtonText, { color: ACCENT }]}>New Puzzle</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_WIDTH = '31%';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F0FB' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  difficultyRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  difficultyChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)' },
  difficultyChipActive: { backgroundColor: Colors.white },
  difficultyChipText: { fontSize: 12.5, fontWeight: '700', color: Colors.white },
  difficultyChipTextActive: { color: ACCENT },
  instructions: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 10, lineHeight: 16 },
  hintText: { fontSize: 12.5, color: Colors.white, fontWeight: '700', marginTop: 8 },
  content: { alignItems: 'center', paddingVertical: 20, paddingBottom: 40, paddingHorizontal: 12 },
  resultBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, marginBottom: 16,
  },
  resultBannerText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: '3.5%', justifyContent: 'flex-start' },
  card: {
    width: CARD_WIDTH, aspectRatio: 0.85, borderRadius: 12, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center', padding: 6, marginBottom: 10,
  },
  cardFaceUp: { backgroundColor: Colors.white, borderWidth: 2, borderColor: ACCENT },
  cardMatched: { backgroundColor: '#E4F8EE', borderColor: '#6FCF97' },
  cardText: { fontSize: 11.5, fontWeight: '700', color: '#1C1006', textAlign: 'center' },
  cardTextMatched: { color: '#1F6B45' },
  newPuzzleButton: { marginTop: 12, borderWidth: 2, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 32 },
  newPuzzleButtonText: { fontWeight: '800', fontSize: 14 },
});
