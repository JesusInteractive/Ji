// Text-to-speech client. Wired into ChatScreen.tsx's speakReply() --
// see that file. Backend lives at backend/server.js (Express +
// @elevenlabs/elevenlabs-js), a separate Node process, same "doesn't run
// in the RN app" rule as tools/avatar-mocap/.
//
// SECURITY: same rule as api.ts's model API key -- ELEVENLABS_API_KEY
// never touches this app; it lives only in backend/server.js's own env.
// `synthesizeSpeech` below authenticates with a shared-secret Bearer
// token (EXPO_PUBLIC_BACKEND_SECRET, matching the backend's
// BACKEND_SECRET) -- see backend/server.js's requireAuth for why this is
// a real improvement over no check at all, but still not real per-user
// auth (EXPO_PUBLIC_ values are inlined into the client bundle).
//
// STREAMING: backend/server.js streams the raw audio/mpeg bytes back as
// the POST response body (no server-side storage) rather than returning
// a JSON `{ audioUrl }`. expo-audio needs a URI it can load, not a fetch
// Response already in hand, so synthesizeSpeech buffers the response
// here and writes it to a local temp file via expo-file-system, then
// returns that file's URI for playSpeech (unchanged below -- it doesn't
// care whether a URI is remote or local) to load. Note this doesn't
// start playback any sooner than a buffered JSON response would have --
// React Native's fetch doesn't support incrementally reading a streamed
// response body, so the client waits for the full download either way.
// The backend's streaming only avoids holding the clip in ITS memory.
//
// VOICE: `voiceId` defaults to undefined (backend's
// ELEVENLABS_DEFAULT_VOICE_ID takes over) -- pass one explicitly to
// override. Whatever provider/voice you pick should match
// VOICE_DESCRIPTION in constants/appearance.ts (warm, slight Aramaic
// accent in English, natural -- no forced accent -- in the app's other
// launch languages).
//
// NOTE: this used to be built on expo-av. That package is deprecated
// and, as of the Expo Go build matching this project's SDK, no longer
// ships its native module at all -- importing it anywhere in the bundle
// crashed the app immediately ("Cannot find native module 'ExponentAV'"),
// not just when audio actually played. Ported to expo-audio, the
// current supported replacement (JesusAvatar.tsx's video layer was
// ported to expo-video for the same reason, same crash class).

import { createAudioPlayer, setAudioModeAsync, type AudioStatus } from 'expo-audio';
import { File, Paths } from 'expo-file-system';

// Same source as api.ts's API_BASE_URL -- see .env.example. Kept as one
// shared env var rather than two separately-configured values so this
// file can't silently point at a different backend than the rest of the
// app.
const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.jesusinteractive.com';

export async function synthesizeSpeech(
  authToken: string,
  text: string,
  languageCode = 'en',
  voiceId?: string
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/v1/tts/synthesize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ text, languageCode, voiceId }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`TTS request failed (${res.status}): ${body}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const file = new File(Paths.cache, `tts-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`);
  file.create({ overwrite: true });
  file.write(new Uint8Array(arrayBuffer));
  return file.uri;
}

export interface PlaySpeechCallbacks {
  // Wire these to a JesusAvatarHandle ref, e.g.
  // onStart: () => avatarRef.current?.startSpeaking(),
  // onFinish: () => avatarRef.current?.stopSpeaking(),
  // Kept as plain callbacks (not a JesusAvatarHandle import) so this
  // services/ module doesn't depend on components/.
  onStart?: () => void;
  onFinish?: () => void;
}

// Loads and plays a synthesized clip, firing onStart/onFinish around
// playback so the caller can toggle the avatar's speaking state. Returns
// a stop() function to cancel playback early (e.g. user sends a new
// message before the previous reply finished speaking). `finished` guards
// against onFinish firing twice if stop() is called after natural
// completion, or the natural-finish handler races a manual stop().
export async function playSpeech(
  audioUrl: string,
  { onStart, onFinish }: PlaySpeechCallbacks = {}
): Promise<() => Promise<void>> {
  // Without this, playback would be silent on an iPhone with the
  // ring/silent switch flipped -- playsInSilentMode overrides that,
  // 'duckOthers' lowers (rather than fully stops) other audio.
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'duckOthers',
  });

  const player = createAudioPlayer(audioUrl, { updateInterval: 100 });

  let finished = false;
  const safeFinish = () => {
    if (finished) return;
    finished = true;
    onFinish?.();
  };

  onStart?.();
  player.play();

  const subscription = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
    if (status.didJustFinish) {
      safeFinish();
      subscription.remove();
      player.remove();
    }
  });

  return async () => {
    if (finished) return;
    try {
      player.pause();
    } catch {
      // already stopped/removed -- fine to ignore
    }
    subscription.remove();
    player.remove();
    safeFinish();
  };
}

// Actual usage lives in ChatScreen.tsx's speakReply() -- same
// cancel-previous / synthesize / play / catch shape shown here
// historically, now wired to a real, running backend instead of being
// a reference pattern.
