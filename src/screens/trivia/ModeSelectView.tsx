import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import type { TriviaDifficulty, TriviaQuestion, TriviaTestament } from '../../types/trivia';
import { fetchPracticeQuestions } from '../../services/triviaApi';
import { getDailyChallenge, hasCompletedDailyChallengeToday } from '../../services/triviaDailyCache';
import { GAMES_CATALOG } from '../../data/gamesCatalog';

const ACCENT = GAMES_CATALOG.find((g) => g.id === 'GameTrivia')!.color;
// Each mode gets its own color (reusing other tiles' hues from the hub
// palette) -- a colorful, game-board-like feel of distinct "wedges"
// rather than one flat accent repeated on every card.
const PRACTICE_COLOR = ACCENT;
const DAILY_COLOR = GAMES_CATALOG.find((g) => g.id === 'GameCrossword')!.color;
const GROUP_COLOR = GAMES_CATALOG.find((g) => g.id === 'GameMemoryMatch')!.color;

interface Props {
  onStartPractice: (questions: TriviaQuestion[]) => void;
  onStartDaily: (questions: TriviaQuestion[], date: string) => void;
  onStartGroupSetup: () => void;
  onViewLeaderboard: () => void;
}

const TESTAMENT_OPTIONS: { label: string; value: TriviaTestament | undefined }[] = [
  { label: 'Any testament', value: undefined },
  { label: 'Old Testament', value: 'old' },
  { label: 'New Testament', value: 'new' },
];
const DIFFICULTY_OPTIONS: { label: string; value: TriviaDifficulty | undefined }[] = [
  { label: 'Any difficulty', value: undefined },
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

export default function ModeSelectView({ onStartPractice, onStartDaily, onStartGroupSetup, onViewLeaderboard }: Props) {
  const [testament, setTestament] = useState<TriviaTestament | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<TriviaDifficulty | undefined>(undefined);
  const [loadingPractice, setLoadingPractice] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);

  const startPractice = async () => {
    setLoadingPractice(true);
    try {
      const questions = await fetchPracticeQuestions({ testament, difficulty, count: 10 });
      if (questions.length === 0) {
        Alert.alert('No questions found', 'Try different filters and give it another shot.');
        return;
      }
      onStartPractice(questions);
    } catch {
      Alert.alert('Could not load questions', 'Check your connection and try again.');
    } finally {
      setLoadingPractice(false);
    }
  };

  const startDaily = async () => {
    setLoadingDaily(true);
    try {
      const alreadyPlayed = await hasCompletedDailyChallengeToday();
      if (alreadyPlayed) {
        Alert.alert("You've already played today", "Come back tomorrow for a fresh set of questions.");
        return;
      }
      const challenge = await getDailyChallenge();
      if (challenge.questions.length === 0) {
        Alert.alert('Could not load today’s challenge', 'Please try again shortly.');
        return;
      }
      onStartDaily(challenge.questions, challenge.date);
    } catch {
      Alert.alert('Could not load today’s challenge', 'Check your connection and try again.');
    } finally {
      setLoadingDaily(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.card, styles.cardPractice]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: PRACTICE_COLOR }]}>
            <Ionicons name="school-outline" size={18} color={Colors.white} />
          </View>
          <Text style={styles.cardTitle}>Practice</Text>
        </View>
        <Text style={styles.cardSubtitle}>Pick your filters and play a round of ten questions.</Text>
        <Text style={styles.filterLabel}>Testament</Text>
        <View style={styles.chipRow}>
          {TESTAMENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.chip, testament === opt.value && { backgroundColor: PRACTICE_COLOR, borderColor: PRACTICE_COLOR }]}
              onPress={() => setTestament(opt.value)}
            >
              <Text style={[styles.chipText, testament === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.filterLabel}>Difficulty</Text>
        <View style={styles.chipRow}>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.chip, difficulty === opt.value && { backgroundColor: PRACTICE_COLOR, borderColor: PRACTICE_COLOR }]}
              onPress={() => setDifficulty(opt.value)}
            >
              <Text style={[styles.chipText, difficulty === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRACTICE_COLOR }]} onPress={startPractice} disabled={loadingPractice}>
          {loadingPractice ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryButtonText}>Start Practice</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.card, styles.cardDaily]} onPress={startDaily} disabled={loadingDaily} accessibilityRole="button">
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: DAILY_COLOR }]}>
            <Ionicons name="calendar-outline" size={18} color={Colors.white} />
          </View>
          <Text style={styles.cardTitle}>Daily Challenge</Text>
        </View>
        <Text style={styles.cardSubtitle}>The same ten questions for everyone today -- see how you rank.</Text>
        {loadingDaily && <ActivityIndicator color={DAILY_COLOR} style={{ marginTop: 8 }} />}
      </TouchableOpacity>

      <TouchableOpacity style={[styles.card, styles.cardGroup]} onPress={onStartGroupSetup} accessibilityRole="button">
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: GROUP_COLOR }]}>
            <Ionicons name="people-outline" size={18} color={Colors.white} />
          </View>
          <Text style={styles.cardTitle}>Group Play</Text>
        </View>
        <Text style={styles.cardSubtitle}>Pass the phone -- add players and take turns answering.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.leaderboardLink} onPress={onViewLeaderboard} accessibilityRole="button">
        <Ionicons name="trophy-outline" size={18} color={Colors.gold} />
        <Text style={styles.leaderboardLinkText}>View Leaderboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderLeftWidth: 5,
    borderColor: 'rgba(201,162,39,0.2)',
  },
  cardPractice: { borderLeftColor: PRACTICE_COLOR },
  cardDaily: { borderLeftColor: DAILY_COLOR },
  cardGroup: { borderLeftColor: GROUP_COLOR },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  iconBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.royal },
  cardSubtitle: { fontSize: 13.5, color: Colors.ink, opacity: 0.7, marginBottom: 10 },
  filterLabel: { fontSize: 12, fontWeight: '700', color: Colors.ink, opacity: 0.6, marginTop: 8, marginBottom: 6, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: Colors.muted },
  chipText: { fontSize: 12.5, color: Colors.ink },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  primaryButton: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  leaderboardLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, padding: 10 },
  leaderboardLinkText: { color: Colors.royal, fontWeight: '700', fontSize: 14 },
});
