import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Colors from '../theme/colors';
import { useI18n } from '../i18n';
import type { MainTabParamList } from '../navigation/MainTabs';

const QUICK_LINKS: {
  tab: Exclude<keyof MainTabParamList, 'HomeTab'>;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: 'chat' | 'prayerWall' | 'bible' | 'journal' | 'studyTools' | 'profile';
}[] = [
  { tab: 'ChatTab', icon: 'chatbubble-ellipses', labelKey: 'chat' },
  { tab: 'PrayerWall', icon: 'hand-left', labelKey: 'prayerWall' },
  { tab: 'Bible', icon: 'book', labelKey: 'bible' },
  { tab: 'Journal', icon: 'journal', labelKey: 'journal' },
  { tab: 'StudyTools', icon: 'library', labelKey: 'studyTools' },
  { tab: 'Profile', icon: 'person-circle', labelKey: 'profile' },
];

export default function HomeScreen() {
  const { t } = useI18n();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t.home.title}</Text>
      <Text style={styles.subtitle}>{t.home.subtitle}</Text>

      <View style={styles.grid}>
        {QUICK_LINKS.map(({ tab, icon, labelKey }) => (
          <TouchableOpacity
            key={tab}
            style={styles.card}
            onPress={() => navigation.navigate(tab)}
            accessibilityRole="button"
            accessibilityLabel={t.tabs[labelKey]}
          >
            <Ionicons name={icon} size={32} color={Colors.gold} />
            <Text style={styles.cardLabel}>{t.tabs[labelKey]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.verseText}>
        "Ask and it will be given to you; seek and you will find; knock and the door will be opened to you."
      </Text>
      <Text style={styles.verseRef}>Matthew 7:7</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.royal,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.ivory,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.muted,
    marginTop: 6,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    width: '47%',
    backgroundColor: Colors.royalLight,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.ivory,
  },
  verseText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
    color: Colors.ivory,
    marginTop: 36,
    paddingHorizontal: 12,
  },
  verseRef: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.gold,
    marginTop: 8,
    letterSpacing: 0.3,
  },
});
