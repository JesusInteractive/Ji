// Client for backend/server.js's GET /v1/radio/config -- "24/7 Global
// Praise and Worship"'s stream URL/station name/schedule, fetched at
// runtime the same way Bible Trivia's question bank is (see
// triviaApi.ts). No deviceId needed here -- nothing about this config is
// per-device. The one hardcoded stream URL this app is allowed (per the
// requirement "no hardcoded URLs anywhere else") lives in
// constants/radioStations.ts as a fallback for when this call fails.
import { withAuthRetry } from './backendAuth';

const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.jesusinteractive.com';

async function request<T>(path: string, authToken: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API request failed (${res.status}): ${path} ${body}`);
  }
  return res.json() as Promise<T>;
}

export interface RadioScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  programName: string;
}

export interface RadioConfig {
  stationName: string;
  streamUrl: string;
  schedule: RadioScheduleEntry[];
  updatedAt: string;
}

export async function fetchRadioConfig(): Promise<RadioConfig> {
  return withAuthRetry((token) => request<RadioConfig>('/v1/radio/config', token));
}
