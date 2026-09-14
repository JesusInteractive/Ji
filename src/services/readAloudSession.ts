// The engine behind the Study Library's in-place reading: pick a book off
// the shelf and it starts reading right there, without leaving the room
// (StudyLibraryShelvesScreen.tsx's opened volume drives one of these).
//
// The book is read one passage at a time rather than a whole page at
// once: a passage is a paragraph or two (long paragraphs are split on
// sentence boundaries -- see services/readAloudText.ts, which also decides
// where the book itself starts), so "read that again" replays something
// short, the passage on screen matches what's being heard, and each
// Jesus-voice clip comes back from ElevenLabs quickly. The next passage is
// synthesized while the current one plays, so there's no gap between them
// -- and at one request per passage this stays well under the backend's
// 15-per-minute TTS limit (backend/server.js's ttsLimiter).
//
// Two readers, both ElevenLabs voices: Jesus AI, or the Scholar
// (constants/studyLibraryAudio.ts's voiceFor decides per book). The books
// are English, so they're always voiced in English, whatever language the
// app itself is set to. There's deliberately no fallback voice: if the
// voice can't be reached the reading stops and says so, rather than
// switching readers partway through a book.
//
// Progress is saved per book (the page the current passage is on), so
// putting a book back and taking it down again picks up where it left off.

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import { SCHOLAR_FALLBACK_VOICE_ID, type LibraryVoice, type ReadAloudTitle } from '../constants/studyLibraryAudio';
import { getReadAloudPages } from './studyLibraryReader';
import { buildPassages, type Passage } from './readAloudText';
import { synthesizeSpeech } from './tts';
import { withAuthRetry } from './backendAuth';

export type ReadAloudStatus = 'loading' | 'reading' | 'paused' | 'finished' | 'error';

export interface ReadAloudSnapshot {
  status: ReadAloudStatus;
  passage: string;
  pageIndex: number;
  pageCount: number;
  slow: boolean;
}

const PROGRESS_PREFIX = 'ji_read_aloud_progress_';
const SLOW_RATE = 0.8;
// "Read that again" pressed this soon after a passage starts means the
// passage before it -- the one the listener actually just heard.
const REPLAY_PREVIOUS_WINDOW_MS = 2500;
const ROOM_TONE_VOLUME = 0.16;
const RATE_LIMIT_RETRY_MS = 6000;

async function loadSavedPage(titleId: string): Promise<number> {
  try {
    const saved = await AsyncStorage.getItem(PROGRESS_PREFIX + titleId);
    return saved ? Number(saved) || 0 : 0;
  } catch {
    return 0;
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function synthesize(text: string, voice: LibraryVoice): Promise<string> {
  const voiceId = voice === 'scholar' ? SCHOLAR_FALLBACK_VOICE_ID : undefined;
  const request = () => withAuthRetry((token) => synthesizeSpeech(token, text, 'en', voiceId, voice));
  try {
    return await request();
  } catch (error) {
    // The TTS rate limit resets every minute -- one patient retry
    // instead of stopping the book mid-chapter.
    if (!String(error).includes('(429)')) throw error;
    await wait(RATE_LIMIT_RETRY_MS);
    return request();
  }
}

export class ReadAloudSession {
  private passages: Passage[] = [];
  private pageCount = 0;
  private index = 0;
  private status: ReadAloudStatus = 'loading';
  private slow = false;
  // Bumped on every jump/stop; async work started under an older run
  // checks it and drops itself, so a stale clip never talks over a new one.
  private run = 0;
  private player: AudioPlayer | null = null;
  private playerSubscription: { remove: () => void } | null = null;
  private startedAt = 0;
  private audio = new Map<number, Promise<string>>();
  private roomTone: AudioPlayer | null = null;
  private destroyed = false;

  constructor(
    private readonly title: ReadAloudTitle,
    private readonly voice: LibraryVoice,
    private readonly onChange: (snapshot: ReadAloudSnapshot) => void
  ) {}

  async start() {
    this.emit();
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });
      this.startRoomTone();
      const pages = await getReadAloudPages(this.title);
      if (this.destroyed) return;
      this.passages = buildPassages(pages, this.title.startsAt);
      this.pageCount = pages.length;
      const savedPage = await loadSavedPage(this.title.id);
      if (this.destroyed) return;
      const resumeAt = this.passages.findIndex((p) => p.page >= savedPage);
      this.index = resumeAt > 0 ? resumeAt : 0;
      // Paused while the book was still loading -- wait for resume().
      if (this.status === 'paused') {
        this.emit();
        return;
      }
      this.playFrom(this.index);
    } catch {
      if (!this.destroyed) this.setStatus('error');
    }
  }

  // The page the listener is on, for "Read along" to open the text there.
  get currentPage(): number {
    return this.passages[Math.min(this.index, this.passages.length - 1)]?.page ?? 0;
  }

  pause() {
    if (this.status !== 'reading' && this.status !== 'loading') return;
    if (this.player) {
      this.player.pause();
    } else {
      // Still waiting on a clip: drop it and start the passage on resume.
      this.run++;
    }
    this.setStatus('paused');
  }

  resume() {
    if (this.status !== 'paused') return;
    if (this.passages.length === 0) {
      // Still loading -- start() picks it up from here.
      this.setStatus('loading');
      return;
    }
    if (this.player) {
      this.player.play();
      this.player.setPlaybackRate(this.rate);
      this.setStatus('reading');
    } else {
      this.playFrom(this.index);
    }
  }

  toggleSlow() {
    this.slow = !this.slow;
    this.player?.setPlaybackRate(this.rate);
    this.emit();
  }

  readAgain() {
    if (this.passages.length === 0) return;
    const justStarted = Date.now() - this.startedAt < REPLAY_PREVIOUS_WINDOW_MS;
    const target = justStarted && this.index > 0 ? this.index - 1 : this.index;
    this.playFrom(Math.min(target, this.passages.length - 1));
  }

  retry() {
    if (this.passages.length === 0) {
      this.status = 'loading';
      this.start();
    } else {
      this.playFrom(this.index);
    }
  }

  destroy() {
    this.destroyed = true;
    this.run++;
    this.releasePlayer();
    try {
      this.roomTone?.pause();
      this.roomTone?.remove();
    } catch {
      // already released
    }
    this.roomTone = null;
    for (const index of [...this.audio.keys()]) this.forget(index);
  }

  private get rate() {
    return this.slow ? SLOW_RATE : 1;
  }

  private async playFrom(index: number) {
    const run = ++this.run;
    this.releasePlayer();
    this.index = index;

    if (index >= this.passages.length) {
      this.setStatus('finished');
      AsyncStorage.removeItem(PROGRESS_PREFIX + this.title.id).catch(() => {});
      return;
    }

    const passage = this.passages[index];
    AsyncStorage.setItem(PROGRESS_PREFIX + this.title.id, String(passage.page)).catch(() => {});
    // The first passage keeps "Opening the book..." up until the voice
    // actually starts; after that the passage text changes immediately.
    if (this.status !== 'loading') this.setStatus('reading');
    else this.emit();

    try {
      const uri = await this.audioFor(index);
      if (run !== this.run) return;
      this.audioFor(index + 1).catch(() => {});

      const player = createAudioPlayer(uri, { updateInterval: 250 });
      player.shouldCorrectPitch = true;
      this.playerSubscription = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        if (status.didJustFinish && run === this.run) {
          // Keep the clip just heard (for "read that again"); drop the one before it.
          this.forget(index - 1);
          this.playFrom(index + 1);
        }
      });
      this.player = player;
      this.startedAt = Date.now();
      player.play();
      player.setPlaybackRate(this.rate);
      this.setStatus('reading');
    } catch (error) {
      if (__DEV__) console.warn('[ReadAloud] passage failed:', String(error));
      if (run === this.run) this.setStatus('error');
    }
  }

  private audioFor(index: number): Promise<string> {
    if (index < 0 || index >= this.passages.length) return Promise.resolve('');
    let pending = this.audio.get(index);
    if (!pending) {
      pending = synthesize(this.passages[index].text, this.voice);
      // A failed clip is forgotten so the next attempt asks again.
      pending.catch(() => this.audio.delete(index));
      this.audio.set(index, pending);
    }
    return pending;
  }

  // Clips are temp files in the cache directory -- delete each one once
  // it can't be replayed anymore, so reading a whole book doesn't pile
  // up hundreds of MP3s.
  private forget(index: number) {
    const pending = this.audio.get(index);
    if (!pending) return;
    this.audio.delete(index);
    pending
      .then((uri) => {
        if (uri) new File(uri).delete();
      })
      .catch(() => {});
  }

  private releasePlayer() {
    this.playerSubscription?.remove();
    this.playerSubscription = null;
    if (this.player) {
      try {
        this.player.pause();
        this.player.remove();
      } catch {
        // already released
      }
    }
    this.player = null;
  }

  private startRoomTone() {
    try {
      const tone = createAudioPlayer(require('../../assets/sounds/room-tone.m4a'));
      tone.loop = true;
      tone.volume = ROOM_TONE_VOLUME;
      tone.play();
      this.roomTone = tone;
    } catch {
      // Room tone is atmosphere, never a reason to stop the reading.
    }
  }

  private setStatus(status: ReadAloudStatus) {
    this.status = status;
    this.emit();
  }

  private emit() {
    if (this.destroyed) return;
    const passage = this.passages[Math.min(this.index, this.passages.length - 1)];
    this.onChange({
      status: this.status,
      passage: passage?.text ?? '',
      pageIndex: passage?.page ?? 0,
      pageCount: this.pageCount,
      slow: this.slow,
    });
  }
}
