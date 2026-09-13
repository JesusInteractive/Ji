// Replaces RadioContext.tsx entirely -- that one existed to keep a
// react-native-webview WebView alive across tab switches (the old
// station-picker linked out to K-LOVE's/Air1's own web players). Now
// that "24/7 Global Praise and Worship" is this app's own radio.co
// stream, playback is a real expo-audio AudioPlayer instance instead --
// same library already proven elsewhere in this app for TTS (see
// services/tts.ts) -- reused here rather than adding a new audio
// library like react-native-track-player.
//
// One player instance lives for the app's session, created lazily on
// first play() and never torn down on pause (pause just calls
// player.pause(), keeping the same instance/buffer ready for an instant
// resume) -- mounted once in MainTabs.tsx via RadioOverlay, the same
// "rendered once, survives tab switches" placement RadioContext used.
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from 'expo-audio';
import { fetchRadioConfig } from '../services/radioApi';
import { FALLBACK_STATION_NAME } from '../constants/radioStations';

interface LiveRadioPlaybackContextValue {
  isPlaying: boolean;
  isBuffering: boolean;
  stationName: string | null;
  // Current-track display -- until the radio.co Now Playing metadata
  // integration lands (pending the station being fully set up), there's
  // no real per-song feed to poll, so this falls back to the station
  // name/a generic subtitle. Kept as its own field (not just re-reading
  // stationName) so swapping in real metadata later only touches the
  // one place it's set below, not every screen that reads it.
  trackTitle: string | null;
  trackArtist: string | null;
  volume: number;
  setVolume: (v: number) => void;
  play: () => Promise<void>;
  pause: () => void;
}

const LiveRadioPlaybackContext = createContext<LiveRadioPlaybackContextValue | null>(null);

export function LiveRadioPlaybackProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [stationName, setStationName] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(1);
  const playerRef = useRef<AudioPlayer | null>(null);

  const play = useCallback(async () => {
    if (playerRef.current) {
      playerRef.current.play();
      setIsPlaying(true);
      return;
    }
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      // Unlike TTS replies (short, foreground-only), a radio stream is
      // meant to keep playing while the user browses other tabs -- the
      // direct replacement for what the old WebView-persistence used to
      // guarantee.
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    });

    let streamUrl: string;
    let name: string = FALLBACK_STATION_NAME;
    try {
      const config = await fetchRadioConfig();
      streamUrl = config.streamUrl;
      name = config.stationName;
    } catch {
      // Backend unreachable or radio_config not seeded yet. There's no
      // fallback stream (see radioStations.ts), so say so rather than
      // start a player that would silently play nothing.
      Alert.alert('Radio is offline', 'The live station isn’t available right now. Please try again in a little while.');
      setIsPlaying(false);
      return;
    }
    setStationName(name);

    const player = createAudioPlayer(streamUrl, { updateInterval: 500 });
    player.volume = volume;
    playerRef.current = player;
    player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
      setIsPlaying(status.playing);
      setIsBuffering(status.isBuffering);
    });
    player.play();
    setIsPlaying(true);
  }, [volume]);

  const pause = useCallback(() => {
    playerRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(Math.max(v, 0), 1);
    setVolumeState(clamped);
    if (playerRef.current) playerRef.current.volume = clamped;
  }, []);

  const value = useMemo<LiveRadioPlaybackContextValue>(
    () => ({
      isPlaying,
      isBuffering,
      stationName,
      trackTitle: stationName,
      trackArtist: isPlaying ? 'Live' : null,
      volume,
      setVolume,
      play,
      pause,
    }),
    [isPlaying, isBuffering, stationName, volume, setVolume, play, pause]
  );

  return <LiveRadioPlaybackContext.Provider value={value}>{children}</LiveRadioPlaybackContext.Provider>;
}

export function useLiveRadioPlayback(): LiveRadioPlaybackContextValue {
  const ctx = useContext(LiveRadioPlaybackContext);
  if (!ctx) throw new Error('useLiveRadioPlayback must be used within a LiveRadioPlaybackProvider');
  return ctx;
}
