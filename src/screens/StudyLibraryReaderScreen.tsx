import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import Colors from '../theme/colors';
import { useI18n } from '../i18n';
import { useApp } from '../context/AppContext';
import type { StudyToolsStackParamList } from '../navigation/StudyToolsStack';
import { READ_ALOUD_TITLES, jesusVoiceSupportsLanguage } from '../constants/studyLibraryAudio';
import { getReadAloudPages, type ReadAloudPage } from '../services/studyLibraryReader';
import { synthesizeSpeech, playSpeech } from '../services/tts';
import { withAuthRetry } from '../services/backendAuth';
import MagnifyButton from '../components/MagnifyButton';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import PaywallLockScreen from '../components/PaywallLockScreen';

type Props = NativeStackScreenProps<StudyToolsStackParamList, 'StudyLibraryReader'>;

type VoiceState = 'idle' | 'playing';
// 'locked' = Platinum-only, language IS Jesus-voice-supported, user isn't Platinum.
// 'jesus' = Platinum + language supported -> AI Jesus voice.
// 'narration' = any tier, language NOT in the Jesus-voice set -> free on-device voice.
type SpeakerMode = 'locked' | 'jesus' | 'narration';

export default function StudyLibraryReaderScreen({ route, navigation }: Props) {
  const { titleId } = route.params;
  const title = READ_ALOUD_TITLES.find((t) => t.id === titleId);
  const { t, language } = useI18n();
  const { plan, textZoom } = useApp();
  const { hasAccess } = useFeatureAccess();

  const [pages, setPages] = useState<ReadAloudPage[] | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');

  const stopFnRef = useRef<(() => void) | null>(null);
  const cancelledRef = useRef(false);

  const speakerMode: SpeakerMode = jesusVoiceSupportsLanguage(language)
    ? plan === 'platinum'
      ? 'jesus'
      : 'locked'
    : 'narration';

  useEffect(() => {
    if (!title) return;
    setLoading(true);
    setError(null);
    getReadAloudPages(title)
      .then(setPages)
      .catch(() => setError(t.studyLibrary.readerLoadError))
      .finally(() => setLoading(false));
  }, [title, t.studyLibrary.readerLoadError]);

  // Stop any in-flight voice when leaving the screen or switching pages
  // manually -- never let a stale utterance keep talking over a new one.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      stopFnRef.current?.();
      Speech.stop();
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    cancelledRef.current = true;
    stopFnRef.current?.();
    stopFnRef.current = null;
    Speech.stop();
    setVoiceState('idle');
  }, []);

  const speakJesusVoice = useCallback(
    async (text: string) => {
      const audioUrl = await withAuthRetry((token) => synthesizeSpeech(token, text, language));
      if (cancelledRef.current) return;
      const stop = await playSpeech(audioUrl, {
        onFinish: () => {
          if (!cancelledRef.current) setVoiceState('idle');
        },
      });
      stopFnRef.current = () => stop();
    },
    [language]
  );

  const speakNarration = useCallback(
    (text: string) => {
      Speech.speak(text, {
        language,
        onDone: () => {
          if (!cancelledRef.current) setVoiceState('idle');
        },
        onStopped: () => {
          if (!cancelledRef.current) setVoiceState('idle');
        },
      });
      stopFnRef.current = () => Speech.stop();
    },
    [language]
  );

  const handleSpeakerTap = () => {
    if (speakerMode === 'locked') {
      navigation.getParent()?.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Pricing');
      return;
    }
    if (voiceState === 'playing') {
      stopSpeaking();
      return;
    }
    const page = pages?.[pageIndex];
    if (!page) return;
    cancelledRef.current = false;
    setVoiceState('playing');
    const text = page.paragraphs.join(' ');
    const speak = speakerMode === 'jesus' ? speakJesusVoice(text) : Promise.resolve(speakNarration(text));
    speak.catch(() => {
      if (!cancelledRef.current) setVoiceState('idle');
    });
  };

  if (!title) return null;

  // Placed after every hook above (rules of hooks), before this
  // screen's own render. Gates the reader itself, not the shelf/browsing
  // screens ahead of it. Nested StudyToolsStack -> MainTabs -> RootStack --
  // two getParent() hops, same as the existing Platinum-voice-lock
  // navigation just above.
  if (!hasAccess) {
    return (
      <PaywallLockScreen
        featureName={title.title}
        onSubscribe={() => navigation.getParent()?.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Pricing')}
      />
    );
  }

  return (
    <ImageBackground source={require('../../assets/textures/parchment.jpg')} style={styles.container} resizeMode="cover">
      <View style={styles.header}>
        <Text style={styles.bookTitle} numberOfLines={1}>{title.title}</Text>
        <Text style={styles.bookAuthor}>{title.author}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.royal} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView style={styles.reader} contentContainerStyle={{ padding: 20 }}>
          <View style={{ transform: [{ scale: textZoom }] }}>
            {pages?.[pageIndex]?.paragraphs.map((p, i) => (
              <Text key={i} style={styles.paragraph}>{p}</Text>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.pageBtn}
          disabled={pageIndex === 0}
          onPress={() => setPageIndex((p) => Math.max(0, p - 1))}
        >
          <Ionicons name="chevron-back" size={20} color={pageIndex === 0 ? '#CBD5E0' : Colors.royal} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.speakerBtn} onPress={handleSpeakerTap}>
          <Ionicons
            name={speakerMode === 'locked' ? 'lock-closed' : voiceState === 'playing' ? 'volume-high' : 'volume-medium-outline'}
            size={20}
            color={speakerMode === 'jesus' ? Colors.gold : speakerMode === 'narration' ? Colors.ink : '#8A6A16'}
          />
          <Text style={styles.speakerLabel}>
            {speakerMode === 'locked' ? t.studyLibrary.speakerLockedLabel : speakerMode === 'jesus' ? '' : t.studyLibrary.narrationLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pageBtn}
          disabled={!pages || pageIndex >= pages.length - 1}
          onPress={() => setPageIndex((p) => Math.min((pages?.length ?? 1) - 1, p + 1))}
        >
          <Ionicons name="chevron-forward" size={20} color={!pages || pageIndex >= pages.length - 1 ? '#CBD5E0' : Colors.royal} />
        </TouchableOpacity>
      </View>

      <Text style={styles.disclosure}>{t.studyLibrary.jesusVoiceDisclosure}</Text>

      {/* Floating overlay, same positioning convention as every other
          screen that uses this control (Scripture, Chat) -- it's
          absolutely positioned by default, not meant to sit inline in a
          toolbar. Raised above the footer bar so it doesn't overlap it. */}
      <MagnifyButton style={{ bottom: 90 }} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFE7D6' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(11,42,109,0.1)' },
  bookTitle: { fontSize: 17, fontWeight: '800', color: Colors.royal },
  bookAuthor: { fontSize: 12.5, color: Colors.royal, opacity: 0.6, marginTop: 2 },
  reader: { flex: 1 },
  paragraph: { fontSize: 17, lineHeight: 27, color: Colors.ink, marginBottom: 16 },
  errorBox: { padding: 24, alignItems: 'center' },
  errorText: { color: Colors.royal, fontSize: 14, textAlign: 'center' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,42,109,0.1)',
    backgroundColor: '#fff',
  },
  pageBtn: { padding: 8 },
  speakerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  speakerLabel: { fontSize: 11, fontWeight: '700', color: Colors.ink, opacity: 0.7 },
  disclosure: { fontSize: 10.5, color: Colors.royal, opacity: 0.55, textAlign: 'center', paddingBottom: 10, paddingHorizontal: 20 },
});
