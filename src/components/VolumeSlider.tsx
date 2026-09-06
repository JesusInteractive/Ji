// A plain horizontal volume slider (tap-to-set, drag-to-adjust) built on
// PanResponder -- the same "no extra native dependency" approach
// DraggableScrollbar.tsx already uses for its own thumb, rather than
// pulling in @react-native-community/slider (a new native module would
// mean another full rebuild/re-signing cycle for both platforms, which
// isn't worth it for a single slider).
import React, { useCallback, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';

interface Props {
  value: number; // 0..1
  onChange: (v: number) => void;
}

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 22;

export default function VolumeSlider({ value, onChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const valueFromLocalX = useCallback((localX: number) => {
    const width = trackWidthRef.current;
    if (width <= 0) return 0;
    return Math.min(Math.max(localX / width, 0), 1);
  }, []);

  // Grant AND move both resolve directly from the touch's own x position
  // within the track (not a relative delta) -- a volume bar is a plain
  // "tap/drag to this exact spot" control, unlike DraggableScrollbar's
  // thumb (which tracks relative finger movement from wherever it was
  // grabbed) since a scrollbar thumb isn't already sitting under the
  // finger the way a slider fill's edge is expected to be.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => onChangeRef.current(valueFromLocalX(evt.nativeEvent.locationX)),
      onPanResponderMove: (evt) => onChangeRef.current(valueFromLocalX(evt.nativeEvent.locationX)),
    })
  ).current;

  const fillWidth = trackWidth * value;

  return (
    <View style={styles.row}>
      <Ionicons name="volume-low-outline" size={18} color="rgba(255,255,255,0.7)" />
      <View
        style={styles.track}
        onLayout={(e) => {
          trackWidthRef.current = e.nativeEvent.layout.width;
          setTrackWidth(e.nativeEvent.layout.width);
        }}
        {...panResponder.panHandlers}
      >
        <View style={styles.trackBg} />
        <View style={[styles.trackFill, { width: fillWidth }]} />
        <View style={[styles.thumb, { left: Math.max(fillWidth - THUMB_SIZE / 2, 0) }]} />
      </View>
      <Ionicons name="volume-high-outline" size={18} color="rgba(255,255,255,0.7)" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  track: { flex: 1, height: THUMB_SIZE, justifyContent: 'center' },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: Colors.gold,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});
