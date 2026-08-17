import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../theme/colors';
import type { PrayerNote } from '../types';

interface Props {
  note: PrayerNote;
}

// One "stone" of the Wailing-Wall-style Prayer Wall (spec section 4/7):
// large limestone blocks with crevices where a prayer note tucks in.
export default function PrayerStone({ note }: Props) {
  return (
    <View style={styles.stone}>
      <View style={styles.crevice} />
      <Text style={styles.text} numberOfLines={4}>
        {note.text}
      </Text>
      {!note.isAnonymous && note.sharedPublicly && (
        <Text style={styles.meta}>shared</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stone: {
    backgroundColor: Colors.stone,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.stoneShadow,
    padding: 14,
    margin: 6,
    width: 150,
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  crevice: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: Colors.stoneShadow,
    opacity: 0.6,
    borderRadius: 1,
  },
  text: {
    marginTop: 10,
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.ink,
  },
  meta: {
    marginTop: 8,
    fontSize: 10,
    color: Colors.royal,
    fontWeight: '600',
  },
});
