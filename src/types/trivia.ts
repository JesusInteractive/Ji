// Shared shapes for the Bible Trivia feature (src/screens/trivia/*,
// src/services/triviaApi.ts, triviaDailyCache.ts). Mirrors
// backend/server.js's mapTriviaQuestionRow()/trivia_scores response
// shapes field-for-field.

export type TriviaTestament = 'old' | 'new';
export type TriviaDifficulty = 'easy' | 'medium' | 'hard';
export type TriviaOption = 'A' | 'B' | 'C';
export type TriviaMode = 'practice' | 'daily' | 'group';

export interface TriviaQuestion {
  id: string;
  bookId: string;
  testament: TriviaTestament;
  difficulty: TriviaDifficulty;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  correctOption: TriviaOption;
  reference: string;
}

export interface TriviaScoreEntry {
  displayName: string;
  score: number;
  total: number;
  mode: TriviaMode;
  createdAt: string;
}

export type TriviaLeaderboardRange = 'week' | 'all-time';

// Group Play (see GroupSetupView/QuizView/ScoreView): entirely
// client-side, in-memory only -- a round is expected to finish in one
// sitting, so this never touches AsyncStorage.
export interface GroupPlayer {
  name: string;
  score: number;
  answered: number;
}

export interface GroupSession {
  players: GroupPlayer[];
  currentPlayerIndex: number;
  currentQuestionIndex: number;
  questions: TriviaQuestion[];
}
