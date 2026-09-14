import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PrayerNote as PrayerNoteType } from '../types';

interface Props {
  note: PrayerNoteType;
  x: number;
  y: number;
  rotateDeg: number;
  // First name to sign the note with; left off for anonymous prayers.
  signature?: string;
  onPress: () => void;
}

const NOTE_WIDTH = 108;
// Fixed, so PrayerWallScreen can give every note its own band on the wall
// without two notes overlapping.
const NOTE_HEIGHT = 66;
const HANDWRITING = Platform.select({ ios: 'Noteworthy', android: 'casual' });

// A folded paper note tucked into a crevice of the Western Wall background,
// like the prayer requests left in the Kotel's cracks. The prayer is written
// on the note itself -- its first lines in a handwritten face, signed unless
// it was placed anonymously -- and tapping it opens the whole prayer.
export default function PrayerNote({ note, x, y, rotateDeg, signature, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Prayer note: ${note.text}${signature ? `, from ${signature}` : ''}. Tap to read it all.`}
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
      <Text style={styles.text} numberOfLines={signature ? 2 : 3}>
        {note.text}
      </Text>
      {signature ? (
        <Text style={styles.signature} numberOfLines={1}>
          — {signature}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

export { NOTE_HEIGHT, NOTE_WIDTH };

const styles = StyleSheet.create({
  note: {
    position: 'absolute',
    width: NOTE_WIDTH,
    height: NOTE_HEIGHT,
    backgroundColor: '#FBF7EC',
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 5,
    justifyContent: 'space-between',
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
    width: 10,
    height: 10,
    backgroundColor: '#EDE4CC',
    borderBottomLeftRadius: 2,
  },
  text: {
    fontFamily: HANDWRITING,
    fontSize: 11.5,
    lineHeight: 15,
    color: '#3B3325',
    paddingRight: 6,
  },
  signature: {
    fontFamily: HANDWRITING,
    fontSize: 10,
    color: '#6B5E45',
    textAlign: 'right',
  },
});
