import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import type { GroupSession, TriviaMode, TriviaOption, TriviaQuestion } from '../../types/trivia';
import type { QuizResult } from './TriviaScreen';

interface Props {
  mode: TriviaMode;
  questions: TriviaQuestion[];
  groupSession: GroupSession | null;
  challengeDate?: string;
  onFinish: (result: QuizResult) => void;
  // Lets a player abandon the current round and pick a different game
  // (different filters, Daily, Group) without having to answer every
  // remaining question first -- previously the only way out of an
  // in-progress quiz was finishing it.
  onQuit: () => void;
}

const OPTION_KEYS: TriviaOption[] = ['A', 'B', 'C'];

export default function QuizView({ mode, questions, groupSession, challengeDate, onFinish, onQuit }: Props) {
  // Solo (practice/daily) progress.
  const [soloIndex, setSoloIndex] = useState(0);
  const [soloScore, setSoloScore] = useState(0);

  // Group Play's own round-robin progress -- mirrors GroupSession's
  // shape but kept as local state here so answering updates re-render
  // immediately (TriviaScreen only receives the final result on finish).
  const [players, setPlayers] = useState(groupSession?.players ?? []);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(groupSession?.currentPlayerIndex ?? 0);
  const [groupQuestionIndex, setGroupQuestionIndex] = useState(groupSession?.currentQuestionIndex ?? 0);

  const [selected, setSelected] = useState<TriviaOption | null>(null);

  const isGroup = mode === 'group' && groupSession !== null;
  const currentIndex = isGroup ? groupQuestionIndex : soloIndex;
  const question = questions[currentIndex];

  if (!question) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No questions to show.</Text>
      </View>
    );
  }

  const optionText = (opt: TriviaOption) =>
    opt === 'A' ? question.optionA : opt === 'B' ? question.optionB : question.optionC;

  const handleSelect = (opt: TriviaOption) => {
    if (selected) return; // already answered this question
    setSelected(opt);
    const correct = opt === question.correctOption;

    if (isGroup) {
      const updatedPlayers = players.map((p, i) =>
        i === currentPlayerIndex ? { ...p, score: p.score + (correct ? 1 : 0), answered: p.answered + 1 } : p
      );
      setPlayers(updatedPlayers);

      setTimeout(() => {
        const nextQuestionIndex = groupQuestionIndex + 1;
        if (nextQuestionIndex >= questions.length) {
          onFinish({ kind: 'group', players: updatedPlayers });
          return;
        }
        setGroupQuestionIndex(nextQuestionIndex);
        setCurrentPlayerIndex((currentPlayerIndex + 1) % updatedPlayers.length);
        setSelected(null);
      }, 900);
    } else {
      const updatedScore = soloScore + (correct ? 1 : 0);
      setSoloScore(updatedScore);
      setTimeout(() => {
        const nextIndex = soloIndex + 1;
        if (nextIndex >= questions.length) {
          onFinish({
            kind: 'solo',
            mode: mode === 'daily' ? 'daily' : 'practice',
            score: updatedScore,
            total: questions.length,
            challengeDate,
          });
          return;
        }
        setSoloIndex(nextIndex);
        setSelected(null);
      }, 900);
    }
  };

  const confirmQuit = () => {
    Alert.alert('Quit this game?', 'Your progress in this round will be lost.', [
      { text: 'Keep Playing', style: 'cancel' },
      { text: 'Quit', style: 'destructive', onPress: onQuit },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.quitButton} onPress={confirmQuit} accessibilityRole="button" accessibilityLabel="Quit and choose another game">
        <Ionicons name="close-circle-outline" size={18} color={Colors.ink} />
        <Text style={styles.quitButtonText}>Quit</Text>
      </TouchableOpacity>

      {isGroup && (
        <View style={styles.turnBanner}>
          <Text style={styles.turnText}>It's {players[currentPlayerIndex]?.name}'s turn</Text>
        </View>
      )}

      <Text style={styles.progress}>
        Question {currentIndex + 1} of {questions.length}
      </Text>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{question.question}</Text>
      </View>

      <View style={styles.options}>
        {OPTION_KEYS.map((opt) => {
          const isSelected = selected === opt;
          const isCorrectOption = opt === question.correctOption;
          const showFeedback = selected !== null;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.optionButton,
                showFeedback && isCorrectOption && styles.optionCorrect,
                showFeedback && isSelected && !isCorrectOption && styles.optionWrong,
              ]}
              onPress={() => handleSelect(opt)}
              disabled={selected !== null}
              accessibilityRole="button"
            >
              <Text style={styles.optionLetter}>{opt}</Text>
              <Text style={styles.optionText}>{optionText(opt)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selected && <Text style={styles.reference}>{question.reference}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: Colors.ink, fontSize: 15 },
  quitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quitButtonText: { color: Colors.ink, opacity: 0.6, fontSize: 13, fontWeight: '600' },
  turnBanner: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginBottom: 16 },
  turnText: { color: Colors.royal, fontWeight: '800', fontSize: 16 },
  progress: { textAlign: 'center', color: Colors.ink, opacity: 0.6, fontSize: 13, marginBottom: 12 },
  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.25)',
    minHeight: 100,
    justifyContent: 'center',
  },
  questionText: { fontSize: 18, fontWeight: '700', color: Colors.royal, textAlign: 'center', lineHeight: 25 },
  options: { gap: 12 },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.muted,
  },
  optionCorrect: { borderColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  optionWrong: { borderColor: Colors.danger, backgroundColor: '#FCE8E6' },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.royal,
    color: Colors.ivory,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '800',
    fontSize: 13,
  },
  optionText: { flex: 1, fontSize: 15, color: Colors.ink },
  reference: { textAlign: 'center', marginTop: 16, color: Colors.gold, fontWeight: '700', fontSize: 13 },
});
