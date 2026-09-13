// Client for backend/server.js's POST /v1/founder-access/redeem --
// checks a founder/family/dev free-Platinum code. The codes themselves
// used to live here as EXPO_PUBLIC_ values, which are inlined into the
// client bundle in plain text and readable by decompiling the app; now
// the backend holds them (server-only env vars, never EXPO_PUBLIC_*)
// and this file just asks it whether a code is valid. See server.js's
// own comment on that route for the full reasoning.
import { withAuthRetry } from './backendAuth';
import { getDeviceId } from './deviceId';

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

export type FounderAccessKind = 'founder' | 'family' | 'dev';

export interface FounderAccessResult {
  success: boolean;
  kind?: FounderAccessKind;
}

// Looks like any other code to a caller until it succeeds -- doesn't
// distinguish "wrong code" from "network error" beyond success: false,
// since TokenGiftScreen falls through to the regular gift-code path
// either way (see its own comment on handleRedeem).
export async function redeemFounderAccessCode(code: string): Promise<FounderAccessResult> {
  const trimmed = code.trim();
  if (!trimmed) return { success: false };
  try {
    const deviceId = await getDeviceId();
    const data = await withAuthRetry((token) =>
      request<{ ok: boolean; plan: string; kind: FounderAccessKind }>('/v1/founder-access/redeem', token, {
        method: 'POST',
        body: JSON.stringify({ deviceId, code: trimmed }),
      })
    );
    return { success: true, kind: data.kind };
  } catch {
    return { success: false };
  }
}
