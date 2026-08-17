import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LanguageCode } from '../types';
import { LANGUAGES } from '../i18n/languages';
import Colors from '../theme/colors';

interface Props {
  selected: LanguageCode;
  onSelect: (code: LanguageCode) => void;
}

export default function LanguagePicker({ selected, onSelect }: Props) {
  return (
    <FlatList
      data={LANGUAGES}
      keyExtractor={(item) => item.code}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.row, selected === item.code && styles.rowSelected]}
          onPress={() => onSelect(item.code)}
        >
          <View>
            <Text style={styles.native}>{item.nativeLabel}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
          {selected === item.code && <Ionicons name="checkmark-circle" size={22} color={Colors.gold} />}
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rowSelected: { borderColor: Colors.gold },
  native: { fontSize: 16, fontWeight: '600', color: Colors.ivory },
  label: { fontSize: 12, color: Colors.muted, marginTop: 2 },
});
