import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import Colors from '../theme/colors';
import { useI18n } from '../i18n';
import { LANGUAGES, languageDisplayName } from '../i18n/languages';
import type { LanguageCode } from '../types';
import LanguagePicker from '../components/LanguagePicker';
import { withAuthRetry } from '../services/backendAuth';
import { transcribeSpeech } from '../services/stt';
import { translateText } from '../services/translateApi';
import { synthesizeSpeech, playSpeech } from '../services/tts';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import PaywallLockScreen from '../components/PaywallLockScreen';
import { logEvent } from '../services/analytics';
import type { RootStackParamList } from '../navigation/RootNavigator';

// Two stacked panes, both right-side-up -- "theirs" on top, "mine" on
// the bottom (within thumb's reach for whoever is holding the phone).
// An earlier version rotated the top pane 180 degrees for a face-to-
// face-across-a-table layout; dropped for a plain, unconfusing normal
// orientation instead. Either side can tap its own mic -- a real gospel
// conversation is back-and-forth, not a one-way broadcast, so this
// doesn't lock who's allowed to speak.
//
// Flow per utterance: record -> POST /v1/stt/transcribe (whatever
// language was actually spoken, auto-detected) -> show that text on the
// speaker's own pane -> POST /v1/translate into the OTHER pane's
// language -> show it there, and (if "Speak replies" is on) read it
// aloud too, since a mission-field listener may not be literate in
// their own written language even if they understand it spoken.
type Side = 'mine' | 'theirs';

type Props = NativeStackScreenProps<RootStackParamList, 'GospelTranslator'>;

export default function GospelTranslatorScreen({ route, navigation }: Props) {
  const { language: appLanguage } = useI18n();
  const { hasAccess } = useFeatureAccess();
  // Set once, on mount only -- ScriptureSearchScreen/SermonWriterScreen
  // hand this off via navigation params (see RootNavigator.tsx's own
  // comment), not a live prop this screen re-reads on every render.
  const initialTextRef = useRef(route.params?.initialText);
  const initialLabelRef = useRef(route.params?.initialLabel);

  const [myLang, setMyLang] = useState<LanguageCode>(appLanguage);
  const [theirLang, setTheirLang] = useState<LanguageCode>(appLanguage === 'es' ? 'en' : 'es');
  const [myText, setMyText] = useState(initialTextRef.current ?? '');
  const [theirText, setTheirText] = useState('');
  const [myDraft, setMyDraft] = useState('');
  const [theirDraft, setTheirDraft] = useState('');
  const [recordingSide, setRecordingSide] = useState<Side | null>(null);
  const [processingSide, setProcessingSide] = useState<Side | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [pickerFor, setPickerFor] = useState<Side | null>(null);
  const [sourceLabel, setSourceLabel] = useState(initialLabelRef.current ?? null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const stopSpeechRef = useRef<null | (() => Promise<void>)>(null);

  const busy = recordingSide !== null || processingSide !== null;

  const speakTranslation = async (text: string, languageCode: LanguageCode) => {
    if (!autoSpeak) return;
    try {
      await stopSpeechRef.current?.();
      const uri = await withAuthRetry((token) => synthesizeSpeech(token, text, languageCode));
      stopSpeechRef.current = await playSpeech(uri);
    } catch {
      // Silent -- the translation is already visible as text either
      // way; losing the audio isn't worth interrupting the conversation
      // with an error dialog over.
    }
  };

  const runTranslation = async (side: Side, spokenText: string) => {
    const sourceLang = side === 'mine' ? myLang : theirLang;
    const targetLang = side === 'mine' ? theirLang : myLang;
    if (side === 'mine') setMyText(spokenText);
    else setTheirText(spokenText);

    setProcessingSide(side);
    try {
      const translated = await withAuthRetry((token) =>
        translateText(token, spokenText, languageDisplayName(sourceLang) ?? sourceLang, languageDisplayName(targetLang) ?? targetLang)
      );
      if (side === 'mine') setTheirText(translated);
      else setMyText(translated);
      await speakTranslation(translated, targetLang);
    } catch (err) {
      console.error('Translation failed:', err);
      Alert.alert('Translation failed', 'Please check your connection and try again.');
    } finally {
      setProcessingSide(null);
    }
  };

  // Runs once, only when this screen was opened carrying a passage/
  // sermon (see the Props/initialTextRef comment above) -- translates
  // it into theirLang immediately so the listener's pane is ready
  // before the pastor even starts reading aloud. Deliberately calls
  // runTranslation('mine', ...) rather than duplicating its logic: same
  // path a spoken/typed utterance takes, just pre-seeded instead of
  // waiting on the mic.
  useEffect(() => {
    if (initialTextRef.current) {
      runTranslation('mine', initialTextRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasAccess) logEvent('feature_used', { feature: 'translator' });
  }, [hasAccess]);

  // Placed after every hook above (rules of hooks). A root-level modal
  // registered directly on RootStack -- zero getParent() hops needed.
  if (!hasAccess) {
    return <PaywallLockScreen featureName="Gospel Translator" onSubscribe={() => navigation.navigate('Pricing')} />;
  }

  const startRecording = async (side: Side) => {
    if (busy) return;
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Microphone access needed', 'Enable microphone access in Settings to speak into the translator.');
        return;
      }
      await stopSpeechRef.current?.();
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setRecordingSide(side);
    } catch (e) {
      console.error('Failed to start recording:', e);
      Alert.alert('Could not start recording', 'Please try again.');
    }
  };

  const stopRecording = async () => {
    const side = recordingSide;
    if (!side) return;
    setRecordingSide(null);
    try {
      await audioRecorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });
      const uri = audioRecorder.uri;
      if (!uri) {
        Alert.alert('Recording failed', 'Please try again.');
        return;
      }
      setProcessingSide(side);
      const text = await withAuthRetry((token) => transcribeSpeech(token, uri));
      setProcessingSide(null);
      if (!text) {
        Alert.alert("Didn't catch that", 'Please try speaking again.');
        return;
      }
      await runTranslation(side, text);
    } catch (e) {
      setProcessingSide(null);
      console.error('Recording/transcription failed:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    }
  };

  const submitTyped = async (side: Side) => {
    const draft = side === 'mine' ? myDraft.trim() : theirDraft.trim();
    if (!draft || busy) return;
    if (side === 'mine') setMyDraft('');
    else setTheirDraft('');
    await runTranslation(side, draft);
  };

  const swapLanguages = () => {
    setMyLang(theirLang);
    setTheirLang(myLang);
    setMyText(theirText);
    setTheirText(myText);
  };

  const renderPane = (side: Side) => {
    const lang = side === 'mine' ? myLang : theirLang;
    const text = side === 'mine' ? myText : theirText;
    const draft = side === 'mine' ? myDraft : theirDraft;
    const setDraft = side === 'mine' ? setMyDraft : setTheirDraft;
    const option = LANGUAGES.find((l) => l.code === lang);
    const isRecording = recordingSide === side;
    const isProcessing = processingSide === side;

    return (
      <View style={styles.pane}>
        <TouchableOpacity
          style={styles.langButton}
          onPress={() => setPickerFor(side)}
          accessibilityRole="button"
          accessibilityLabel={`Change ${side === 'mine' ? 'my' : 'their'} language`}
        >
          <Ionicons name="chevron-down" size={14} color={Colors.gold} />
          <Text style={styles.langButtonText}>{option?.nativeLabel ?? lang}</Text>
        </TouchableOpacity>
        {side === 'mine' && sourceLabel && <Text style={styles.sourceLabel}>{sourceLabel}</Text>}

        <View style={styles.textArea}>
          {isProcessing && !text ? (
            <ActivityIndicator color={Colors.gold} />
          ) : (
            <Text style={styles.paneText}>{text || (side === 'mine' ? 'Tap the mic and speak...' : 'Waiting...')}</Text>
          )}
        </View>

        <View style={styles.paneFooter}>
          <TextInput
            style={styles.typeInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="Or type here..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            onSubmitEditing={() => submitTyped(side)}
            editable={!busy}
          />
          <TouchableOpacity
            onPress={() => submitTyped(side)}
            disabled={busy || !draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send typed text"
            hitSlop={8}
          >
            <Ionicons name="send" size={18} color={draft.trim() && !busy ? Colors.gold : 'rgba(255,255,255,0.3)'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.micButton, isRecording && styles.micButtonActive]}
            onPress={() => (isRecording ? stopRecording() : startRecording(side))}
            disabled={busy && !isRecording}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>{renderPane('theirs')}</View>

      <View style={styles.centerBar}>
        <TouchableOpacity onPress={swapLanguages} accessibilityRole="button" accessibilityLabel="Swap languages" hitSlop={8}>
          <Ionicons name="swap-vertical" size={20} color={Colors.gold} />
        </TouchableOpacity>
        <Text style={styles.centerBarLabel}>Gospel Translator</Text>
        <TouchableOpacity
          onPress={() => setAutoSpeak((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={autoSpeak ? 'Disable spoken replies' : 'Enable spoken replies'}
          hitSlop={8}
        >
          <Ionicons name={autoSpeak ? 'volume-high' : 'volume-mute'} size={20} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      {renderPane('mine')}

      <Modal visible={pickerFor !== null} transparent animationType="fade" onRequestClose={() => setPickerFor(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPickerFor(null)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{pickerFor === 'mine' ? 'My language' : 'Their language'}</Text>
            <LanguagePicker
              selected={pickerFor === 'mine' ? myLang : theirLang}
              onSelect={(code) => {
                if (pickerFor === 'mine') setMyLang(code);
                else setTheirLang(code);
                setPickerFor(null);
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.royal },
  pane: { flex: 1, padding: 16, justifyContent: 'space-between' },
  langButton: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center' },
  langButtonText: { color: Colors.gold, fontWeight: '700', fontSize: 13 },
  sourceLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', marginTop: 2 },
  textArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  paneText: { color: Colors.white, fontSize: 22, fontWeight: '600', textAlign: 'center', lineHeight: 30 },
  paneFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeInput: {
    flex: 1,
    color: Colors.white,
    fontSize: 13,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: { backgroundColor: Colors.danger },
  centerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  centerBarLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.royal,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingBottom: 32,
    height: 560,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.ivory, marginBottom: 10, paddingHorizontal: 20 },
});
