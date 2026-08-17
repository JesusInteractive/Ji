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

import type { ChatMessage, JesusMood, PlanId } from '../types';

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

export async function sendMessage(
  authToken: string,
  conversationId: string,
  text: string,
  languageCode?: string
): Promise<ChatMessage> {
  return request<ChatMessage>('/v1/chat/messages', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ conversationId, text, languageCode }),
  });
}

export async function fetchDailyVerse(languageCode: string): Promise<{ reference: string; text: string }> {
  return request(`/v1/daily-verse?lang=${encodeURIComponent(languageCode)}`);
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

export async function purchaseTokenPack(
  authToken: string,
  packId: string,
  storeReceipt: string
): Promise<{ ok: true; tokenBalance: number }> {
  return request('/v1/billing/token-pack', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ packId, storeReceipt }),
  });
}

export async function createGiftCode(
  authToken: string,
  tokens: number
): Promise<{ code: string }> {
  return request('/v1/gift-codes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ tokens }),
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

export async function requestDataExport(authToken: string): Promise<{ downloadUrl: string }> {
  return request('/v1/account/export', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
  });
}

export type { JesusMood };
