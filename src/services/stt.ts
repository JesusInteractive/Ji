// Speech-to-text client for the Chat screen's mic button. Backend lives
// at backend/server.js (Express + @elevenlabs/elevenlabs-js's Scribe
// model) -- same "doesn't run in the RN app" rule and same shared-secret
// auth as tts.ts's synthesizeSpeech(). Reuses the ElevenLabs account
// already set up for TTS rather than adding a second STT provider/key.
//
// UPLOAD: the recorded clip is a local file (a .m4a written by
// expo-audio's AudioRecorder in ChatScreen.tsx). This originally built a
// FormData with an RN-specific { uri, name, type } object appended in
// place of a Blob -- that shorthand doesn't work on this RN version
// (0.86.2) and threw "Unsupported FormDataPart implementation" at
// upload time. Tried expo-file-system's new class-based `File`/
// `UploadTask` API next, which threw its own "undefined is not a
// function" -- SDK 57's rewrite of that module is new enough that Expo
// Go's bundled native binary doesn't fully support it yet. Using the
// `expo-file-system/legacy` subpath instead: the older, long-stable
// `uploadAsync(url, fileUri, options)` free function that's shipped in
// Expo Go for years, well past this specific SDK-57-rewrite risk.

import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';

const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.jesusinteractive.com';

export async function transcribeSpeech(authToken: string, audioUri: string): Promise<string> {
  const result = await uploadAsync(`${API_BASE_URL}/v1/stt/transcribe`, audioUri, {
    httpMethod: 'POST',
    uploadType: FileSystemUploadType.MULTIPART,
    fieldName: 'audio',
    mimeType: 'audio/m4a',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`STT request failed (${result.status}): ${result.body}`);
  }

  const data = JSON.parse(result.body);
  return typeof data.text === 'string' ? data.text.trim() : '';
}
