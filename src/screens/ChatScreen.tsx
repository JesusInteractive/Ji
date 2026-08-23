import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  createAudioPlayer,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import * as Localization from 'expo-localization';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import ChatBubble from '../components/ChatBubble';
import TipBanner from '../components/TipBanner';
import JesusAvatar, { type JesusAvatarHandle } from '../components/JesusAvatar';
import MagnifyButton from '../components/MagnifyButton';
import DraggableScrollbar from '../components/DraggableScrollbar';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { getSafetyReply, buildJesusMessage, maybeBridgeReminder, PEACEFUL_FAREWELL_TEXT } from '../services/demoReplyEngine';
import { sendMessage } from '../services/api';
import { canSendNow } from '../services/cache';
import { track } from '../services/analytics';
import { synthesizeSpeech, playSpeech } from '../services/tts';
import { transcribeSpeech } from '../services/stt';
import { withAuthRetry } from '../services/backendAuth';
import { playFadedWindCue } from '../services/audioFade';
import type { ChatMessage, JesusMood } from '../types';
import type { ChatStackParamList } from '../navigation/ChatStack';


export default function ChatScreen() {
  const { t, language } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<ChatStackParamList>>();
  const {
    plan,
    messages,
    addMessage,
    remainingQuestionsToday,
    setRemainingQuestionsToday,
    tokenBalance,
    spendToken,
    addFavorite,
    ageAppropriateMode,
    clearMessages,
    textZoom,
  } = useApp();
  const [input, setInput] = useState('');
  const [sendError, setSendError] = useState<{ text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  // Tracks whether Jesus's TTS reply is actively playing through the
  // device speaker -- used to keep the mic disabled while he's talking.
  // Without this, recording during playback picks up his own voice
  // through the open speaker/mic (there's no headset here to isolate
  // them) and re-transcribes it as if it were a new question, which
  // then gets sent as one -- a real feedback loop, not just noise.
  const [jesusSpeaking, setJesusSpeaking] = useState(false);
  // isMeteringEnabled + useAudioRecorderState's polling below is what
  // makes auto-stop-on-silence possible -- metering (a live dB level)
  // only lives on the polled RecorderState, not on the leaner
  // recordingStatusUpdate event.
  const audioRecorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(audioRecorder, 200);
  const listRef = useRef<FlatList>(null);
  // Shows a "scroll to bottom" button once the user has scrolled up away
  // from the newest messages -- without this there was no way back down
  // except manually dragging, easy to miss once the history gets long.
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  // Drives the DraggableScrollbar thumb -- plain state (re-rendered every
  // scroll tick) rather than a ref, since the thumb's size/position need
  // to actually re-render as these change.
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const avatarRef = useRef<JesusAvatarHandle>(null);
  const currentStopRef = useRef<(() => Promise<void>) | null>(null);
  // "Conversation mode": once a question was asked by voice, keep
  // listening automatically after each reply instead of requiring
  // another mic tap for every follow-up. Only kicks in when the LAST
  // question came in by voice -- typing a follow-up sets this back to
  // false, so the mic doesn't surprise-activate on someone who's typing.
  const lastInputWasVoiceRef = useRef(false);
  // Distinguishes a conversation-mode auto-restart from a deliberate mic
  // tap, so "didn't catch that" doesn't pop up as an intrusive alert
  // every time a conversation naturally winds down into silence -- an
  // auto-started recording that hears nothing just quietly stops
  // listening instead of nagging about it.
  const autoRelistenRef = useRef(false);
  // Giving up on conversation mode after just one quiet auto-relisten
  // attempt was too eager -- a real pause to think of a follow-up
  // question easily exceeds the silence timeout. Retry a couple more
  // times before actually ending the loop; reset to 0 on any real catch.
  const emptyAutoRelistenCountRef = useRef(0);
  const MAX_EMPTY_AUTO_RELISTENS = 2;
  const conversationIdRef = useRef(`conv-${Date.now()}`);

  const limitReached = remainingQuestionsToday <= 0 && tokenBalance <= 0;
  const lastJesusMessage = [...messages].reverse().find((m) => m.author === 'jesus');
  // Defaults to 'warm' rather than 'neutral' so the very first thing the
  // user sees (before any reply exists) is the smiling portrait, per "he
  // should smile softly on greeting" -- see JesusAvatar.tsx's
  // MOOD_PORTRAIT for which mood maps to which image.
  const lastJesusMood: JesusMood = lastJesusMessage?.mood ?? 'warm';

  // Entrance: "coming through a sheer door and glory cloud" (Matthew
  // 7:7 -- ask, seek, knock, and it is opened), echoing GlorySplash.tsx's
  // onboarding entrance but scoped to just the avatar stage rather than
  // a full-screen takeover. Sequenced door-glow -> cloud-glow -> avatar
  // fade-in, once per screen mount (empty deps below) -- it does not
  // re-run on mood changes or re-renders, which is what keeps Jesus
  // "completely stable, no flickering" afterward.
  const cloudOpacity = useRef(new Animated.Value(0)).current;
  const cloudScale = useRef(new Animated.Value(0.7)).current;
  const entranceOpacity = useRef(new Animated.Value(0)).current;
  const entranceScale = useRef(new Animated.Value(0.92)).current;

  // Runs the cloud -> avatar sequence + wind sound. Called once on mount
  // (below) and again on demand from the refresh button in the top bar
  // -- resets every value to its starting point first so a replay looks
  // identical to the first play, not a jump from wherever the values
  // happened to settle. No separate door/window shape -- he appears
  // directly in the glory cloud, per request.
  const playEntrance = () => {
    cloudOpacity.setValue(0);
    cloudScale.setValue(0.7);
    entranceOpacity.setValue(0);
    entranceScale.setValue(0.92);

    playWindSound();

    // Slowed down on request -- should feel calm and intentional, not
    // hurried. Roughly double the original per-stage durations.
    Animated.sequence([
      Animated.parallel([
        Animated.timing(cloudOpacity, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(cloudScale, { toValue: 1, duration: 2200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(entranceOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(entranceScale, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  useEffect(() => {
    playEntrance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same wind cue for both arriving and leaving -- background music was
  // removed entirely on request, so this is the only ambient sound left
  // in Chat now.
  async function playWindSound() {
    try {
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
      const wind = createAudioPlayer(require('../../assets/sounds/entrance-wind.mp3'));
      // Fades in AND out, then stops -- see audioFade.ts. A hard on/off
      // cut at any fixed volume kept reading as either "too loud" (a
      // sudden burst, even a quiet one, is jarring) or "nothing" (an
      // abrupt quiet clip is easy to miss), and the source file itself
      // is a long ~12s clip that shouldn't just run on in the
      // background at full length.
      playFadedWindCue(wind, 0.14);
    } catch (e) {
      // Missing/failed audio should never block the visual entrance/exit.
      console.error('Wind sound error:', e);
    }
  }

  // Speaks a Jesus reply aloud and drives the large central avatar's
  // lip-sync state around it. Safe to call even with no TTS backend configured --
  // synthesizeSpeech will reject, the catch below stops the avatar and
  // logs it, and the message itself (already added via addMessage before
  // this is called) is unaffected either way.
  //
  // speakGenerationRef guards against two overlapping replies actually
  // playing at once: the `currentStopRef.current` check above only stops
  // a reply that's ALREADY playing -- if a second speakReply() call
  // starts while the first is still mid-synthesizeSpeech (a real
  // possibility now that conversation mode can trigger a new question
  // quickly), both calls could reach playSpeech() before either one has
  // set currentStopRef, and both would start playing. Each call stamps
  // its own generation number and checks it's still the latest one right
  // before actually starting playback; a superseded call bails out
  // instead of speaking over the newer one.
  const speakGenerationRef = useRef(0);
  const speakReply = async (replyText: string) => {
    if (currentStopRef.current) {
      await currentStopRef.current();
      currentStopRef.current = null;
    }
    const generation = ++speakGenerationRef.current;
    try {
      const audioUrl = await withAuthRetry((token) => synthesizeSpeech(token, replyText, language));
      if (generation !== speakGenerationRef.current) return; // superseded while synthesizing
      currentStopRef.current = await playSpeech(audioUrl, {
        onStart: () => {
          avatarRef.current?.startSpeaking();
          setJesusSpeaking(true);
        },
        onFinish: () => {
          avatarRef.current?.stopSpeaking();
          setJesusSpeaking(false);
          currentStopRef.current = null;
          // Conversation mode -- see lastInputWasVoiceRef's own comment.
          // Short delay so the mic doesn't snap on right as his voice
          // cuts off; reads as a natural conversational beat instead.
          if (lastInputWasVoiceRef.current && !limitReached) {
            setTimeout(() => {
              autoRelistenRef.current = true;
              startRecording();
            }, 500);
          }
        },
      });
    } catch (e) {
      console.error('Speech error:', e);
      avatarRef.current?.stopSpeaking();
      setJesusSpeaking(false);
      currentStopRef.current = null;
    }
  };

  // Safety layer runs FIRST, always, client-side, deterministically --
  // crisis/trafficking/abuse/jailbreak detection and age-appropriate
  // softening must never depend on a live model call succeeding or
  // behaving correctly. Only when nothing matches (getSafetyReply
  // returns null) does this go to the real backend/model. The catch
  // block covers both "the model failed to respond" and "the network
  // connection dropped" identically, same as before.
  async function generateReply(text: string): Promise<{ text: string; mood: JesusMood }> {
    const deviceRegion = Localization.getLocales?.()[0]?.regionCode ?? null;
    const safetyReply = getSafetyReply(text, { ageAppropriate: ageAppropriateMode, regionCode: deviceRegion });
    if (safetyReply) return safetyReply;

    const jesusMessage = await withAuthRetry((token) => sendMessage(token, conversationIdRef.current, text, language));
    return { text: jesusMessage.text, mood: jesusMessage.mood ?? 'neutral' };
  }

  const sendText = async (text: string, { chargeQuota }: { chargeQuota: boolean }) => {
    if (chargeQuota) {
      if (remainingQuestionsToday <= 0) {
        if (!spendToken()) {
          Alert.alert(t.chat.limitReached);
          return;
        }
      } else {
        setRemainingQuestionsToday(remainingQuestionsToday - 1);
      }
      addMessage({
        id: `${Date.now()}-user`,
        author: 'user',
        text,
        createdAt: new Date().toISOString(),
      });
    }

    setSendError(null);
    setSending(true);
    track('question_sent', { plan });

    try {
      const { text: replyText, mood } = await generateReply(text);
      setSending(false);
      addMessage(buildJesusMessage(replyText, mood));
      listRef.current?.scrollToEnd({ animated: true });
      speakReply(replyText);

      // "The app is only a bridge" (spec requirement 4) -- surfaced
      // periodically, not every message. See demoReplyEngine.ts.
      const userMessageCount = messages.filter((m) => m.author === 'user').length + 1;
      const reminder = maybeBridgeReminder(userMessageCount);
      if (reminder) {
        setTimeout(() => {
          addMessage(buildJesusMessage(reminder.text, reminder.mood));
          listRef.current?.scrollToEnd({ animated: true });
          speakReply(reminder.text);
        }, 1400);
      }
    } catch (e) {
      // AI failed to respond, or the connection dropped mid-conversation.
      setSending(false);
      setSendError({ text });
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    if (!canSendNow()) return;
    setInput('');
    lastInputWasVoiceRef.current = false;
    sendText(text, { chargeQuota: true });
  };

  // Auto-stop-on-silence, on request: talk freely after one mic tap
  // instead of having to tap again to "submit" (which read as a
  // mechanical, hit-enter-style step breaking up the conversation).
  // recorderState.metering (from useAudioRecorderState's 200ms poll
  // above) is a live dB level -- the effect below watches it, and once
  // it's been below SILENCE_THRESHOLD_DB for SILENCE_STOP_MS straight,
  // auto-stops and sends. Manually tapping the mic again still works
  // too, as an immediate override.
  //
  // Threshold history: -35 cut recordings off before anything usable was
  // captured (too strict). Loosened to -50 to compensate, but real
  // logged metering showed this device's own ambient/room noise floor
  // sits around -38 to -43dB even in "silence" -- above -50, so nothing
  // ever counted as quiet and recordings never auto-stopped at all
  // (nothing sent, nothing in the chat box). -37 sits just below that
  // measured noise floor. A fixed dB threshold is inherently approximate
  // -- natural speech has wide dynamic range and every mic/room differs
  // -- so MAX_RECORDING_MS below is the real safety net: even if this
  // threshold is still wrong for a given device, recording always stops
  // and sends on its own well before it could feel "stuck."
  const SILENCE_STOP_MS = 2200;
  const MIN_RECORDING_MS = 1200; // grace period before silence-checking starts, so it can't fire before you've said anything
  const SILENCE_THRESHOLD_DB = -37; // metering is ~-160 (silent) to 0 (loudest); may still need tuning per device/mic
  const MAX_RECORDING_MS = 15000; // hard cap so a miscalibrated threshold can never leave recording running indefinitely
  const lastLoudAtRef = useRef(0);
  const recordingStartedAtRef = useRef(0);

  useEffect(() => {
    if (!isRecording) return;
    // Temporary calibration aid -- shows the real metering values this
    // device actually produces while recording, so SILENCE_THRESHOLD_DB
    // can be tuned against real numbers instead of guessed again.
    console.log('Mic metering:', recorderState.metering, 'dB (threshold:', SILENCE_THRESHOLD_DB, ')');
    const now = Date.now();
    if (now - recordingStartedAtRef.current > MAX_RECORDING_MS) {
      stopRecordingAndSend();
      return;
    }
    if (typeof recorderState.metering === 'number' && recorderState.metering > SILENCE_THRESHOLD_DB) {
      lastLoudAtRef.current = now;
      return;
    }
    if (
      now - recordingStartedAtRef.current > MIN_RECORDING_MS &&
      now - lastLoudAtRef.current > SILENCE_STOP_MS
    ) {
      stopRecordingAndSend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorderState.metering, isRecording]);

  const startRecording = async () => {
    // Defense in depth alongside the mic button's own `disabled` prop --
    // recording while Jesus's reply is playing through the speaker picks
    // his own voice back up and re-transcribes it as a new question.
    if (jesusSpeaking) return;
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Microphone access needed', 'Enable microphone access in Settings to send a voice message.');
        return;
      }
      // allowsRecording must be on for the recorder to capture anything;
      // playSpeech()/startAmbientMusic() flip it back off once we're done
      // (see stopRecordingAndSend below) since it's off during normal
      // playback.
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      recordingStartedAtRef.current = Date.now();
      lastLoudAtRef.current = Date.now();
      stoppingRecordingRef.current = false;
      setIsRecording(true);
    } catch (e) {
      console.error('Failed to start recording:', e);
      Alert.alert('Could not start recording', 'Please try again.');
    }
  };

  // Guards against being called twice in quick succession -- e.g. the
  // silence-detection effect firing again on a later poll before the
  // isRecording state update from the first call has actually settled,
  // or the effect firing right as a manual mic tap also calls this.
  const stoppingRecordingRef = useRef(false);

  const stopRecordingAndSend = async () => {
    if (stoppingRecordingRef.current) return;
    stoppingRecordingRef.current = true;
    setIsRecording(false);
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
        // No recording URI even though stop() didn't throw -- record()
        // itself is fire-and-forget (returns void, not a Promise), so a
        // failure to actually start (mic already in use, audio session
        // conflict, etc.) wouldn't otherwise surface anywhere. Previously
        // this just returned silently -- tap the mic, nothing happens,
        // no error, no message sent.
        console.error('Voice message failed: no recording URI after stop()');
        Alert.alert('Voice message failed', 'Recording did not start properly -- please try again or type your message.');
        return;
      }

      setIsTranscribing(true);
      const text = await withAuthRetry((token) => transcribeSpeech(token, uri));
      setIsTranscribing(false);
      console.log('Voice message transcribed:', JSON.stringify(text));

      if (!text) {
        if (autoRelistenRef.current) {
          emptyAutoRelistenCountRef.current += 1;
          if (emptyAutoRelistenCountRef.current <= MAX_EMPTY_AUTO_RELISTENS) {
            // A real pause to think of a follow-up easily exceeds the
            // silence timeout -- try listening again a couple more times
            // before actually giving up, rather than ending the whole
            // conversation-mode loop on the first quiet moment.
            setTimeout(() => {
              autoRelistenRef.current = true;
              startRecording();
            }, 500);
          } else {
            // Genuinely wound down into silence -- end the auto-listening
            // loop quietly rather than nagging with an alert.
            lastInputWasVoiceRef.current = false;
            emptyAutoRelistenCountRef.current = 0;
          }
        } else {
          Alert.alert('Didn\'t catch that', 'No speech was detected -- please try again or type your message.');
        }
      } else if (!canSendNow()) {
        // Previously silently dropped the transcribed text here with no
        // feedback at all if this landed inside the 600ms send cooldown
        // (e.g. a second mic tap right after the first) -- you'd have
        // spoken, transcription would have succeeded, and it would just
        // vanish with nothing in the chat and no error either.
        Alert.alert('One moment', 'Please wait just a second before sending another message.');
      } else {
        lastInputWasVoiceRef.current = true;
        emptyAutoRelistenCountRef.current = 0;
        sendText(text, { chargeQuota: true });
      }
    } catch (e) {
      setIsTranscribing(false);
      console.error('Voice message failed:', e);
      Alert.alert('Voice message failed', 'Could not transcribe that -- please try again or type your message.');
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecordingAndSend();
    } else {
      autoRelistenRef.current = false;
      emptyAutoRelistenCountRef.current = 0;
      startRecording();
    }
  };

  const handleRetry = () => {
    if (!sendError) return;
    const { text } = sendError;
    setSendError(null);
    // Retrying doesn't charge a second question -- the first attempt
    // never got an answer.
    sendText(text, { chargeQuota: false });
  };

  const handleEndConversation = () => {
    Alert.alert('End conversation', 'Jesus will say a peaceful goodbye and fade out.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        onPress: () => {
          addMessage(buildJesusMessage(PEACEFUL_FAREWELL_TEXT, 'fadingOut'));
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
          // Same wind cue as the entrance, played as he leaves.
          playWindSound();
          // No speakReply() here -- fadingOut already means "withdrawing,"
          // and JesusAvatar's own isSpeaking guard forces speaking off for
          // that mood anyway (see its "isSpeaking = ... && mood !== 'fadingOut'").
        },
      },
    ]);
  };

  const handleClearChat = () => {
    Alert.alert('Clear chat history', 'This deletes every message below. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => clearMessages(),
      },
    ]);
  };

  const handleReport = (message: ChatMessage) => {
    Alert.alert('Report message', 'Flag this response for review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: () => {
          // TODO: services/api.ts reportMessage(authToken, message.id, reason)
          Alert.alert('Thank you', 'This has been reported to our team.');
        },
      },
    ]);
  };

  const handleFavorite = (message: ChatMessage) => {
    addFavorite({
      id: `${Date.now()}-fav`,
      type: 'message',
      text: message.text,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <Text style={styles.topBarTitle}>{t.tabs.chat}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={playEntrance} accessibilityRole="button" accessibilityLabel="Replay Jesus's entrance">
            <Ionicons name="refresh-outline" size={20} color={Colors.ivory} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('GuidedPrayer')} accessibilityRole="button" accessibilityLabel="Guided prayer">
            <Ionicons name="hand-left-outline" size={20} color={Colors.ivory} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Favorites')} accessibilityRole="button" accessibilityLabel="Favorites">
            <Ionicons name="bookmark-outline" size={20} color={Colors.ivory} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('About')} accessibilityRole="button" accessibilityLabel="About Jesus">
            <Ionicons name="information-circle-outline" size={20} color={Colors.ivory} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearChat} accessibilityRole="button" accessibilityLabel="Clear chat history">
            <Ionicons name="trash-outline" size={20} color={Colors.ivory} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEndConversation} accessibilityRole="button" accessibilityLabel="End conversation">
            <Ionicons name="exit-outline" size={20} color={Colors.ivory} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Jesus is the main thing on screen -- large, centered, face-to-face,
          rather than a small avatar riding along a text-chat list. The
          lip-sync/speaking state machine is unchanged (still driven via
          avatarRef.current?.startSpeaking()/stopSpeaking() in speakReply
          above); this only changes size/placement. The stage itself
          (background) is visible immediately -- only the cloud glow
          and the avatar fade in, sequenced, so there's no flash of the
          wrong background color before the entrance starts. No separate
          door/window shape -- he appears directly in the glory cloud. */}
      <View style={styles.avatarStage}>
        <View style={styles.avatarCircleWrap}>
          <Animated.View
            style={[styles.cloudGlow, { opacity: cloudOpacity, transform: [{ scale: cloudScale }] }]}
            // See JesusAvatar.tsx's drifting-cloud-veil comment -- same
            // Android flicker/redraw issue applies to any LinearGradient
            // riding a native-driver opacity/scale transform.
            renderToHardwareTextureAndroid
            needsOffscreenAlphaCompositing
          >
            <LinearGradient
              colors={[Colors.glory, 'rgba(255,243,196,0.12)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Animated.View style={{ opacity: entranceOpacity, transform: [{ scale: entranceScale }] }}>
            <JesusAvatar ref={avatarRef} mood={lastJesusMood} size={280} shape="portrait" />
          </Animated.View>
          {/* Lets the idle clip (plays once, freezes on its last frame) be
              rewatched on demand -- placed at the lower-right of the glow
              circle, on request, rather than only the top-bar icon (which
              replays the whole arrival: wind sound + cloud + fade-in). */}
          <TouchableOpacity
            style={styles.replayVideoBtn}
            onPress={() => avatarRef.current?.replayIdle()}
            accessibilityRole="button"
            accessibilityLabel="Replay video"
          >
            <Ionicons name="refresh" size={20} color={Colors.royal} />
          </TouchableOpacity>
        </View>
      </View>

      <TipBanner
        storageKey="ji_tip_chat_v1"
        text="Ask anything -- a question, a worry, a prayer. And remember: I'm here to point you toward God, not to replace time with Him yourself."
      />

      {/* Secondary, de-emphasized history -- kept (not removed) so context
          isn't lost, but intentionally smaller than the avatar stage above
          and without a per-bubble avatar (showAvatar={false}), since the
          one large avatar above already carries that role. */}
      <View style={{ flex: 1, transform: [{ scale: textZoom }] }}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <ChatBubble message={item} onLongPressReport={handleReport} onFavorite={handleFavorite} showAvatar={false} />
          )}
          contentContainerStyle={styles.list}
          style={styles.historyList}
          onContentSizeChange={(_width, height) => {
            listRef.current?.scrollToEnd({ animated: true });
            setContentHeight(height);
          }}
          onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
          onScroll={({ nativeEvent }) => {
            const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
            const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
            setShowScrollToBottom(distanceFromBottom > 200);
            setScrollOffset(contentOffset.y);
          }}
          scrollEventThrottle={16}
        />
        <DraggableScrollbar
          contentHeight={contentHeight}
          viewportHeight={viewportHeight}
          scrollOffset={scrollOffset}
          onScrollTo={(offset) => {
            listRef.current?.scrollToOffset({ offset, animated: false });
            setScrollOffset(offset);
          }}
        />
        {showScrollToBottom && (
          <TouchableOpacity
            style={styles.scrollToBottomBtn}
            onPress={() => listRef.current?.scrollToEnd({ animated: true })}
            accessibilityLabel="Scroll to latest message"
          >
            <Ionicons name="arrow-down" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>
      <MagnifyButton style={{ bottom: 100 }} />

      <Text style={styles.quotaText}>
        {remainingQuestionsToday === Infinity
          ? 'Unlimited questions'
          : `${Math.max(remainingQuestionsToday, 0)} questions left today · ${tokenBalance} tokens`}
      </Text>

      {limitReached && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitText}>{t.chat.limitReached}</Text>
        </View>
      )}

      {sendError && (
        <View style={styles.errorBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#7B341E" />
          <Text style={styles.errorText}>
            I didn't quite catch that -- check your connection and try again.
          </Text>
          <TouchableOpacity onPress={handleRetry} accessibilityRole="button" accessibilityLabel="Retry sending message">
            <Text style={styles.retryLink}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={t.chat.inputPlaceholder}
          placeholderTextColor="#A0AEC0"
          value={input}
          onChangeText={setInput}
          multiline
          editable={!limitReached}
          accessibilityLabel={t.chat.inputPlaceholder}
        />
        <TouchableOpacity
          style={[styles.micBtn, isRecording && styles.micBtnActive]}
          onPress={handleMicPress}
          disabled={limitReached || sending || isTranscribing || jesusSpeaking}
          accessibilityRole="button"
          accessibilityLabel={
            jesusSpeaking
              ? 'Microphone disabled while Jesus is speaking'
              : isRecording
              ? 'Stop recording and send'
              : 'Record a voice message'
          }
          accessibilityState={{ disabled: limitReached || sending || isTranscribing || jesusSpeaking }}
        >
          {isTranscribing ? (
            <ActivityIndicator size="small" color={Colors.royal} />
          ) : (
            <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={18} color={isRecording ? '#C0392B' : Colors.royal} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSend}
          disabled={limitReached || sending}
          accessibilityRole="button"
          accessibilityLabel="Send"
          accessibilityState={{ disabled: limitReached || sending }}
        >
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.royal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcons: { flexDirection: 'row', gap: 16 },
  scrollToBottomBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.royal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 50,
  },
  topBarTitle: { color: Colors.ivory, fontSize: 15, fontWeight: '700' },
  avatarStage: {
    flex: 2,
    backgroundColor: Colors.royal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    // The 480x480 glow circle inside can be taller than this flex:2
    // area actually ends up on shorter screens, in which case it
    // overflows past avatarStage's own bottom edge (overflow defaults
    // to visible) -- without a zIndex here, the later siblings below
    // (TipBanner, the message list) paint over that overflow in normal
    // stacking order, which is what was hiding the replay button.
    zIndex: 1,
  },
  // "Glory cloud" (Matthew 7:7 -- ask, seek, knock, and it is opened),
  // echoing GlorySplash.tsx's onboarding entrance, scaled up for the
  // larger avatar here. Absolutely positioned behind the avatar and
  // fades out of relevance once the entrance finishes -- doesn't repeat
  // or re-trigger afterward. No separate door/window shape (removed on
  // request) -- he appears directly in the cloud.
  avatarCircleWrap: {
    width: 480,
    height: 480,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudGlow: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 240,
    overflow: 'hidden',
  },
  replayVideoBtn: {
    position: 'absolute',
    // Pulled in from the circle's literal bounding-box corner (which was
    // outside the circle's own visible paint area anyway -- a circle
    // inscribed in a square never covers its corners) to sit right at
    // the avatar's own lower-right edge instead, comfortably inside
    // whatever portion of the 480 box actually ends up on-screen.
    bottom: 36,
    right: 70,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  quotaText: {
    color: '#8A93A8',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: '#F4F6FA',
  },
  historyList: { flex: 0.8 },
  list: { padding: 16, paddingBottom: 8 },
  limitBanner: { backgroundColor: '#FEEBC8', padding: 10, marginHorizontal: 16, borderRadius: 8 },
  limitText: { color: '#7B341E', fontSize: 12.5, textAlign: 'center' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEEBC8',
    padding: 10, marginHorizontal: 16, marginTop: 8, borderRadius: 8,
  },
  errorText: { flex: 1, color: '#7B341E', fontSize: 12.5 },
  retryLink: { color: Colors.royal, fontWeight: '700', fontSize: 12.5 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 110,
    color: Colors.ink,
  },
  sendBtn: {
    backgroundColor: Colors.royal,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    backgroundColor: '#F4F6FA',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  micBtnActive: {
    backgroundColor: '#FDEDEB',
    borderColor: '#C0392B',
  },
});
