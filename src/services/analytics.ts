// Client for backend/server.js's POST /v1/analytics/event. Two layers:
// `track()` is the general-purpose primitive (ChatScreen.tsx already
// calls it for 'question_sent'; SettingsScreen.tsx's "Anonymous
// analytics" toggle already calls setAnalyticsOptIn() -- both existed as
// call sites before this file did, this is what actually backs them).
// `logEvent()` is a typed wrapper around the same primitive for the
// specific 10 trial/paywall funnel events (activation, day-2 return,
// trial completion, trial-to-paid conversion, ad-unlock rate) --
// analytics only, no in-app dashboard reads this in v1.
//
// Same best-effort shape as sendDeviceHeartbeat (services/testimonyApi.ts):
// never throws, never blocks the caller, and respects the user's opt-out.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { withAuthRetry } from './backendAuth';
import { getDeviceId } from './deviceId';

const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.jesusinteractive.com';
const OPT_IN_STORAGE_KEY = 'ji_analytics_opt_in_v1';

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

// Opt-out model (default true) -- matches SettingsScreen.tsx's own
// `useState(true)` default for the toggle. Cached in memory after the
// first read so every track() call doesn't hit AsyncStorage.
let cachedOptIn: boolean | null = null;

async function isOptedIn(): Promise<boolean> {
  if (cachedOptIn !== null) return cachedOptIn;
  const raw = await AsyncStorage.getItem(OPT_IN_STORAGE_KEY);
  cachedOptIn = raw === null ? true : raw === '1';
  return cachedOptIn;
}

// Called from SettingsScreen.tsx's "Anonymous analytics" row.
export function setAnalyticsOptIn(enabled: boolean): void {
  cachedOptIn = enabled;
  AsyncStorage.setItem(OPT_IN_STORAGE_KEY, enabled ? '1' : '0').catch(() => {});
}

// General-purpose event primitive -- deliberately not awaited by most
// call sites (e.g. ChatScreen.tsx's `track('question_sent', {plan})`),
// so this manages its own async internally and never throws outward.
export async function track(eventName: string, properties?: Record<string, unknown>): Promise<void> {
  try {
    if (!(await isOptedIn())) return;
    const deviceId = await getDeviceId();
    await withAuthRetry((token) =>
      request<{ ok: boolean }>('/v1/analytics/event', token, {
        method: 'POST',
        body: JSON.stringify({ deviceId, eventName, properties: properties ?? {} }),
      })
    );
  } catch {
    // Best-effort only -- never throw, never block the caller.
  }
}

// Must match this app's actual trial/paywall funnel points (see
// AppContext.tsx's trial effects, PaywallLockScreen.tsx, purchases.ts,
// and backend/server.js's RevenueCat webhook for subscription_cancelled).
// Kept as a TS union (not a plain string) so a typo at one of these
// specific call sites is a compile error, not a silently-misspelled
// event name fragmenting a funnel metric in two.
export type TrialAnalyticsEventName =
  | 'trial_started'
  | 'feature_used'
  | 'trial_day_returned'
  | 'trial_expired'
  | 'paywall_shown'
  | 'subscribe_tapped'
  | 'subscribe_success'
  | 'ad_unlock_started'
  | 'ad_unlock_success'
  | 'subscription_cancelled';

export async function logEvent(eventName: TrialAnalyticsEventName, properties?: Record<string, unknown>): Promise<void> {
  return track(eventName, properties);
}
