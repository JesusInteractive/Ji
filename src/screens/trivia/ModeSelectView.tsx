import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import type { TriviaDifficulty, TriviaQuestion, TriviaTestament } from '../../types/trivia';
import { fetchPracticeQuestions } from '../../services/triviaApi';
import { getDailyChallenge, hasCompletedDailyChallengeToday } from '../../services/triviaDailyCache';

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
      <Text style={styles.title}>Bible Trivia</Text>
      <Text style={styles.subtitle}>Test your knowledge of Scripture -- solo, daily, or with a group.</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="school-outline" size={20} color={Colors.gold} />
          <Text style={styles.cardTitle}>Practice</Text>
        </View>
        <Text style={styles.cardSubtitle}>Pick your filters and play a round of ten questions.</Text>
        <Text style={styles.filterLabel}>Testament</Text>
        <View style={styles.chipRow}>
          {TESTAMENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.chip, testament === opt.value && styles.chipActive]}
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
              style={[styles.chip, difficulty === opt.value && styles.chipActive]}
              onPress={() => setDifficulty(opt.value)}
            >
              <Text style={[styles.chipText, difficulty === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={startPractice} disabled={loadingPractice}>
          {loadingPractice ? <ActivityIndicator color={Colors.royal} /> : <Text style={styles.primaryButtonText}>Start Practice</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.card} onPress={startDaily} disabled={loadingDaily} accessibilityRole="button">
        <View style={styles.cardHeader}>
          <Ionicons name="calendar-outline" size={20} color={Colors.gold} />
          <Text style={styles.cardTitle}>Daily Challenge</Text>
        </View>
        <Text style={styles.cardSubtitle}>The same ten questions for everyone today -- see how you rank.</Text>
        {loadingDaily && <ActivityIndicator color={Colors.royal} style={{ marginTop: 8 }} />}
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={onStartGroupSetup} accessibilityRole="button">
        <View style={styles.cardHeader}>
          <Ionicons name="people-outline" size={20} color={Colors.gold} />
          <Text style={styles.cardTitle}>Group Play</Text>
        </View>
        <Text style={styles.cardSubtitle}>Pass the phone -- add players and take turns answering.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.leaderboardLink} onPress={onViewLeaderboard} accessibilityRole="button">
        <Ionicons name="trophy-outline" size={18} color={Colors.royal} />
        <Text style={styles.leaderboardLinkText}>View Leaderboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.royal, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.ink, textAlign: 'center', marginBottom: 20, opacity: 0.75 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.25)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.royal },
  cardSubtitle: { fontSize: 13.5, color: Colors.ink, opacity: 0.7, marginBottom: 10 },
  filterLabel: { fontSize: 12, fontWeight: '700', color: Colors.ink, opacity: 0.6, marginTop: 8, marginBottom: 6, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: Colors.muted },
  chipActive: { backgroundColor: Colors.royal, borderColor: Colors.royal },
  chipText: { fontSize: 12.5, color: Colors.ink },
  chipTextActive: { color: Colors.ivory, fontWeight: '700' },
  primaryButton: {
    marginTop: 14,
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: Colors.royal, fontWeight: '800', fontSize: 15 },
  leaderboardLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, padding: 10 },
  leaderboardLinkText: { color: Colors.royal, fontWeight: '700', fontSize: 14 },
});
