// Bottom-sheet shown when the user taps an EXISTING highlight (as opposed
// to applying a new one) -- change its color or remove it. Same
// transparent-Modal-with-bottom-sheet shape ScriptureSearchScreen's own
// translation picker uses, kept self-contained here since this is a
// shared component (Bible screen + Journal both mount one instance).
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import type { Highlight } from '../types';
import HighlighterToolbar from './HighlighterToolbar';

interface Props {
  highlight: Highlight | null;
  onChangeColor: (id: string, color: Highlight['color']) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export default function HighlightEditSheet({ highlight, onChangeColor, onRemove, onClose }: Props) {
  return (
    <Modal visible={!!highlight} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Highlight</Text>
          {highlight && (
            <HighlighterToolbar
              activeColor={highlight.color}
              onSelectColor={(color) => {
                if (color) onChangeColor(highlight.id, color);
              }}
            />
          )}
          <TouchableOpacity
            style={styles.removeRow}
            onPress={() => highlight && onRemove(highlight.id)}
            accessibilityRole="button"
            accessibilityLabel="Remove highlight"
          >
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            <Text style={styles.removeText}>Remove highlight</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18,
    paddingTop: 16, paddingBottom: 32, paddingHorizontal: 20,
  },
  title: { fontSize: 16, fontWeight: '800', color: Colors.royal, marginBottom: 10 },
  removeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, marginTop: 8,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  removeText: { fontSize: 14.5, fontWeight: '600', color: Colors.danger },
});
