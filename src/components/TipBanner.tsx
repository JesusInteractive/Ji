import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../theme/colors';

interface Props {
  storageKey: string;
  text: string;
}

// Light, non-intrusive first-time guidance (spec requirement 7): a
// dismissible banner shown once per screen, remembered in AsyncStorage so
// it never nags a returning user. Deliberately not a multi-step guided
// tour/overlay -- those are easy to build annoyingly; a one-line tip that
// goes away for good reads as more respectful of the user's attention.
export default function TipBanner({ storageKey, text }: Props) {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((seen) => setVisible(!seen))
      .finally(() => setChecked(true));
  }, [storageKey]);

  const dismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(storageKey, '1').catch(() => {});
  };

  if (!checked || !visible) return null;

  return (
    <View style={styles.banner} accessibilityRole="text">
      <Ionicons name="bulb-outline" size={16} color={Colors.gold} style={{ marginTop: 1 }} />
      <Text style={styles.text}>{text}</Text>
      <TouchableOpacity onPress={dismiss} accessibilityRole="button" accessibilityLabel="Dismiss tip" hitSlop={8}>
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
