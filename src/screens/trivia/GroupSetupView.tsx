import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import type { GroupPlayer, TriviaQuestion } from '../../types/trivia';
import { fetchPracticeQuestions } from '../../services/triviaApi';

const QUESTIONS_PER_PLAYER = 5;

interface Props {
  onBack: () => void;
  onStart: (players: GroupPlayer[], questions: TriviaQuestion[]) => void;
}

export default function GroupSetupView({ onBack, onStart }: Props) {
  const [names, setNames] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);

  const updateName = (index: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const addPlayer = () => setNames((prev) => [...prev, '']);
  const removePlayer = (index: number) => setNames((prev) => prev.filter((_, i) => i !== index));

  const start = async () => {
    const trimmed = names.map((n) => n.trim()).filter((n) => n.length > 0);
    if (trimmed.length < 2) {
      Alert.alert('Add at least two players', 'Group Play needs two or more names to take turns.');
      return;
    }
    setLoading(true);
    try {
      const questions = await fetchPracticeQuestions({ count: trimmed.length * QUESTIONS_PER_PLAYER });
      if (questions.length === 0) {
        Alert.alert('Could not load questions', 'Please try again.');
        return;
      }
      const players: GroupPlayer[] = trimmed.map((name) => ({ name, score: 0, answered: 0 }));
      onStart(players, questions);
    } catch {
      Alert.alert('Could not load questions', 'Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={onBack} style={styles.backRow} accessibilityRole="button">
          <Ionicons name="chevron-back" size={18} color={Colors.royal} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Group Play</Text>
        <Text style={styles.subtitle}>Add everyone playing -- you'll pass the phone and take turns.</Text>

        {names.map((name, index) => (
          <View key={index} style={styles.playerRow}>
            <TextInput
              style={styles.input}
              placeholder={`Player ${index + 1} name`}
              placeholderTextColor={Colors.muted}
              value={name}
              onChangeText={(v) => updateName(index, v)}
              maxLength={40}
            />
            {names.length > 2 && (
              <TouchableOpacity onPress={() => removePlayer(index)} accessibilityRole="button" accessibilityLabel="Remove player">
                <Ionicons name="close-circle" size={22} color={Colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addPlayerButton} onPress={addPlayer} accessibilityRole="button">
          <Ionicons name="add" size={18} color={Colors.royal} />
          <Text style={styles.addPlayerText}>Add another player</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.startButton} onPress={start} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.royal} /> : <Text style={styles.startButtonText}>Start Group Round</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backText: { color: Colors.royal, fontWeight: '600', fontSize: 14 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.royal, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.ink, opacity: 0.75, marginBottom: 20 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.muted,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.ink,
  },
  addPlayerButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, marginBottom: 20 },
  addPlayerText: { color: Colors.royal, fontWeight: '600', fontSize: 14 },
  startButton: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  startButtonText: { color: Colors.royal, fontWeight: '800', fontSize: 15 },
});
