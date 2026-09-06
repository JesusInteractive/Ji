import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { submitTriviaScore } from '../../services/triviaApi';
import { markDailyChallengeCompleted } from '../../services/triviaDailyCache';
import type { QuizResult } from './TriviaScreen';

interface Props {
  result: QuizResult;
  onRetry: () => void;
  onDone: () => void;
}

export default function ScoreView({ result, onRetry, onDone }: Props) {
  const { displayName: profileName } = useApp();
  const [name, setName] = useState(profileName || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitSolo = async () => {
    if (result.kind !== 'solo') return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await submitTriviaScore({
        displayName: trimmed,
        score: result.score,
        total: result.total,
        mode: result.mode,
        challengeDate: result.challengeDate,
      });
      if (result.mode === 'daily') {
        await markDailyChallengeCompleted();
      }
      setSubmitted(true);
    } catch {
      // Best-effort -- a failed leaderboard submission shouldn't block
      // the player from seeing their own score or retrying.
    } finally {
      setSubmitting(false);
    }
  };

  // Group Play: submit every player's score in the background, one call
  // each, without blocking the score screen from rendering -- same
  // best-effort spirit as testimonyApi.ts's sendDeviceHeartbeat.
  React.useEffect(() => {
    if (result.kind === 'group') {
      Promise.allSettled(
        result.players.map((p) =>
          submitTriviaScore({ displayName: p.name, score: p.score, total: p.answered, mode: 'group' })
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (result.kind === 'group') {
    const ranked = [...result.players].sort((a, b) => b.score - a.score);
    return (
      <View style={styles.container}>
        <Ionicons name="trophy" size={48} color={Colors.gold} style={{ alignSelf: 'center', marginBottom: 12 }} />
        <Text style={styles.title}>Round Results</Text>
        <View style={styles.rankedList}>
          {ranked.map((p, i) => (
            <View key={p.name} style={styles.rankedRow}>
              <Text style={styles.rankNumber}>{i + 1}</Text>
              <Text style={styles.rankName}>{p.name}</Text>
              <Text style={styles.rankScore}>
                {p.score}/{p.answered}
              </Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={onRetry} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onDone} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="ribbon" size={48} color={Colors.gold} style={{ alignSelf: 'center', marginBottom: 12 }} />
      <Text style={styles.title}>
        You scored {result.score} / {result.total}
      </Text>
      <Text style={styles.subtitle}>
        {result.mode === 'daily' ? "Today's Daily Challenge" : 'Practice round'}
      </Text>

      {!submitted ? (
        <View style={styles.submitBlock}>
          <Text style={styles.submitLabel}>Add your score to the leaderboard</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={Colors.muted}
            value={name}
            onChangeText={setName}
            maxLength={40}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={submitSolo} disabled={submitting || !name.trim()}>
            {submitting ? <ActivityIndicator color={Colors.royal} /> : <Text style={styles.primaryButtonText}>Submit Score</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.submittedText}>Added to the leaderboard!</Text>
      )}

      <TouchableOpacity style={styles.secondaryButton} onPress={onRetry} accessibilityRole="button">
        <Text style={styles.secondaryButtonText}>Play Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.royal, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.ink, opacity: 0.7, textAlign: 'center', marginBottom: 24 },
  submitBlock: { marginBottom: 12 },
  submitLabel: { fontSize: 13, color: Colors.ink, opacity: 0.7, textAlign: 'center', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: Colors.muted,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.ink,
    marginBottom: 12,
    textAlign: 'center',
  },
  submittedText: { textAlign: 'center', color: '#2E7D32', fontWeight: '700', fontSize: 15, marginBottom: 16 },
  primaryButton: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: Colors.royal, fontWeight: '800', fontSize: 15 },
  secondaryButton: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  secondaryButtonText: { color: Colors.royal, fontWeight: '600', fontSize: 14 },
  rankedList: { marginBottom: 24 },
  rankedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.25)',
  },
  rankNumber: { width: 24, fontWeight: '800', color: Colors.gold, fontSize: 15 },
  rankName: { flex: 1, fontSize: 15, color: Colors.ink, fontWeight: '600' },
  rankScore: { fontSize: 15, color: Colors.royal, fontWeight: '800' },
});
