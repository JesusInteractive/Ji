import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { useApp } from '../context/AppContext';

// Accessibility zoom for reading-heavy screens -- see AppContext's
// textZoom comment. A single shared floating button so the control looks
// and behaves identically everywhere it appears (Scripture, Chat, Study
// Tools). Cycles 1 -> 1.2 -> 1.4 -> 1.6 -> back to 1 on each tap.
const ZOOM_LEVELS = [1, 1.2, 1.4, 1.6];

interface Props {
  // Lets screens with their own bottom-anchored controls (e.g. Chat's
  // input row/send button) push this above them instead of overlapping.
  style?: StyleProp<ViewStyle>;
}

export default function MagnifyButton({ style }: Props) {
  const { textZoom, setTextZoom } = useApp();

  const handlePress = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(textZoom);
    const nextIndex = currentIndex === -1 || currentIndex === ZOOM_LEVELS.length - 1 ? 0 : currentIndex + 1;
    setTextZoom(ZOOM_LEVELS[nextIndex]);
  };

  const isZoomedIn = textZoom > 1;

  return (
    <TouchableOpacity
      style={[styles.button, isZoomedIn && styles.buttonActive, style]}
      onPress={handlePress}
      accessibilityLabel="Zoom text size"
      accessibilityHint="Cycles through larger text sizes for easier reading"
    >
      <Ionicons name="search" size={20} color={isZoomedIn ? Colors.white : Colors.royal} />
      {isZoomedIn && <Text style={styles.label}>{Math.round(textZoom * 100)}%</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 50,
  },
  buttonActive: {
    backgroundColor: Colors.royal,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
});
