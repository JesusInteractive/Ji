// The book you pulled off the Study Library's shelf: its spine slides out
// of the gap it leaves, comes forward into the lamp light, and opens --
// and if it's a Read Aloud book, Jesus starts reading it right here, with
// the room dimmed behind. No full-screen player: pause, slower and "read
// that again" sit under the open book, and "Read along" hands off to the
// full-text reader (StudyLibraryReaderScreen) at the page being read.
//
// Same access rules as the reader screen: reading aloud (Jesus AI or the
// Scholar) is a Platinum feature, per the Platinum plan card in
// constants/pricing.ts. Other plans and the trial see the Platinum
// invitation and can still read the text; with no plan, it's Subscribe.
// Books without audio open to their description and a link to the source.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Easing,
  ImageBackground,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../theme/colors';
import { useI18n } from '../../i18n';
import { useApp } from '../../context/AppContext';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { voiceFor } from '../../constants/studyLibraryAudio';
import { ReadAloudSession, type ReadAloudSnapshot } from '../../services/readAloudSession';
import { BookSpine } from './ShelfPieces';
import { SERIF, spineLook, type Rect, type ShelfBook } from './libraryLook';

type VolumeMode = 'textOnly' | 'subscribe' | 'platinum' | 'reading';

const INK = '#33261A';
const GOLD = '#E4C766';
const IVORY = '#EDE0CC';
const OPEN_MS = 1000;
const CLOSE_MS = 560;
const QUICK_CLOSE_MS = 260;

interface Props {
  book: ShelfBook | null;
  origin: Rect | null;
  onClosed: () => void;
}

function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}

// Walks up to whichever navigator owns `name` (the reader lives in this
// stack; Pricing lives in the root stack two levels up).
function navigateUp(navigation: NavigationProp<ParamListBase>, name: string, params?: object) {
  let current: NavigationProp<ParamListBase> | undefined = navigation;
  while (current) {
    if (current.getState()?.routeNames?.includes(name)) {
      current.navigate(name, params);
      return;
    }
    current = current.getParent();
  }
}

// "Jesus is reading {title}" with the title set in italics.
function StatusLine({ template, title }: { template: string; title: string }) {
  const [before, after = ''] = template.split('{title}');
  return (
    <Text style={styles.status}>
      {before}
      <Text style={styles.statusTitle}>{title}</Text>
      {after}
    </Text>
  );
}

function ControlButton({
  icon,
  label,
  onPress,
  big,
  active,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  big?: boolean;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.control, disabled && { opacity: 0.4 }]}
    >
      <View style={[styles.controlCircle, big && styles.controlCircleBig, active && styles.controlActive]}>
        <Ionicons name={icon} size={big ? 30 : 20} color={active ? '#1A1008' : GOLD} style={big && icon === 'play' ? { marginLeft: 3 } : undefined} />
      </View>
      <Text style={styles.controlLabel} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function PageButton({ label, onPress, outline }: { label: string; onPress: () => void; outline?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" style={[styles.pageButton, outline && styles.pageButtonOutline]}>
      <Text style={[styles.pageButtonText, outline && styles.pageButtonTextOutline]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function OpenVolume({ book, origin, onClosed }: Props) {
  const { t } = useI18n();
  const s = t.studyLibrary;
  const { plan } = useApp();
  const { hasAccess } = useFeatureAccess();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const progress = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0.4)).current;
  const sessionRef = useRef<ReadAloudSession | null>(null);
  const afterClose = useRef<(() => void) | null>(null);
  const closingRef = useRef(false);
  const [snapshot, setSnapshot] = useState<ReadAloudSnapshot | null>(null);

  // Who reads this book -- fixed per book, shown on its spine before it
  // was picked up (gold mark = Jesus AI, plain = the Scholar).
  const voice = book?.readAloud ? voiceFor(book.readAloud) : null;
  const mode: VolumeMode | null = !book
    ? null
    : !book.readAloud
      ? 'textOnly'
      : !hasAccess
        ? 'subscribe'
        : plan === 'platinum'
          ? 'reading'
          : 'platinum';
  const reads = mode === 'reading';
  const status = snapshot?.status ?? 'loading';

  useEffect(() => {
    if (!book) return;
    closingRef.current = false;
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: OPEN_MS, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
  }, [book, progress]);

  useEffect(() => {
    if (!book?.readAloud || mode !== 'reading' || !voice) return;
    const session = new ReadAloudSession(book.readAloud, voice, setSnapshot);
    sessionRef.current = session;
    session.start();
    return () => {
      session.destroy();
      if (sessionRef.current === session) sessionRef.current = null;
      setSnapshot(null);
    };
  }, [book, mode, voice]);

  // Leaving the app pauses the reading rather than losing the place.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') sessionRef.current?.pause();
    });
    return () => subscription.remove();
  }, []);

  // A slow gold breath next to "Jesus is reading" while the voice is going.
  useEffect(() => {
    if (status !== 'reading') {
      breathe.setValue(0.4);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0.35, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [status, breathe]);

  const runAfterClose = useCallback(() => {
    const run = afterClose.current;
    afterClose.current = null;
    run?.();
  }, []);

  // Puts the book back on the shelf. `after` runs once the modal is fully
  // gone -- presenting another screen (Pricing, the reader) while this
  // modal is still dismissing can fail silently on iOS.
  const close = useCallback(
    (after?: () => void) => {
      if (closingRef.current) return;
      closingRef.current = true;
      sessionRef.current?.destroy();
      afterClose.current = after ?? null;
      Animated.timing(progress, {
        toValue: 0,
        duration: after ? QUICK_CLOSE_MS : CLOSE_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        onClosed();
        // onDismiss is iOS-only; elsewhere (and as an iOS fallback) run it shortly after.
        setTimeout(runAfterClose, Platform.OS === 'ios' ? 600 : 0);
      });
    },
    [onClosed, progress, runAfterClose]
  );

  const look = book ? spineLook(book) : null;
  const cardW = Math.min(screenW - 28, 480);
  const pageW = cardW / 2;
  const pageH = Math.min(Math.max(pageW * 1.5, 300), screenH * 0.46);
  const bookTop = insets.top + 134;
  const bookLeft = (screenW - cardW) / 2;

  // One timeline drives the whole pull-out: spine slides out (0-0.22),
  // comes forward to the lamp (to 0.6), the cover swings open (0.62-0.92),
  // then the pages and controls settle in.
  const between = (inputRange: number[], outputRange: number[] | string[]) =>
    progress.interpolate({ inputRange, outputRange, extrapolate: 'clamp' });

  const onMainControl = () => {
    const session = sessionRef.current;
    if (!session) return;
    if (status === 'reading' || status === 'loading') session.pause();
    else if (status === 'paused') session.resume();
    else if (status === 'finished') session.readAgain();
    else session.retry();
  };

  const readAlong = () => {
    if (!book?.readAloud) return;
    const params = { titleId: book.readAloud.id, page: sessionRef.current?.currentPage ?? 0 };
    close(() => navigateUp(navigation, 'StudyLibraryReader', params));
  };

  const openPricing = () => close(() => navigateUp(navigation, 'Pricing'));

  const openSource = () => {
    if (!book?.url) return;
    Linking.openURL(book.url).catch(() => Alert.alert(t.studyTools.linkErrorTitle, t.studyTools.linkErrorMessage));
  };

  const renderRightPage = () => {
    if (!book) return null;
    if (reads) {
      if (status === 'error') {
        return (
          <View style={styles.pageCenter}>
            <Text style={styles.note}>{s.readingError}</Text>
            <PageButton label={s.tryAgain} onPress={() => sessionRef.current?.retry()} />
          </View>
        );
      }
      if (!snapshot || status === 'loading' || !snapshot.passage) {
        return (
          <View style={styles.pageCenter}>
            <ActivityIndicator color={Colors.goldOnLight} />
            <Text style={[styles.note, { marginTop: 10 }]}>{s.openingBook}</Text>
          </View>
        );
      }
      return (
        <ScrollView key={snapshot.passage} showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageScroll}>
          <Text style={[styles.passage, status === 'paused' && { opacity: 0.6 }]}>{snapshot.passage}</Text>
        </ScrollView>
      );
    }
    const note =
      mode === 'textOnly'
        ? s.textOnlyNote
        : mode === 'platinum'
          ? voice === 'scholar'
            ? s.scholarPlatinumNote
            : s.platinumNote
          : s.subscribeNote;
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageScroll}>
        {book.description ? <Text style={styles.description}>{book.description}</Text> : null}
        <Text style={styles.note}>{note}</Text>
        {mode === 'textOnly' && book.url ? <PageButton label={s.openAtSource} onPress={openSource} /> : null}
        {mode === 'platinum' ? (
          <>
            <PageButton label={s.seePlatinum} onPress={openPricing} />
            <PageButton label={s.readTheText} onPress={readAlong} outline />
          </>
        ) : null}
        {mode === 'subscribe' ? <PageButton label={s.subscribe} onPress={openPricing} /> : null}
      </ScrollView>
    );
  };

  const statusTemplate =
    status === 'paused'
      ? s.pausedStatus
      : status === 'finished'
        ? s.finishedStatus
        : voice === 'scholar'
          ? s.scholarReadingStatus
          : s.readingStatus;

  return (
    <Modal
      visible={!!book}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => close()}
      onDismiss={runAfterClose}
    >
      {book && origin && look && mode ? (
        <View style={StyleSheet.absoluteFill}>
          {/* The room stays, dimmed; a warm pool of lamp light is left over the book. */}
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: between([0, 0.35], [0, 1]) }]}>
            <LinearGradient
              colors={['rgba(255,170,80,0.12)', 'rgba(0,0,0,0)']}
              start={{ x: 0, y: 0.25 }}
              end={{ x: 0.9, y: 0.9 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glow,
              { top: bookTop - 40, left: bookLeft - 30, width: cardW + 60, height: pageH + 80, opacity: between([0.55, 1], [0, 1]) },
            ]}
          />

          {/* The open book. */}
          <Animated.View
            style={[styles.spread, { top: bookTop, left: bookLeft, width: cardW, height: pageH, opacity: between([0.5, 0.62], [0, 1]) }]}
          >
            <Animated.View style={[styles.board, { left: -6, width: pageW + 6, backgroundColor: look.color, opacity: between([0.78, 0.98], [0, 1]) }]} />
            <View style={[styles.board, { left: pageW, width: pageW + 6, backgroundColor: look.color }]} />

            <Animated.View style={[styles.page, { left: 0, width: pageW, opacity: between([0.78, 0.98], [0, 1]) }]}>
              <ImageBackground source={require('../../../assets/textures/parchment.jpg')} style={styles.pageFill} imageStyle={styles.pageTexture}>
                <View style={styles.leftInner}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.bookTitle} numberOfLines={6}>
                      {book.title}
                    </Text>
                    <View style={styles.rule} />
                    <Text style={styles.bookAuthor} numberOfLines={3}>
                      {book.author}
                    </Text>
                    {book.era ? <Text style={styles.bookEra}>{book.era}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    {reads && snapshot && snapshot.pageCount > 0 ? (
                      <Text style={styles.pageOf}>{fill(s.pageOf, { page: snapshot.pageIndex + 1, total: snapshot.pageCount })}</Text>
                    ) : null}
                    {book.readAloud ? (
                      <View style={[styles.emblem, voice === 'scholar' && { borderColor: INK }]}>
                        <Ionicons name="volume-medium" size={12} color={voice === 'scholar' ? INK : Colors.goldOnLight} />
                      </View>
                    ) : null}
                  </View>
                </View>
              </ImageBackground>
            </Animated.View>

            <View style={[styles.page, { left: pageW, width: pageW }]}>
              <ImageBackground source={require('../../../assets/textures/parchment.jpg')} style={styles.pageFill} imageStyle={styles.pageTexture}>
                <Animated.View style={{ flex: 1, opacity: between([0.8, 1], [0, 1]) }}>{renderRightPage()}</Animated.View>
              </ImageBackground>
            </View>

            <LinearGradient
              pointerEvents="none"
              colors={['rgba(60,35,10,0)', 'rgba(60,35,10,0.38)', 'rgba(60,35,10,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.gutter, { left: pageW - 18 }]}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255,200,130,0.26)', 'rgba(255,200,130,0)', 'rgba(20,10,0,0.26)']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0.15 }}
              end={{ x: 1, y: 0.95 }}
              style={StyleSheet.absoluteFill}
            />

            {/* The front cover, swinging open on the gutter. */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.cover,
                {
                  left: pageW,
                  width: pageW + 6,
                  backgroundColor: look.color,
                  opacity: between([0.9, 0.93], [1, 0]),
                  transformOrigin: 'left',
                  transform: [{ perspective: 1200 }, { rotateY: between([0.62, 0.92], ['0deg', '-90deg']) }],
                },
              ]}
            >
              <View style={styles.coverLight} />
              <View style={styles.coverFrame}>
                <Text style={styles.coverTitle} numberOfLines={5}>
                  {book.title}
                </Text>
                <View style={styles.coverRule} />
                <Text style={styles.coverAuthor} numberOfLines={2}>
                  {book.author}
                </Text>
              </View>
            </Animated.View>
          </Animated.View>

          {/* The spine sliding out of its gap and coming forward. */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: origin.x,
              top: origin.y,
              opacity: between([0, 0.5, 0.64], [1, 1, 0]),
              transform: [
                { translateX: between([0, 0.22, 0.6], [0, 0, bookLeft + pageW - (origin.x + origin.width / 2)]) },
                { translateY: between([0, 0.22, 0.6], [0, -16, bookTop + pageH / 2 - (origin.y + origin.height / 2)]) },
                { scale: between([0, 0.22, 0.6], [1, 1.06, pageH / origin.height]) },
              ],
            }}
          >
            <BookSpine book={book} look={look} />
          </Animated.View>

          <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { opacity: between([0.85, 1], [0, 1]) }]}>
            <TouchableOpacity
              onPress={() => close()}
              accessibilityRole="button"
              accessibilityLabel={s.putBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.closeButton, { top: insets.top + 10 }]}
            >
              <Ionicons name="close" size={24} color={IVORY} />
            </TouchableOpacity>

            {reads ? (
              <>
                <View style={[styles.statusRow, { top: bookTop - 78 }]}>
                  <Animated.View style={[styles.presence, { opacity: breathe }]} />
                  <StatusLine template={statusTemplate} title={book.title} />
                </View>
                {/* Always says whose voice this is: Jesus AI, or the Scholar. */}
                <View style={[styles.voiceTagRow, { top: bookTop - 40 }]}>
                  <View style={[styles.voiceTag, voice === 'scholar' && styles.voiceTagScholar]}>
                    <Ionicons name={voice === 'scholar' ? 'school' : 'sparkles'} size={11} color={voice === 'scholar' ? IVORY : GOLD} />
                    <Text style={[styles.voiceTagText, voice === 'scholar' && { color: IVORY }]}>
                      {voice === 'scholar' ? s.scholarVoiceTag : s.jesusVoiceTag}
                    </Text>
                  </View>
                </View>
              </>
            ) : null}

            <View style={[styles.below, { top: bookTop + pageH + 24 }]}>
              {reads ? (
                <>
                  <View style={styles.controls}>
                    <ControlButton
                      icon="arrow-undo"
                      label={s.readAgain}
                      onPress={() => sessionRef.current?.readAgain()}
                      disabled={!snapshot?.passage}
                    />
                    <ControlButton
                      big
                      icon={status === 'reading' || status === 'loading' ? 'pause' : status === 'error' ? 'refresh' : 'play'}
                      label={status === 'paused' ? s.resume : status === 'finished' ? s.readAgain : status === 'error' ? s.tryAgain : s.pause}
                      onPress={onMainControl}
                    />
                    <ControlButton
                      icon="speedometer-outline"
                      label={snapshot?.slow ? s.normalSpeed : s.slower}
                      onPress={() => sessionRef.current?.toggleSlow()}
                      active={snapshot?.slow}
                      disabled={!snapshot}
                    />
                  </View>
                  <TouchableOpacity onPress={readAlong} accessibilityRole="button" style={styles.readAlong}>
                    <Ionicons name="book-outline" size={16} color={GOLD} />
                    <Text style={styles.readAlongText}>{s.readAlong}</Text>
                  </TouchableOpacity>
                </>
              ) : null}
              {book.readAloud ? (
                <Text style={styles.disclosure}>{voice === 'scholar' ? s.scholarDisclosure : s.jesusVoiceDisclosure}</Text>
              ) : null}
            </View>
          </Animated.View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(8,5,2,0.8)' },
  glow: {
    position: 'absolute',
    borderRadius: 220,
    backgroundColor: 'rgba(255,170,80,0.07)',
    shadowColor: '#FFB45A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 50,
  },
  spread: { position: 'absolute' },
  board: {
    position: 'absolute',
    top: -5,
    bottom: -5,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  page: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#EFE4C8', overflow: 'hidden' },
  pageFill: { flex: 1 },
  pageTexture: { opacity: 0.85 },
  gutter: { position: 'absolute', top: 0, bottom: 0, width: 36 },
  leftInner: { flex: 1, padding: 16, justifyContent: 'space-between' },
  bookTitle: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: INK, textAlign: 'center', lineHeight: 21, marginTop: 8 },
  rule: { width: 36, height: 1, backgroundColor: Colors.goldOnLight, marginVertical: 10, opacity: 0.8 },
  bookAuthor: { fontFamily: SERIF, fontSize: 12.5, fontStyle: 'italic', color: INK, opacity: 0.8, textAlign: 'center' },
  bookEra: { fontFamily: SERIF, fontSize: 11, color: INK, opacity: 0.6, marginTop: 4, textAlign: 'center' },
  pageOf: { fontFamily: SERIF, fontSize: 10.5, color: INK, opacity: 0.6, marginBottom: 8 },
  emblem: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.goldOnLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageScroll: { padding: 14, paddingBottom: 20 },
  pageCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 14 },
  passage: { fontFamily: SERIF, fontSize: 13.5, lineHeight: 20, color: INK },
  description: { fontFamily: SERIF, fontSize: 12.5, lineHeight: 18, color: INK, opacity: 0.85, marginBottom: 12 },
  note: { fontFamily: SERIF, fontSize: 12.5, lineHeight: 18, fontStyle: 'italic', color: INK, textAlign: 'center', marginBottom: 12 },
  pageButton: {
    backgroundColor: '#4A2E1C',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  pageButtonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#4A2E1C' },
  pageButtonText: { color: '#F2DFA7', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  pageButtonTextOutline: { color: '#4A2E1C' },
  cover: {
    position: 'absolute',
    top: -5,
    bottom: -5,
    borderRadius: 4,
    padding: 10,
    backfaceVisibility: 'hidden',
  },
  coverLight: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '45%', backgroundColor: 'rgba(255,214,160,0.12)', borderRadius: 4 },
  coverFrame: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(212,176,98,0.7)',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  coverTitle: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: '#DDBF74', textAlign: 'center', lineHeight: 21 },
  coverRule: { width: 30, height: 1, backgroundColor: '#DDBF74', marginVertical: 10, opacity: 0.8 },
  coverAuthor: { fontFamily: SERIF, fontSize: 12, fontStyle: 'italic', color: '#DDBF74', opacity: 0.85, textAlign: 'center' },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: { position: 'absolute', left: 24, right: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  presence: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
    marginRight: 10,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  voiceTagRow: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  voiceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(228,199,102,0.55)',
    borderRadius: 11,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: 'rgba(20,12,6,0.5)',
  },
  voiceTagScholar: { borderColor: 'rgba(237,224,204,0.4)' },
  voiceTagText: { color: GOLD, fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  status: { fontFamily: SERIF, fontSize: 17, color: IVORY, textAlign: 'center', flexShrink: 1 },
  statusTitle: { fontStyle: 'italic', color: GOLD },
  below: { position: 'absolute', left: 20, right: 20, alignItems: 'center' },
  controls: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 14 },
  control: { alignItems: 'center', width: 104 },
  controlCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: 'rgba(228,199,102,0.7)',
    backgroundColor: 'rgba(20,12,6,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlCircleBig: { width: 62, height: 62, borderRadius: 31, marginTop: -8 },
  controlActive: { backgroundColor: GOLD, borderColor: GOLD },
  controlLabel: { color: IVORY, fontSize: 11.5, marginTop: 6, opacity: 0.85 },
  readAlong: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, marginTop: 6 },
  readAlongText: { color: GOLD, fontSize: 14, fontWeight: '600', fontFamily: SERIF },
  disclosure: { color: IVORY, opacity: 0.5, fontSize: 10.5, lineHeight: 15, textAlign: 'center', marginTop: 8 },
});
