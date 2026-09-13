import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// The visible "AI-generated" marker that the AI Disclosure (section 6)
// promises on every AI response, and that App Store / Google Play policy
// expects. One component so the wording and look stay identical across
// Ask Jesus, the Sermon Writer, Daily Devotions, and the Gospel Translator.
interface Props {
  // Defaults to just "AI-generated"; screens pass a fuller sentence where
  // the context needs one (e.g. "review before you preach").
  text?: string;
  // 'dark' for light text on the navy screens (Gospel Translator).
  tone?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
}

export default function AiGeneratedLabel({ text = 'AI-generated', tone = 'light', style }: Props) {
  const color = tone === 'dark' ? 'rgba(255,255,255,0.72)' : '#8A8474';
  return (
    <View style={[styles.row, style]} accessible accessibilityLabel={text}>
      <Ionicons name="sparkles-outline" size={12} color={color} />
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  text: { flexShrink: 1, fontSize: 11.5, fontWeight: '600', letterSpacing: 0.2 },
});
