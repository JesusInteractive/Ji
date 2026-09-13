// The pen-color picker shared by the Bible screen and Journal's entry
// read view (see HighlightableText.tsx and HighlightEditSheet.tsx, which
// reuses this same row internally). Purely a color chooser -- it holds no
// highlight data itself, the screen owns `activeColor` and passes it down,
// same lifted-state shape ScriptureSearchScreen already uses for its
// translation/filter pickers.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { HighlightColor } from '../types';

// Literal pigment hex values, not the app's royal/gold brand palette --
// these are the actual highlighter colors the user picks between, not a
// brand accent.
export const HIGHLIGHT_COLOR_HEX: Record<HighlightColor, string> = {
  yellow: '#F5E663',
  green: '#8CE08C',
  blue: '#8FC7F2',
  pink: '#F5A0C2',
  orange: '#F5B25C',
};

const COLORS: HighlightColor[] = ['yellow', 'green', 'blue', 'pink', 'orange'];

interface Props {
  activeColor: HighlightColor | null;
  onSelectColor: (color: HighlightColor | null) => void;
}

export default function HighlighterToolbar({ activeColor, onSelectColor }: Props) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Highlighter pen color">
      {COLORS.map((color) => {
        const isActive = activeColor === color;
        return (
          // Pressable, not TouchableOpacity -- see HomeScreen.tsx's own
          // comment on why this app's Mac/trackpad support leans on
          // Pressable for small interactive targets like this 28x28 dot.
          <Pressable
            key={color}
            onPress={() => onSelectColor(isActive ? null : color)}
            accessibilityRole="button"
            accessibilityLabel={`${color} highlighter${isActive ? ', active' : ''}`}
            style={[styles.dot, { backgroundColor: HIGHLIGHT_COLOR_HEX[color] }, isActive && styles.dotActive]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 6 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dotActive: {
    borderColor: '#04081A',
    transform: [{ scale: 1.15 }],
  },
});
