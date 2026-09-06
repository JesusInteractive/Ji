import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';

interface Props {
  visible: boolean;
  text: string;
  onDismiss: () => void;
}

// Light, non-intrusive guidance (spec requirement 7): a dismissible
// banner the caller fully controls. ChatScreen.tsx's usage shows this
// again every time the chat screen gains focus and hides it once the
// user sends their first question that visit -- a "remind me each time,
// but don't nag mid-conversation" pattern, not a one-time-forever
// dismissal (this used to persist "seen" to AsyncStorage; that's gone
// now that the only caller wants it to reappear on every visit instead).
export default function TipBanner({ visible, text, onDismiss }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.banner} accessibilityRole="text">
      <Ionicons name="bulb-outline" size={16} color={Colors.gold} style={{ marginTop: 1 }} />
      <Text style={styles.text}>{text}</Text>
      <TouchableOpacity onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss tip" hitSlop={8}>
        <Ionicons name="close" size={16} color="#8A8474" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF7DE',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0E2B0',
  },
  text: { flex: 1, fontSize: 12, lineHeight: 17, color: '#6B5D2E' },
});
