import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { useLiveRadioPlayback } from '../context/LiveRadioPlaybackContext';

// Standard iOS bottom-tab-bar content height (excludes the home-indicator
// safe area, added separately via insets.bottom below) -- matches what
// MainTabs' own Tab.Navigator renders, so the mini-bar sits flush above
// it instead of overlapping or leaving a gap.
const TAB_BAR_HEIGHT = 49;

// Rendered once in MainTabs.tsx, same placement RadioContext/RadioOverlay
// used before -- so this survives tab switches, matching
// LiveRadioPlaybackContext's one-instance-for-the-session AudioPlayer.
// Only shows once something has actually started playing (stationName
// set) -- unlike the old WebView version, there's no persistent "now
// playing" full-screen state to manage here, just a slim bar.
export default function RadioOverlay() {
  const { isPlaying, isBuffering, stationName, pause } = useLiveRadioPlayback();
  const insets = useSafeAreaInsets();

  if (!stationName || !isPlaying) return null;

  return (
    <TouchableOpacity
      style={[styles.miniBar, { bottom: TAB_BAR_HEIGHT + insets.bottom }]}
      onPress={pause}
      accessibilityRole="button"
      accessibilityLabel={`Pause ${stationName}`}
    >
      {isBuffering ? (
        <ActivityIndicator size="small" color={Colors.gold} />
      ) : (
        <View style={styles.liveDot} />
      )}
      <Ionicons name="radio" size={18} color={Colors.gold} />
      <Text style={styles.miniBarText} numberOfLines={1}>
        {stationName} -- Live
      </Text>
      <Ionicons name="pause-circle" size={22} color="rgba(255,255,255,0.9)" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  miniBar: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.royal,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 40,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4ADE80',
  },
  miniBarText: { flex: 1, color: Colors.white, fontWeight: '700', fontSize: 13.5 },
});
