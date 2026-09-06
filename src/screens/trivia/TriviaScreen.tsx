// Bible Trivia -- reached from a card on Home directly below Bible Word
// Search (see HomeScreen.tsx), registered as its own root-level modal
// ('Trivia' in RootNavigator.tsx, same pattern as WordSearch/JIRadio).
//
// One nav route, many internal views, switched by plain useState rather
// than nested navigators -- this feature has no existing "one screen,
// many views" precedent elsewhere in the app to copy (every other
// multi-view feature uses separate nav routes per view), but a session
// here (an in-progress quiz, a group's player list) doesn't need to
// survive backgrounding the way real navigation state does, so a plain
// view-state switch is simpler than wiring a nested stack for it.
//
// KNOWN GAP: none of this feature's UI strings are wired into the `t.`
// i18n system yet -- every other locale file in src/i18n/locales/ is
// typed against en.ts's exact shape with no per-key fallback, so adding
// a new `trivia` key to en.ts would break `tsc --noEmit` for all 117
// other locales until each one gains the same key by hand or via a
// translation pass. That backfill is a substantial follow-up on its own;
// shipping the feature with plain English strings now (like this
// comment says) rather than blocking on it, or silently doing a
// low-quality mass-translation, was the deliberate call here.
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { GroupPlayer, GroupSession, TriviaMode, TriviaQuestion } from '../../types/trivia';
import Colors from '../../theme/colors';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import PaywallLockScreen from '../../components/PaywallLockScreen';
import { logEvent } from '../../services/analytics';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import ModeSelectView from './ModeSelectView';
import GroupSetupView from './GroupSetupView';
import QuizView from './QuizView';
import ScoreView from './ScoreView';
import LeaderboardView from './LeaderboardView';

type TriviaView = 'modeSelect' | 'groupSetup' | 'quiz' | 'score' | 'leaderboard';

export interface SoloResult {
  kind: 'solo';
  mode: 'practice' | 'daily';
  score: number;
  total: number;
  challengeDate?: string;
}
export interface GroupResult {
  kind: 'group';
  players: GroupPlayer[];
}
export type QuizResult = SoloResult | GroupResult;

export default function TriviaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { hasAccess } = useFeatureAccess();
  const [view, setView] = useState<TriviaView>('modeSelect');
  const [quizQuestions, setQuizQuestions] = useState<TriviaQuestion[]>([]);
  const [quizMode, setQuizMode] = useState<TriviaMode>('practice');
  const [challengeDate, setChallengeDate] = useState<string | undefined>(undefined);
  const [groupSession, setGroupSession] = useState<GroupSession | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);

  const startSoloQuiz = useCallback((mode: 'practice' | 'daily', questions: TriviaQuestion[], date?: string) => {
    setQuizMode(mode);
    setQuizQuestions(questions);
    setChallengeDate(date);
    setGroupSession(null);
    setView('quiz');
  }, []);

  const startGroupQuiz = useCallback((players: GroupPlayer[], questions: TriviaQuestion[]) => {
    setQuizMode('group');
    setQuizQuestions(questions);
    setGroupSession({ players, currentPlayerIndex: 0, currentQuestionIndex: 0, questions });
    setView('quiz');
  }, []);

  const finishQuiz = useCallback((finalResult: QuizResult) => {
    setResult(finalResult);
    setView('score');
  }, []);

  const backToModeSelect = useCallback(() => {
    setResult(null);
    setGroupSession(null);
    setQuizQuestions([]);
    setView('modeSelect');
  }, []);

  useEffect(() => {
    if (hasAccess) logEvent('feature_used', { feature: 'trivia' });
  }, [hasAccess]);

  // Placed after every hook above (rules of hooks). A root-level modal
  // registered directly on RootStack -- zero getParent() hops needed.
  if (!hasAccess) {
    return <PaywallLockScreen featureName="Bible Trivia" onSubscribe={() => navigation.navigate('Pricing')} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      {view === 'modeSelect' && (
        <ModeSelectView
          onStartPractice={(questions) => startSoloQuiz('practice', questions)}
          onStartDaily={(questions, date) => startSoloQuiz('daily', questions, date)}
          onStartGroupSetup={() => setView('groupSetup')}
          onViewLeaderboard={() => setView('leaderboard')}
        />
      )}
      {view === 'groupSetup' && (
        <GroupSetupView
          onBack={() => setView('modeSelect')}
          onStart={(players, questions) => startGroupQuiz(players, questions)}
        />
      )}
      {view === 'quiz' && (
        <QuizView
          mode={quizMode}
          questions={quizQuestions}
          groupSession={groupSession}
          challengeDate={challengeDate}
          onFinish={finishQuiz}
          onQuit={backToModeSelect}
        />
      )}
      {view === 'score' && result && (
        <ScoreView result={result} onRetry={backToModeSelect} onDone={backToModeSelect} />
      )}
      {view === 'leaderboard' && <LeaderboardView onBack={() => setView('modeSelect')} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.ivory },
});
