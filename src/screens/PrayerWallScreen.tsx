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
import type { PrayerNote as PrayerNoteType } from '../types';

const WALL_ROWS = 16;

// "Prayer Wall that looks like the real Western Wall in Jerusalem... little
// bell sound when a prayer is received" (spec section 4/7/8). Modeled on
// reference photos/architecture notes: meleke limestone ashlar blocks,
// Herodian margins on the larger lower-course stones, smaller later-period
// stones higher up, staggered dry-laid joints, and small crevices where
// notes are tucked in -- see WesternWallBackground.tsx. Notes are
// local-first/private by default -- a user must explicitly opt in to
// "Share on the public wall" for a note to ever leave their device; a
// real public wall needs backend moderation before launch.
export default function PrayerWallScreen() {
  const { t } = useI18n();
  const { prayerNotes, addPrayerNote } = useApp();
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [shared, setShared] = useState(false);
  const [openNote, setOpenNote] = useState<PrayerNoteType | null>(null);
  const wallScrollRef = useRef<ScrollView>(null);

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

  const handlePlace = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const note: PrayerNoteType = {
      id: `${Date.now()}`,
      text: trimmed,
      isAnonymous: anonymous,
      sharedPublicly: shared,
      createdAt: new Date().toISOString(),
    };
    addPrayerNote(note);
    setText('');
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.prayerWall.title}</Text>
        <Text style={styles.subtitle}>{t.prayerWall.subtitle}</Text>
      </View>

      <TipBanner
        storageKey="ji_tip_wall_v1"
        text="Write a prayer below and place it in the wall -- it tucks into a crevice like a real note. Tap any note to read it."
      />

      <ScrollView ref={wallScrollRef} contentContainerStyle={styles.wallScroll}>
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

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder={t.prayerWall.inputPlaceholder}
          placeholderTextColor="#A0AEC0"
          value={text}
          onChangeText={setText}
          multiline
          accessibilityLabel="Write your prayer"
        />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t.prayerWall.anonymous}</Text>
          <Switch value={anonymous} onValueChange={setAnonymous} accessibilityLabel="Post anonymously" />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t.prayerWall.shared}</Text>
          <Switch value={shared} onValueChange={setShared} accessibilityLabel="Share on the public wall" />
        </View>
        <TouchableOpacity style={styles.placeBtn} onPress={handlePlace} accessibilityRole="button" accessibilityLabel="Place prayer in the wall">
          <MaterialCommunityIcons name="hands-pray" size={18} color={Colors.white} />
          <Text style={styles.placeBtnText}>Place prayer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFE7D6' },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.royal },
  subtitle: { fontSize: 12.5, color: '#7A6E52', marginTop: 2 },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  modalCard: { backgroundColor: '#FBF7EC', borderRadius: 12, padding: 20, width: '100%', maxWidth: 320 },
  modalText: { fontSize: 15, lineHeight: 22, color: Colors.ink, marginBottom: 16 },
  modalClose: { alignSelf: 'flex-end', backgroundColor: Colors.royal, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 16 },
  modalCloseText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  composer: { padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5DCC3' },
  input: {
    backgroundColor: '#F4F6FA',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.ink,
    minHeight: 60,
    marginBottom: 8,
  },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  toggleLabel: { fontSize: 13, color: Colors.ink, flex: 1 },
  placeBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.royal,
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  placeBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
});
