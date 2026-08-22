// Short-lived session token client for backend/server.js's requireAuth --
// see that file's own comment for the full model. The app no longer
// ships any long-lived secret; instead it calls POST /v1/auth/session to
// mint a token that expires in ~15 minutes (SESSION_TOKEN_TTL_SECONDS on
// the backend), caches it in memory, and re-mints a fresh one shortly
// before it expires. A token pulled out of the app's memory or off the
// wire is only useful until it expires -- unlike the old
// EXPO_PUBLIC_BACKEND_SECRET, there's nothing long-lived left in the
// built app worth extracting.
//
// This still isn't per-user auth (see server.js's requireAuth comment --
// per-device/user identity is a later step); it only proves the caller
// recently completed a handshake with our own backend, not who they are.

const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.jesusinteractive.com';

// Refresh this long before actual expiry so a call that starts right
// before expiry doesn't get handed a token that dies mid-request.
const REFRESH_MARGIN_SECONDS = 60;

let cachedToken: string | null = null;
let cachedExpiresAt = 0; // epoch ms
// Concurrent callers (e.g. a chat send and a TTS call landing at once)
// should share one in-flight mint instead of each hitting
// /v1/auth/session separately.
let inFlight: Promise<string> | null = null;

async function fetchNewToken(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/v1/auth/session`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Failed to start a session (${res.status})`);
  }
  const data = (await res.json()) as { token: string; expiresIn: number };
  cachedToken = data.token;
  cachedExpiresAt = Date.now() + Math.max(data.expiresIn - REFRESH_MARGIN_SECONDS, 0) * 1000;
  return cachedToken;
}

// Returns a currently-valid session token, minting or refreshing one as
// needed. Pass forceRefresh=true after a downstream call comes back 401 --
// the cached token may have expired or been invalidated earlier than
// this client expected.
export async function getAuthToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && Date.now() < cachedExpiresAt) {
    return cachedToken;
  }
  if (!inFlight) {
    inFlight = fetchNewToken().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

// Wraps a single authenticated call with one automatic retry on a fresh
// token if the first attempt comes back 401 -- covers the token expiring
// (or being revoked) between getAuthToken() returning it and the request
// actually landing. api.ts/tts.ts/stt.ts all throw a plain Error whose
// message embeds the HTTP status (e.g. "API request failed (401): ..."),
// so that's what this matches on rather than requiring those call sites
// to be restructured around a typed error.
export async function withAuthRetry<T>(fn: (authToken: string) => Promise<T>): Promise<T> {
  const token = await getAuthToken();
  try {
    return await fn(token);
  } catch (e) {
    if (e instanceof Error && /\(401\)/.test(e.message)) {
      const freshToken = await getAuthToken(true);
      return await fn(freshToken);
    }
    throw e;
  }
}
