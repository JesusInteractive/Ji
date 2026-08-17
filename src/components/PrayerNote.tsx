import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import type { PrayerNote as PrayerNoteType } from '../types';

interface Props {
  note: PrayerNoteType;
  x: number;
  y: number;
  rotateDeg: number;
  onPress: () => void;
}

const NOTE_WIDTH = 46;

// A small folded paper note tucked into a crevice of the Western Wall
// background (see WesternWallBackground.tsx) -- this is how real prayer
// requests sit in the Kotel's cracks, not as big individual "stone cards."
// Tap to read the full text.
export default function PrayerNote({ note, x, y, rotateDeg, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={note.isAnonymous ? 'Anonymous prayer note, tap to read' : 'Prayer note, tap to read'}
      style={[
        styles.note,
        {
          left: x,
          top: y,
          transform: [{ rotate: `${rotateDeg}deg` }],
        },
      ]}
    >
      <View style={styles.fold} />
      {/* Notes are folded closed, like real ones in the Wall's crevices --
          tap to unfold and read rather than showing a tiny illegible
          preview here. */}
    </TouchableOpacity>
  );
}

export { NOTE_WIDTH };

const styles = StyleSheet.create({
  note: {
    position: 'absolute',
    width: NOTE_WIDTH,
    minHeight: 36,
    backgroundColor: '#FBF7EC',
    borderRadius: 2,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 1.5,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#D8CBA9',
  },
  fold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    backgroundColor: '#EDE4CC',
    borderBottomLeftRadius: 2,
  },
});
