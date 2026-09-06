// Client for backend/server.js's /v1/trivia/* routes -- Bible Trivia's
// question bank, Daily Challenge, and leaderboard. Same shape as
// services/testimonyApi.ts (request<T> + withAuthRetry + getDeviceId),
// no new networking pattern.
import { withAuthRetry } from './backendAuth';
import { getDeviceId } from './deviceId';
import type {
  TriviaDifficulty,
  TriviaLeaderboardRange,
  TriviaMode,
  TriviaQuestion,
  TriviaScoreEntry,
  TriviaTestament,
} from '../types/trivia';

const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.jesusinteractive.com';

async function request<T>(path: string, authToken: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API request failed (${res.status}): ${path} ${body}`);
  }
  return res.json() as Promise<T>;
}

export interface FetchQuestionsOptions {
  testament?: TriviaTestament;
  difficulty?: TriviaDifficulty;
  book?: string;
  count?: number;
}

// Practice mode and Group Play setup both call this for a random batch.
export async function fetchPracticeQuestions(opts: FetchQuestionsOptions = {}): Promise<TriviaQuestion[]> {
  const params = new URLSearchParams();
  if (opts.testament) params.set('testament', opts.testament);
  if (opts.difficulty) params.set('difficulty', opts.difficulty);
  if (opts.book) params.set('book', opts.book);
  params.set('count', String(opts.count ?? 10));
  const data = await withAuthRetry((token) =>
    request<{ questions: TriviaQuestion[] }>(`/v1/trivia/questions?${params.toString()}`, token)
  );
  return data.questions;
}

export interface DailyChallenge {
  date: string;
  questions: TriviaQuestion[];
}

// Today's shared Daily Challenge set -- same for every player that day
// (see server.js's computeOrGetDailySlice). triviaDailyCache.ts wraps
// this with a local AsyncStorage cache so repeat visits the same day
// don't re-fetch.
export async function fetchDailyChallenge(): Promise<DailyChallenge> {
  return withAuthRetry((token) => request<DailyChallenge>('/v1/trivia/daily', token));
}

export interface SubmitScoreInput {
  displayName: string;
  score: number;
  total: number;
  mode: TriviaMode;
  challengeDate?: string;
}

// Practice, today's Daily Challenge, or one player's turn in a Group
// Play session (mode: 'group', one call per player). No login exists in
// this app -- displayName is user-entered, deviceId is this device's
// anonymous id (see deviceId.ts).
export async function submitTriviaScore(input: SubmitScoreInput): Promise<void> {
  const deviceId = await getDeviceId();
  await withAuthRetry((token) =>
    request<{ id: string; createdAt: string }>('/v1/trivia/scores', token, {
      method: 'POST',
      body: JSON.stringify({ deviceId, ...input }),
    })
  );
}

export async function fetchLeaderboard(range: TriviaLeaderboardRange, limit = 20): Promise<TriviaScoreEntry[]> {
  const params = new URLSearchParams({ range, limit: String(limit) });
  const data = await withAuthRetry((token) =>
    request<{ range: string; entries: TriviaScoreEntry[] }>(`/v1/trivia/leaderboard?${params.toString()}`, token)
  );
  return data.entries;
}
