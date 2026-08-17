import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import Colors from '../theme/colors';
import JesusAvatar, { type JesusAvatarHandle } from './JesusAvatar';
import { synthesizeSpeech, playSpeech } from '../services/tts';
import { BACKEND_AUTH_TOKEN } from '../services/backendAuth';
import { MUSIC_LEVEL_VOLUME, type MusicLevel } from '../services/musicLevel';
import { playFadedWindCue } from '../services/audioFade';

interface Props {
  verseReference: string;
  verseText: string;
  greetingText?: string;
  languageCode?: string;
}

export interface GlorySplashHandle {
  replay: () => void;
  setMusicLevel: (level: MusicLevel) => void;
}

const DEFAULT_GREETING = "Peace be with you. I've been waiting for you to arrive.";

// "Jesus appears in a sheer glory cloud" (spec section 4) -- the real
// motion version. Used on the onboarding Entrance screen, before login/
// pricing, so this is every user's first look at him. Mirrors
// ChatScreen.tsx's entrance sequence (cloud -> avatar, wind sound,
// looping ambient bed) but adds a spoken greeting once he's fully in
// view, and exposes replay()/setMusicLevel() via ref so EntranceScreen's
// refresh button and music toggle can drive it from outside.
const GlorySplash = forwardRef<GlorySplashHandle, Props>(function GlorySplash(
  { verseReference, verseText, greetingText = DEFAULT_GREETING, languageCode = 'en' },
  ref
) {
  const cloudScale = useRef(new Animated.Value(0.6)).current;
  const cloudOpacity = useRef(new Animated.Value(0)).current;
  const figureOpacity = useRef(new Animated.Value(0)).current;
  const figureTranslateY = useRef(new Animated.Value(24)).current;
  const verseOpacity = useRef(new Animated.Value(0)).current;

  const avatarRef = useRef<JesusAvatarHandle>(null);
  const ambientPlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const currentStopRef = useRef<(() => Promise<void>) | null>(null);
  const musicLevelRef = useRef<MusicLevel>('full');

  const playEntrance = () => {
    cloudOpacity.setValue(0);
    cloudScale.setValue(0.6);
    figureOpacity.setValue(0);
    figureTranslateY.setValue(24);
    verseOpacity.setValue(0);

    playEntranceSound();

    // Slowed down on request -- should feel calm and intentional, not
    // hurried. Roughly double the original per-stage durations. No
    // separate door/window shape (removed on request) -- he appears
    // directly in the glory cloud.
    Animated.sequence([
      Animated.parallel([
        Animated.timing(cloudOpacity, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(cloudScale, { toValue: 1, duration: 2800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(figureOpacity, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(figureTranslateY, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
      Animated.timing(verseOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]).start(() => {
      speakGreeting();
    });
  };

  useEffect(() => {
    playEntrance();
    startAmbientMusic();

    return () => {
      ambientPlayerRef.current?.remove();
      ambientPlayerRef.current = null;
      currentStopRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    replay: () => {
      currentStopRef.current?.();
      playEntrance();
    },
    setMusicLevel: (level: MusicLevel) => {
      musicLevelRef.current = level;
      if (!ambientPlayerRef.current) return;
      if (level === 'off') {
        ambientPlayerRef.current.pause();
      } else {
        ambientPlayerRef.current.volume = MUSIC_LEVEL_VOLUME[level];
        ambientPlayerRef.current.play();
      }
    },
  }));

  async function playEntranceSound() {
    try {
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
      const wind = createAudioPlayer(require('../../assets/sounds/entrance-wind.mp3'));
      // Fades in AND out, then stops -- see ChatScreen.tsx's
      // playWindSound / audioFade.ts's own comments for why.
      playFadedWindCue(wind, 0.14);
    } catch (e) {
      // Missing/failed audio should never block the visual entrance.
      console.error('Entrance sound error:', e);
    }
  }

  async function startAmbientMusic() {
    try {
      const ambient = createAudioPlayer(require('../../assets/sounds/ambient-peaceful.mp3'));
      ambient.loop = true;
      ambient.volume = MUSIC_LEVEL_VOLUME[musicLevelRef.current];
      if (musicLevelRef.current !== 'off') ambient.play();
      ambientPlayerRef.current = ambient;
    } catch (e) {
      console.error('Ambient music error:', e);
    }
  }

  // Speaks the greeting once he's fully in view, driving the same
  // startSpeaking()/stopSpeaking() lip-sync state ChatScreen uses. Safe
  // to call with no TTS backend configured -- synthesizeSpeech rejects,
  // the catch below just stops the avatar and logs it; the visual
  // entrance and verse text are unaffected either way.
  async function speakGreeting() {
    try {
      const audioUrl = await synthesizeSpeech(BACKEND_AUTH_TOKEN, greetingText, languageCode);
      currentStopRef.current = await playSpeech(audioUrl, {
        onStart: () => {
          avatarRef.current?.startSpeaking();
          // Paused outright, not ducked -- see ChatScreen.tsx's
          // speakReply for why a volume ratio alone wasn't enough.
          if (ambientPlayerRef.current) ambientPlayerRef.current.pause();
        },
        onFinish: () => {
          avatarRef.current?.stopSpeaking();
          if (ambientPlayerRef.current && musicLevelRef.current !== 'off') {
            ambientPlayerRef.current.volume = MUSIC_LEVEL_VOLUME[musicLevelRef.current];
            ambientPlayerRef.current.play();
          }
          currentStopRef.current = null;
        },
      });
    } catch (e) {
      console.error('Greeting speech error:', e);
      avatarRef.current?.stopSpeaking();
    }
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.cloud, { opacity: cloudOpacity, transform: [{ scale: cloudScale }] }]}
        // See JesusAvatar.tsx's drifting-cloud-veil comment -- avoids a
        // known Android flicker/redraw issue for LinearGradient content
        // riding a native-driver opacity/scale transform.
        renderToHardwareTextureAndroid
        needsOffscreenAlphaCompositing
      >
        <LinearGradient
          colors={[Colors.glory, 'rgba(255,243,196,0.15)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={{ opacity: figureOpacity, transform: [{ translateY: figureTranslateY }] }}
      >
        <JesusAvatar ref={avatarRef} mood="warm" size={190} shape="portrait" />
      </Animated.View>

      <Animated.View style={[styles.verseWrap, { opacity: verseOpacity }]}>
        <Text style={styles.verseText}>"{verseText}"</Text>
        <Text style={styles.verseRef}>{verseReference}</Text>
      </Animated.View>
    </View>
  );
});

export default GlorySplash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.royal,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cloud: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  verseWrap: {
    marginTop: 32,
    alignItems: 'center',
    maxWidth: 320,
  },
  verseText: {
    color: Colors.ivory,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  verseRef: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    letterSpacing: 0.5,
  },
});
