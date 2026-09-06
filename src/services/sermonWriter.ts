// Client for the Sermon & Bible Study Writer (Study Tools > Sermon
// Writer, gated to Pro/Platinum in SermonWriterScreen.tsx). Deliberately
// its own service, not folded into devotions.ts -- a devotion is a
// cached, once-a-day, reflection-for-the-reader; a sermon is an
// on-demand, unbounded-topic manuscript someone else will be taught
// from, so nothing here is cached client-side the way a devotion is.

import { withAuthRetry } from './backendAuth';
import { languageDisplayName } from '../i18n/languages';

const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.jesusinteractive.com';

export type SermonLength = 'standard' | 'extended';

export interface GenerateSermonParams {
  topic: string;
  passageReference?: string;
  occasion?: string;
  length: SermonLength;
  languageCode?: string;
}

// Hands the generated sermon to the OS share sheet (Files, AirDrop,
// Mail, etc.) as a plain-text file, so a pastor who generated it while
// online has an actual file they keep offline afterward -- same
// lazy-import + File/Paths + Sharing pattern as dataExport.ts's
// exportLocalDataAsFile(), reused here since generateSermon() itself
// never persists its result (SermonWriterScreen.tsx keeps it only in
// React state, gone the moment the screen unmounts).
export async function exportSermonAsFile(sermonText: string, topic: string): Promise<void> {
  const { File, Paths } = await import('expo-file-system');
  const Sharing = await import('expo-sharing');

  // Trimmed/sanitized so it's a safe filename on every platform's share
  // target, not just this device -- topic is free user text and could
  // contain slashes, emoji, etc.
  const safeTopic = topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'sermon';

  const file = new File(Paths.cache, `${safeTopic}-${Date.now()}.txt`);
  file.create({ overwrite: true });
  file.write(sermonText);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/plain',
    dialogTitle: 'Save or send this sermon',
  });
}

export async function generateSermon(params: GenerateSermonParams): Promise<string> {
  return withAuthRetry(async (token) => {
    const res = await fetch(`${API_BASE_URL}/v1/sermon/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      // languageName: human-readable name (e.g. "Swahili (Kiswahili)"),
      // not just the bare code -- same reasoning as api.ts's chat call.
      body: JSON.stringify({ ...params, languageName: languageDisplayName(params.languageCode) }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || `Sermon generation failed (${res.status})`);
    }
    const data = await res.json();
    return data.content as string;
  });
}
