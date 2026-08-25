// Client for the Sermon & Bible Study Writer (Study Tools > Sermon
// Writer, gated to Pro/Platinum in SermonWriterScreen.tsx). Deliberately
// its own service, not folded into devotions.ts -- a devotion is a
// cached, once-a-day, reflection-for-the-reader; a sermon is an
// on-demand, unbounded-topic manuscript someone else will be taught
// from, so nothing here is cached client-side the way a devotion is.

import { withAuthRetry } from './backendAuth';

const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.jesusinteractive.com';

export type SermonLength = 'standard' | 'extended';

export interface GenerateSermonParams {
  topic: string;
  passageReference?: string;
  occasion?: string;
  length: SermonLength;
  languageCode?: string;
}

export async function generateSermon(params: GenerateSermonParams): Promise<string> {
  return withAuthRetry(async (token) => {
    const res = await fetch(`${API_BASE_URL}/v1/sermon/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || `Sermon generation failed (${res.status})`);
    }
    const data = await res.json();
    return data.content as string;
  });
}
