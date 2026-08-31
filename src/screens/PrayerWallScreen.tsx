import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import Colors from '../theme/colors';
import { playFadedWindCue } from '../services/audioFade';
import WesternWallBackground, { WALL_WIDTH, buildWall, mulberry32, hashStringToSeed } from '../components/WesternWallBackground';
import PrayerNote, { NOTE_WIDTH } from '../components/PrayerNote';
import TipBanner from '../components/TipBanner';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import type { PrayerNote as PrayerNoteType, TestimonyNote as TestimonyNoteType } from '../types';

const WALL_ROWS = 16;

// "Prayer Wall that looks like the real Western Wall in Jerusalem... little
// bell sound when a prayer is received" (spec section 4/7/8). Modeled on
// reference photos/architecture notes: meleke limestone ashlar blocks,
// Herodian margins on the larger lower-course stones, smaller later-period
// stones higher up, staggered dry-laid joints, and small crevices where
// notes are tucked in -- see WesternWallBackground.tsx.
//
// Split top/bottom with a Testimony Stream (same local-first privacy
// model, see TestimonyNote's own comment in types/index.ts): both halves
// are local-first/private by default -- a user must explicitly opt in to
// "Share publicly" for a note to ever leave their device, and neither
// actually leaves the device yet -- a real shared stream needs backend
// storage and moderation that doesn't exist yet. This just gives both a
// consistent place to write for themselves today, ready to go public
// later without changing the writing experience.
export default function PrayerWallScreen() {
  const { t } = useI18n();
  const { prayerNotes, addPrayerNote, testimonyNotes, addTestimonyNote } = useApp();

  // -- Prayer half --
  const [prayerText, setPrayerText] = useState('');
  const [prayerAnonymous, setPrayerAnonymous] = useState(true);
  const [prayerShared, setPrayerShared] = useState(false);
  const [openNote, setOpenNote] = useState<PrayerNoteType | null>(null);
  const wallScrollRef = useRef<ScrollView>(null);

  // -- Testimony half --
  const [testimonyText, setTestimonyText] = useState('');
  const [testimonyAnonymous, setTestimonyAnonymous] = useState(true);
  const [testimonyShared, setTestimonyShared] = useState(false);
  const [openTestimony, setOpenTestimony] = useState<TestimonyNoteType | null>(null);

  const wallHeight = useMemo(() => buildWall(WALL_ROWS, mulberry32(1337)).totalHeight, []);

  const positions = useMemo(() => {
    return prayerNotes.map((note) => {
      const rand = mulberry32(hashStringToSeed(note.id));
      const x = 8 + rand() * (WALL_WIDTH - NOTE_WIDTH - 16);
      const y = 10 + rand() * (wallHeight - 50);
      const rotateDeg = (rand() - 0.5) * 16;
      return { note, x, y, rotateDeg };
    });
  }, [prayerNotes, wallHeight]);

  // A brief shofar blast when a prayer is placed -- the sound of the
  // ram's horn at the Western Wall, kept deliberately quiet/short (same
  // ~0.14 target volume as the entrance wind cue, no fade-out) so it
  // reads as a gentle received-confirmation rather than a literal
  // trumpet blast.
  async function playShofarSound() {
    try {
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
      const shofar = createAudioPlayer(require('../../assets/sounds/shofar.mp3'));
      playFadedWindCue(shofar, 0.14);
    } catch (e) {
      console.error('Shofar sound error:', e);
    }
  }

  const handlePlacePrayer = () => {
    const trimmed = prayerText.trim();
    if (!trimmed) return;
    const note: PrayerNoteType = {
      id: `${Date.now()}`,
      text: trimmed,
      isAnonymous: prayerAnonymous,
      sharedPublicly: prayerShared,
      createdAt: new Date().toISOString(),
    };
    addPrayerNote(note);
    setPrayerText('');
    playShofarSound();

    // New notes land at a random crevice anywhere on the (tall,
    // scrollable) wall -- same seeded-by-id math as the `positions`
    // memo above. Without this, a note placed low/high off the current
    // scroll position is indistinguishable from "nothing happened,"
    // since the Alert alone doesn't show *where* it went. Scroll it
    // into view (with a little headroom, not pinned to the very top)
    // so placing a prayer visibly does something.
    const rand = mulberry32(hashStringToSeed(note.id));
    rand(); // consumes the x draw first, matching the memo's draw order
    const y = 10 + rand() * (wallHeight - 50);
    requestAnimationFrame(() => {
      wallScrollRef.current?.scrollTo({ y: Math.max(0, y - 150), animated: true });
    });

    Alert.alert(t.prayerWall.placed);
  };

  const handleShareTestimony = () => {
    const trimmed = testimonyText.trim();
    if (!trimmed) return;
    const note: TestimonyNoteType = {
      id: `${Date.now()}`,
      text: trimmed,
      isAnonymous: testimonyAnonymous,
      sharedPublicly: testimonyShared,
      createdAt: new Date().toISOString(),
    };
    addTestimonyNote(note);
    setTestimonyText('');
    Alert.alert('Testimony saved');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.half}>
        <View style={styles.halfHeader}>
          <MaterialCommunityIcons name="hands-pray" size={16} color={Colors.royal} />
          <Text style={styles.halfTitle}>{t.prayerWall.title}</Text>
        </View>

        <ScrollView ref={wallScrollRef} style={styles.halfScroll} contentContainerStyle={styles.wallScroll}>
          <View style={[styles.wallWrap, { height: wallHeight }]}>
            <WesternWallBackground rows={WALL_ROWS} />
            {positions.map(({ note, x, y, rotateDeg }) => (
              <PrayerNote key={note.id} note={note} x={x} y={y} rotateDeg={rotateDeg} onPress={() => setOpenNote(note)} />
            ))}
            {prayerNotes.length === 0 && (
              <View style={styles.emptyOverlay}>
                <Text style={styles.empty}>No prayers placed yet. Be the first.</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder={t.prayerWall.inputPlaceholder}
            placeholderTextColor="#A0AEC0"
            value={prayerText}
            onChangeText={setPrayerText}
            multiline
            accessibilityLabel="Write your prayer"
          />
          <View style={styles.toggleRow}>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleLabel}>{t.prayerWall.anonymous}</Text>
              <Switch value={prayerAnonymous} onValueChange={setPrayerAnonymous} accessibilityLabel="Post anonymously" />
            </View>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleLabel}>{t.prayerWall.shared}</Text>
              <Switch value={prayerShared} onValueChange={setPrayerShared} accessibilityLabel="Share on the public wall" />
            </View>
          </View>
          <TouchableOpacity style={styles.placeBtn} onPress={handlePlacePrayer} accessibilityRole="button" accessibilityLabel="Place prayer in the wall">
            <MaterialCommunityIcons name="hands-pray" size={16} color={Colors.white} />
            <Text style={styles.placeBtnText}>Place prayer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.half}>
        <View style={styles.halfHeader}>
          <Ionicons name="sparkles" size={16} color={Colors.gold} />
          <Text style={styles.halfTitle}>Testimony Stream</Text>
        </View>

        <ScrollView style={styles.halfScroll} contentContainerStyle={styles.testimonyScroll}>
          {testimonyNotes.length === 0 ? (
            <View style={styles.testimonyEmptyWrap}>
              <Text style={styles.empty}>No testimonies shared yet. Be the first.</Text>
            </View>
          ) : (
            testimonyNotes.map((note) => (
              <TouchableOpacity
                key={note.id}
                style={styles.testimonyCard}
                onPress={() => setOpenTestimony(note)}
                accessibilityRole="button"
                accessibilityLabel={note.isAnonymous ? 'Anonymous testimony, tap to read' : 'Testimony, tap to read'}
              >
                <Ionicons name="sparkles" size={14} color={Colors.gold} style={styles.testimonyCardIcon} />
                <Text style={styles.testimonyCardText} numberOfLines={3}>
                  {note.text}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Share what God has done..."
            placeholderTextColor="#A0AEC0"
            value={testimonyText}
            onChangeText={setTestimonyText}
            multiline
            accessibilityLabel="Write your testimony"
          />
          <View style={styles.toggleRow}>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleLabel}>{t.prayerWall.anonymous}</Text>
              <Switch value={testimonyAnonymous} onValueChange={setTestimonyAnonymous} accessibilityLabel="Post anonymously" />
            </View>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleLabel}>{t.prayerWall.shared}</Text>
              <Switch value={testimonyShared} onValueChange={setTestimonyShared} accessibilityLabel="Share publicly" />
            </View>
          </View>
          <TouchableOpacity style={[styles.placeBtn, styles.testimonyBtn]} onPress={handleShareTestimony} accessibilityRole="button" accessibilityLabel="Share testimony">
            <Ionicons name="sparkles" size={16} color={Colors.white} />
            <Text style={styles.placeBtnText}>Share testimony</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={!!openNote} transparent animationType="fade" onRequestClose={() => setOpenNote(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setOpenNote(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalText}>{openNote?.text}</Text>
            <TouchableOpacity style={styles.modalClose} onPress={() => setOpenNote(null)}>
              <Text style={styles.modalCloseText}>{t.common.close}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!openTestimony} transparent animationType="fade" onRequestClose={() => setOpenTestimony(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setOpenTestimony(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalText}>{openTestimony?.text}</Text>
            <TouchableOpacity style={styles.modalClose} onPress={() => setOpenTestimony(null)}>
              <Text style={styles.modalCloseText}>{t.common.close}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFE7D6', borderWidth: 5, borderColor: Colors.royal },
  half: { flex: 1 },
  divider: { height: 3, backgroundColor: Colors.royal },
  halfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  halfTitle: { fontSize: 15, fontWeight: '800', color: Colors.royal },
  halfScroll: { flex: 1 },
  wallScroll: { alignItems: 'center', paddingBottom: 8 },
  wallWrap: { width: WALL_WIDTH, position: 'relative' },
  emptyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    color: '#4A4436',
    fontSize: 13,
    backgroundColor: 'rgba(251,247,236,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  testimonyScroll: { padding: 12, gap: 10 },
  testimonyEmptyWrap: { paddingVertical: 24, alignItems: 'center' },
  testimonyCard: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFBEF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0DFA0',
    padding: 12,
    marginBottom: 10,
  },
  testimonyCardIcon: { marginTop: 2 },
  testimonyCardText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: Colors.ink },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  modalCard: { backgroundColor: '#FBF7EC', borderRadius: 12, padding: 20, width: '100%', maxWidth: 320 },
  modalText: { fontSize: 15, lineHeight: 22, color: Colors.ink, marginBottom: 16 },
  modalClose: { alignSelf: 'flex-end', backgroundColor: Colors.royal, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 16 },
  modalCloseText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  composer: { padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5DCC3' },
  input: {
    backgroundColor: '#F4F6FA',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: Colors.ink,
    minHeight: 40,
    maxHeight: 60,
    marginBottom: 6,
  },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  toggleItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleLabel: { fontSize: 11.5, color: Colors.ink },
  placeBtn: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Colors.royal,
    borderRadius: 18,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonyBtn: { backgroundColor: '#B8933E' },
  placeBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
});
