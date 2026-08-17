import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../../theme/colors';
import LanguagePicker from '../../components/LanguagePicker';
import { useI18n } from '../../i18n';
import { useApp } from '../../context/AppContext';
import type { LanguageCode } from '../../types';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'LanguageSelect'>;

export default function LanguageSelectScreen({ navigation }: Props) {
  const { language, setLanguage, t } = useI18n();
  const { markLanguageSelected } = useApp();
  const [selected, setSelected] = useState<LanguageCode>(language);

  const handleContinue = async () => {
    await setLanguage(selected);
    markLanguageSelected();
    navigation.replace('Disclaimer');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t.language.title}</Text>
      <Text style={styles.subtitle}>{t.language.subtitle}</Text>
      <LanguagePicker selected={selected} onSelect={setSelected} />
      <TouchableOpacity style={styles.cta} onPress={handleContinue}>
        <Text style={styles.ctaText}>{t.common.continue}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.royal, paddingTop: 32 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.ivory, paddingHorizontal: 20, marginBottom: 6 },
  subtitle: { fontSize: 13, color: Colors.muted, paddingHorizontal: 20, marginBottom: 20 },
  cta: {
    backgroundColor: Colors.gold,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: { color: Colors.goldDark, fontWeight: '800', fontSize: 16 },
});
