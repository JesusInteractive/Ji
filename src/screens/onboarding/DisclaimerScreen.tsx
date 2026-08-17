import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../../theme/colors';
import { useI18n } from '../../i18n';
import { useApp } from '../../context/AppContext';
import { AI_DISCLOSURE } from '../../constants/legal';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Disclaimer'>;

// Mandatory disclaimer users must read and explicitly accept before
// entering the app (spec section 3) -- required checkbox, no skip.
export default function DisclaimerScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { acceptDisclosure } = useApp();
  const [checked, setChecked] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleContinue = () => {
    if (!checked) {
      setShowError(true);
      return;
    }
    acceptDisclosure();
    navigation.replace('UserAgreement');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{AI_DISCLOSURE.title}</Text>
        {AI_DISCLOSURE.body.map((p, i) => (
          <Text key={i} style={styles.paragraph}>{p}</Text>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => { setChecked((c) => !c); setShowError(false); }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={t.disclaimer.checkbox}
        >
          <Ionicons
            name={checked ? 'checkbox' : 'square-outline'}
            size={22}
            color={checked ? Colors.gold : Colors.muted}
          />
          <Text style={styles.checkboxLabel}>{t.disclaimer.checkbox}</Text>
        </TouchableOpacity>
        {showError && <Text style={styles.error}>Please check the box to continue.</Text>}

        <TouchableOpacity style={styles.cta} onPress={handleContinue}>
          <Text style={styles.ctaText}>{t.common.continue}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  scroll: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.royal, marginBottom: 14 },
  paragraph: { fontSize: 14, lineHeight: 21, color: Colors.ink, marginBottom: 12 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5DCC3',
    backgroundColor: Colors.ivory,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxLabel: { flex: 1, fontSize: 13.5, color: Colors.ink, lineHeight: 19 },
  error: { color: Colors.danger, fontSize: 12, marginTop: 8 },
  cta: {
    backgroundColor: Colors.royal,
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  ctaText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
});
