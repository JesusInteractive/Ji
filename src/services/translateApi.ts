// Client for backend/server.js's POST /v1/translate -- powers
// GospelTranslatorScreen.tsx. Same short-lived session-token auth as
// every other backend call (see backendAuth.ts); no separate secret.

const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.jesusinteractive.com';

export async function translateText(
  authToken: string,
  text: string,
  sourceLanguageName: string,
  targetLanguageName: string
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/v1/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ text, sourceLanguageName, targetLanguageName }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Translate request failed (${res.status}): ${body}`);
  }
  const data = (await res.json()) as { translation: string };
  return data.translation;
}
