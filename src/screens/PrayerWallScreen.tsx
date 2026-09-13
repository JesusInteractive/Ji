import React, { useMemo, useRef, useState } from 'react';
import { Alert, ImageBackground, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import Colors from '../theme/colors';
import { playFadedWindCue } from '../services/audioFade';
import { WALL_WIDTH, mulberry32, hashStringToSeed } from '../components/WesternWallBackground';
import PrayerNote, { NOTE_WIDTH } from '../components/PrayerNote';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import type { PrayerNote as PrayerNoteType } from '../types';
import type { MainTabParamList } from '../navigation/MainTabs';

// How much vertical space each prayer note gets on the wall. Notes used
// to be scattered randomly across a FIXED-height wall (WALL_ROWS=16,
// via buildWall) -- fine for a handful of notes, but as more accumulate
// the fixed area just gets more crowded/overlapping instead of the wall
// growing. Now each note gets its own band, sized to comfortably fit a
// NOTE_WIDTH-ish card with room to breathe, and the wall's total height
// is simply notes.length * this -- it genuinely grows as more people
// place prayers, the way a real wall fills up and gets extended.
const NOTE_BAND_HEIGHT = 90;
// Minimum height so an empty or near-empty wall still fills the screen
// reasonably instead of rendering as a tiny sliver.
const WALL_MIN_HEIGHT = 640;

// "Prayer Wall that looks like the real Western Wall in Jerusalem... little
// bell sound when a prayer is received" (spec section 4/7/8). The
// background is a real, licensed photo (assets/textures/western-wall.jpg
// -- Adobe Stock asset #101981611, purchased/licensed; contrast/sharpen
// adjusted for more visible crack detail per denser-crevice request)
// tiled to fill the tall scrollable wall, not an illustration -- an earlier procedural
// SVG rendering (WesternWallBackground.tsx, kept only for its still-used
// WALL_WIDTH/mulberry32/hashStringToSeed exports) read as "cartoon" next
// to the rest of the app's real photography. Prayer notes (PrayerNote.tsx)
// are still positioned via the same seeded-by-id randomness that
// component's helpers provide -- only the visual backdrop changed, and
// (below) how the band each note lands in is chosen.
//
// Prayers here stay local-first/private by default -- a user must
// explicitly opt in to "Share publicly" for a note to ever leave their
// device. The Testimony Stream used to be the bottom half of this same
// screen; it's now its own full page (TestimonyStreamScreen), reached
// via the header button below, so it isn't squeezed into a half-height
// view and has room for tap-to-react emoji.
export default function PrayerWallScreen() {
  const { t } = useI18n();
  const { prayerNotes, addPrayerNote } = useApp();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [prayerText, setPrayerText] = useState('');
  const [prayerAnonymous, setPrayerAnonymous] = useState(true);
  const [prayerShared, setPrayerShared] = useState(false);
  const [openNote, setOpenNote] = useState<PrayerNoteType | null>(null);
  const wallScrollRef = useRef<ScrollView>(null);

  const wallHeight = Math.max(WALL_MIN_HEIGHT, prayerNotes.length * NOTE_BAND_HEIGHT + 40);

  // Oldest first, so a note's band index is purely a function of ITS OWN
  // age relative to notes that already existed when it was placed --
  // never affected by how many notes arrive afterward. `id` is a
  // Date.now() string (see handlePlacePrayer), so numeric comparison is
  // chronological. This is what keeps existing notes from visually
  // "jumping" every time someone places a new one and the wall grows.
  const positions = useMemo(() => {
    const oldestFirst = [...prayerNotes].sort((a, b) => Number(a.id) - Number(b.id));
    return oldestFirst.map((note, index) => {
      const rand = mulberry32(hashStringToSeed(note.id));
      const x = 8 + rand() * (WALL_WIDTH - NOTE_WIDTH - 16);
      const y = 20 + index * NOTE_BAND_HEIGHT + rand() * (NOTE_BAND_HEIGHT - 55);
      const rotateDeg = (rand() - 0.5) * 16;
      return { note, x, y, rotateDeg };
    });
  }, [prayerNotes]);

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

    // New notes land in the next band down (see NOTE_BAND_HEIGHT's own
    // comment) -- same seeded-by-id math as the `positions` memo above.
    // prayerNotes.length here is the count BEFORE this note is added,
    // which is exactly its band index once it's the newest/last note in
    // age order. Without this, a note placed off the current scroll
    // position is indistinguishable from "nothing happened," since the
    // Alert alone doesn't show *where* it went. Scroll it into view
    // (with a little headroom, not pinned to the very top) so placing a
    // prayer visibly does something.
    const rand = mulberry32(hashStringToSeed(note.id));
    rand(); // consumes the x draw first, matching the memo's draw order
    const y = 20 + prayerNotes.length * NOTE_BAND_HEIGHT + rand() * (NOTE_BAND_HEIGHT - 55);
    requestAnimationFrame(() => {
      wallScrollRef.current?.scrollTo({ y: Math.max(0, y - 150), animated: true });
    });

    Alert.alert(t.prayerWall.placed);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="hands-pray" size={16} color={Colors.royal} />
          <Text style={styles.headerTitle}>{t.prayerWall.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.testimonyLink}
          onPress={() => navigation.navigate('TestimonyStream')}
          accessibilityRole="button"
          accessibilityLabel="Open Testimony Stream"
        >
          <Ionicons name="sparkles" size={13} color={Colors.gold} />
          <Text style={styles.testimonyLinkText}>Testimony Stream</Text>
          <Ionicons name="chevron-forward" size={13} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView ref={wallScrollRef} style={styles.wallScrollView} contentContainerStyle={styles.wallScroll}>
        <View style={[styles.wallWrap, { height: wallHeight }]}>
          <ImageBackground
            source={require('../../assets/textures/western-wall.jpg')}
            style={StyleSheet.absoluteFill}
            resizeMode="repeat"
          />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFE7D6', borderWidth: 5, borderColor: Colors.royal },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: Colors.royal },
  testimonyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#2E1F16',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  testimonyLinkText: { color: Colors.gold, fontWeight: '700', fontSize: 11.5 },
  wallScrollView: { flex: 1 },
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
  placeBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
});
