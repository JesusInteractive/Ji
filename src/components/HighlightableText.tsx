// Shared tap-to-highlight text wrapper -- used for both a Bible verse row
// (ScriptureSearchScreen.tsx) and a Journal paragraph chunk
// (JournalScreen.tsx's entry read view), so the apply/edit branching logic
// and color rendering exist in exactly one place. See HighlighterToolbar
// for the color picker this responds to, and HighlightEditSheet for what
// opens on `onEditExisting`.
import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import type { Highlight } from '../types';
import { HIGHLIGHT_COLOR_HEX } from './HighlighterToolbar';

interface Props {
  text: string;
  highlight: Highlight | undefined;
  activeColor: Highlight['color'] | null;
  onApply: () => void;
  onEditExisting: () => void;
  style?: StyleProp<TextStyle>;
  textProps?: Partial<React.ComponentProps<typeof Text>>;
}

export default function HighlightableText({ text, highlight, activeColor, onApply, onEditExisting, style, textProps }: Props) {
  const handlePress = () => {
    if (highlight) {
      onEditExisting();
    } else if (activeColor) {
      onApply();
    }
    // No highlight and no active pen: a plain tap does nothing -- this
    // component doesn't own any other tap behavior (e.g. favoriting),
    // callers that need that too should wrap this in their own
    // onLongPress handler, matching ScriptureSearchScreen's existing
    // long-press-to-favorite gesture living alongside this new one.
  };

  return (
    // Pressable, not TouchableOpacity -- see HomeScreen.tsx's own comment
    // on why this app's Mac/trackpad support leans on Pressable for small
    // interactive targets; TouchableOpacity's older gesture-responder
    // path was the reported cause of clicks not registering here on a
    // laptop trackpad.
    <Pressable
      onPress={handlePress}
      disabled={!highlight && !activeColor}
      style={highlight ? [styles.highlighted, { backgroundColor: HIGHLIGHT_COLOR_HEX[highlight.color] }] : undefined}
    >
      <Text style={style} {...textProps}>
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  highlighted: {
    borderRadius: 4,
    paddingHorizontal: 2,
  },
});
