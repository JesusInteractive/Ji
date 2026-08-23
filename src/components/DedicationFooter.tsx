import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../theme/colors';

// A quiet, permanent dedication line -- rendered once here (MainTabs.tsx),
// not per-screen, so it's guaranteed identical and never forgotten on a
// new screen. Absolutely positioned + pointerEvents="none" so it never
// takes up layout space or intercepts a touch -- it just sits in the
// safe-area sliver below the tab bar's icons, which is otherwise empty
// background on every device.
export default function DedicationFooter() {
  const insets = useSafeAreaInsets();

  return (
    <Text
      style={[styles.text, { bottom: insets.bottom > 0 ? insets.bottom * 0.18 : 1 }]}
      pointerEvents="none"
      numberOfLines={1}
    >
      Dedicated to Jesus for His glory.
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 9.5,
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: 0.3,
    // A softened, lower-opacity gold rather than the brand's full-strength
    // Colors.gold -- at this size, full saturation reads as a label
    // fighting for attention; muting it is what makes it read as quiet
    // and reverent instead.
    color: Colors.gold,
    opacity: 0.4,
  },
});
