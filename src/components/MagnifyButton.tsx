import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { useApp, TEXT_ZOOM_LEVELS } from '../context/AppContext';

// Accessibility zoom for reading-heavy screens -- see AppContext's
// textZoom comment. A single shared floating control so it looks and
// behaves identically everywhere it appears (Scripture, Chat, Study
// Tools). Originally cycled 1 -> 1.2 -> 1.4 -> 1.6 -> back to 1 on a
// single tap, but that meant "undoing" a zoom took up to 3 taps and
// wasn't obvious -- a dedicated minus button (shown once zoomed in) is
// the direct way back down, one level at a time.
const ZOOM_LEVELS = TEXT_ZOOM_LEVELS;

interface Props {
  // Lets screens with their own bottom-anchored controls (e.g. Chat's
  // input row/send button) push this above them instead of overlapping.
  style?: StyleProp<ViewStyle>;
}

export default function MagnifyButton({ style }: Props) {
  const { textZoom, setTextZoom } = useApp();

  const currentIndex = Math.max(0, ZOOM_LEVELS.indexOf(textZoom));
  const isZoomedIn = textZoom > 1;

  const zoomIn = () => {
    const nextIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1);
    setTextZoom(ZOOM_LEVELS[nextIndex]);
  };

  const zoomOut = () => {
    const nextIndex = Math.max(currentIndex - 1, 0);
    setTextZoom(ZOOM_LEVELS[nextIndex]);
  };

  return (
    <View style={[styles.button, isZoomedIn && styles.buttonActive, style]}>
      {isZoomedIn && (
        <TouchableOpacity
          onPress={zoomOut}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
          accessibilityLabel="Zoom out"
          accessibilityHint="Decreases text size by one step"
        >
          <Ionicons name="remove" size={20} color={Colors.white} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={zoomIn}
        hitSlop={{ top: 8, bottom: 8, left: isZoomedIn ? 4 : 8, right: 8 }}
        accessibilityLabel="Zoom text size"
        accessibilityHint="Increases text size by one step"
      >
        <Ionicons name="search" size={20} color={isZoomedIn ? Colors.white : Colors.royal} />
      </TouchableOpacity>
      {isZoomedIn && <Text style={styles.label}>{Math.round(textZoom * 100)}%</Text>}
    </View>
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
