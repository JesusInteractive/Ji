// Bible Trivia -- one of the 9 games on the Jesus Interactive Games Hub
// (GamesStack.tsx's 'GameTrivia' route). Previously its own paywalled
// root-level modal reached from a Home card; moved into the free Games
// Hub and the paywall gate removed accordingly (see GamesHubScreen.tsx's
// own comment on why nothing in this hub is ever gated).
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
import { StyleSheet, Text, View } from 'react-native';
import type { GroupPlayer, GroupSession, TriviaMode, TriviaQuestion } from '../../types/trivia';
import Colors from '../../theme/colors';
import { logEvent } from '../../services/analytics';
import { GAMES_CATALOG } from '../../data/gamesCatalog';
import ModeSelectView from './ModeSelectView';
import GroupSetupView from './GroupSetupView';
import QuizView from './QuizView';
import ScoreView from './ScoreView';
import LeaderboardView from './LeaderboardView';

const ACCENT = GAMES_CATALOG.find((g) => g.id === 'GameTrivia')!.color;

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
    logEvent('feature_used', { feature: 'trivia' });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bible Trivia</Text>
        <Text style={styles.headerSubtitle}>Test your knowledge of Scripture -- solo, daily, or with a group.</Text>
      </View>
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
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: ACCENT },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 6, lineHeight: 16 },
});
