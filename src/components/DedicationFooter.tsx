import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import Colors from '../theme/colors';

// A quiet, permanent dedication line -- rendered once here (MainTabs.tsx),
// not per-screen, so it's guaranteed identical and never forgotten on a
// new screen. Absolutely positioned + pointerEvents="none" so it never
// takes up layout space or intercepts a touch -- it just sits in the
// safe-area sliver below the tab bar's icons, which is otherwise empty
// background on every device.
//
// Inter is loaded here at runtime via useFonts(), not through the
// expo-font config plugin in app.json -- an earlier attempt at the
// config-plugin route crashed `expo start` entirely (its Android plugin
// expects a different fonts[] shape than what was written, and getting
// iOS's side right too means matching each .ttf's own internal
// PostScript name, not an arbitrary family string). useFonts() sidesteps
// all of that: it works in Expo Go with no native rebuild, and the
// family name is whatever we call it here, not whatever's baked into
// the font file.
export default function DedicationFooter() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
  });

  return (
    <Text
      style={[
        styles.text,
        { bottom: insets.bottom > 0 ? insets.bottom * 0.18 : 1 },
        fontsLoaded && styles.textLoaded,
      ]}
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
  // Applied once Inter has actually loaded -- until then this renders in
  // the default system font rather than a blank/tofu glyph.
  textLoaded: {
    fontFamily: 'Inter-Medium',
  },
});
