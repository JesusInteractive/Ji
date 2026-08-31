// Production backend client. IMPORTANT SECURITY NOTES:
// - Never embed the model API key (OpenAI or otherwise) in this app.
// - Never bundle src/constants/persona.ts's system prompt into a
//   client build meant for distribution -- the backend injects it
//   server-side when it calls the model.
// - Every call here assumes a bearer `authToken` issued by your own
//   auth backend after login; the model/persona API key itself is never
//   sent from or visible to the client.
// - Entitlement (which plan a user is on) must be verified server-side
//   from the store's receipt/purchase record, not trusted from
//   whatever the client sends.

import type { JesusMood, PlanId } from '../types';
import { languageDisplayName } from '../i18n/languages';

// EXPO_PUBLIC_ vars are inlined into the client bundle at build time by
// Expo/Metro -- see .env.example. Every service that needs the backend's
// base URL (this file, services/tts.ts) reads it from here so there's
// one source of truth instead of two that can drift out of sync.
const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.jesusinteractive.com';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API request failed (${res.status}): ${path} ${body}`);
  }
  return res.json() as Promise<T>;
}

export interface RecentMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Streams the reply so the first words can appear within a second or
// two instead of waiting for the entire response -- backend/server.js's
// /v1/chat/messages writes newline-delimited JSON chunks as the model
// generates them. Plain `fetch` can't read a response body
// incrementally in React Native (same limitation noted in
// services/tts.ts), so this uses XMLHttpRequest's `onprogress`, which
// DOES expose the growing `responseText` as data arrives -- the
// standard RN-compatible streaming workaround.
//
// `onDelta` is called with the full accumulated text so far after every
// chunk (already free of the trailing [[MOOD: ...]] tag -- the backend
// holds that back until it knows the real mood, see its own
// TAIL_RESERVE comment), so callers can just setState(accumulated)
// directly rather than concatenating themselves.
export function sendMessageStreaming(
  authToken: string,
  text: string,
  languageCode: string | undefined,
  greeting: { displayName?: string; isFirstMessageToday?: boolean; isFirstMessageEver?: boolean } | undefined,
  recentMessages: RecentMessage[],
  onDelta: (textSoFar: string) => void
): Promise<{ text: string; mood: JesusMood; createdAt: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/v1/chat/messages`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);

    let accumulated = '';
    let processedLength = 0;
    let pendingLine = '';
    let settled = false;

    const processNewText = () => {
      const responseText: string = xhr.responseText || '';
      if (responseText.length <= processedLength) return;
      const newText = responseText.slice(processedLength);
      processedLength = responseText.length;
      const lines = (pendingLine + newText).split('\n');
      pendingLine = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        let parsed: any;
        try {
          parsed = JSON.parse(line);
        } catch {
          continue; // A line split mid-chunk across two onprogress events -- rare, just skip.
        }
        if (parsed.type === 'delta') {
          accumulated += parsed.text;
          onDelta(accumulated);
        } else if (parsed.type === 'done' && !settled) {
          settled = true;
          resolve({ text: accumulated, mood: parsed.mood ?? 'neutral', createdAt: parsed.createdAt });
        } else if (parsed.type === 'error' && !settled) {
          settled = true;
          reject(new Error(parsed.error || 'Model request failed'));
        }
      }
    };

    xhr.onprogress = processNewText;
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4 /* DONE */) return;
      processNewText();
      if (settled) return;
      if (xhr.status >= 200 && xhr.status < 300 && accumulated) {
        // Connection closed before an explicit "done" line arrived --
        // fall back to whatever text did stream in rather than losing it.
        settled = true;
        resolve({ text: accumulated, mood: 'neutral', createdAt: new Date().toISOString() });
      } else {
        settled = true;
        reject(new Error(`API request failed (${xhr.status}): /v1/chat/messages`));
      }
    };
    xhr.onerror = () => {
      if (settled) return;
      settled = true;
      reject(new Error('Network error calling /v1/chat/messages'));
    };

    xhr.send(
      JSON.stringify({ text, languageCode, languageName: languageDisplayName(languageCode), recentMessages, ...greeting })
    );
  });
}

export async function fetchDailyVerse(languageCode: string): Promise<{ reference: string; text: string }> {
  return request(`/v1/daily-verse?lang=${encodeURIComponent(languageCode)}`);
}

// Settings' "Report a technical issue" form (ReportIssueScreen.tsx).
// Unlike reportMessage/fetchDailyVerse above -- which call endpoints
// that were never actually built -- POST /v1/support/report is real
// (see backend/server.js's own comment on where these currently go:
// Vercel's function logs, not a database or email yet).
export async function reportTechIssue(
  authToken: string,
  message: string,
  deviceInfo?: string
): Promise<{ ok: true }> {
  return request('/v1/support/report', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ message, deviceInfo }),
  });
}

export async function reportMessage(
  authToken: string,
  messageId: string,
  reason: string
): Promise<{ ok: true }> {
  return request('/v1/moderation/report', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ messageId, reason }),
  });
}

export async function subscribeToPlan(
  authToken: string,
  planId: PlanId,
  storeReceipt: string
): Promise<{ ok: true; plan: PlanId }> {
  // Backend must validate storeReceipt with Apple/Google server-to-server
  // (or RevenueCat) before activating the plan -- never trust planId alone.
  return request('/v1/billing/subscribe', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ planId, storeReceipt }),
  });
}

export async function purchaseGiftCertificate(
  authToken: string,
  certId: string,
  storeReceipt: string
): Promise<{ ok: true; planId: PlanId; durationMonths: number }> {
  return request('/v1/billing/gift-certificate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ certId, storeReceipt }),
  });
}

export async function createGiftCode(
  authToken: string,
  planId: PlanId,
  durationMonths: number
): Promise<{ code: string }> {
  return request('/v1/gift-codes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ planId, durationMonths }),
  });
}

export async function deleteAccountAndAllData(authToken: string): Promise<{ ok: true }> {
  // Must cascade-delete: chat history, journal, prayer notes, push
  // tokens, analytics linkage (if any), and billing metadata not
  // legally required to retain, per the Privacy Policy's retention
  // section. Confirm this is irreversible in the UI before calling it.
  return request('/v1/account', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` },
  });
}

// Not currently called anywhere in the app -- backend/server.js's
// POST /v1/account/export deliberately returns 501 (there's no
// server-side user data to export yet), so SettingsScreen.tsx's
// "Download my data" uses services/dataExport.ts's on-device export
// instead, which actually works today. Kept here, matching that route's
// shape, for whenever server-side user data exists and this becomes the
// real path (see that route's own comment in server.js).
export async function requestDataExport(authToken: string): Promise<{ downloadUrl: string }> {
  return request('/v1/account/export', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
  });
}

export type { JesusMood };
