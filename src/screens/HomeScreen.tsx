import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import { useI18n } from '../i18n';
import type { MainTabParamList } from '../navigation/MainTabs';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { getDailyPromise, type DailyPromise } from '../services/devotions';
import { ABOUT_APP, ABOUT_APP_CARD } from '../constants/aboutApp';

const QUICK_LINKS: {
  tab: Exclude<keyof MainTabParamList, 'HomeTab' | 'Profile'>;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: 'chat' | 'prayerWall' | 'bible' | 'journal' | 'studyTools' | 'devotions';
}[] = [
  { tab: 'ChatTab', icon: 'chatbubble-ellipses', labelKey: 'chat' },
  { tab: 'PrayerWall', icon: 'hand-left', labelKey: 'prayerWall' },
  { tab: 'Bible', icon: 'book', labelKey: 'bible' },
  { tab: 'Journal', icon: 'journal', labelKey: 'journal' },
  { tab: 'StudyTools', icon: 'library', labelKey: 'studyTools' },
  // Was Profile's grid spot -- Profile moved to a header icon (top-right,
  // next to the title) so this spot could go to the planned devotional
  // feature instead. See DailyDevotionsScreen.tsx.
  { tab: 'DailyDevotions', icon: 'sunny', labelKey: 'devotions' },
];

// Same default translation the rest of the app's devotional features use
// (see services/devotions.ts) -- keeps this card's text in the same
// translation as everything else, even though it no longer links to the
// full devotion.
const DEFAULT_TRANSLATION_ID = 'BSB';

// Matthew 7:7 -- shown until the real daily promise loads, and again if
// fetching it fails for any reason (offline, API hiccup). Never leaves
// this card blank or erroring; worst case it's just not "today's"
// promise specifically.
const FALLBACK_PROMISE: DailyPromise = {
  day: 0,
  reference: 'Matthew 7:7',
  text: "Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.",
};

export default function HomeScreen() {
  const { t } = useI18n();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [dailyPromise, setDailyPromise] = useState<DailyPromise>(FALLBACK_PROMISE);

  useEffect(() => {
    let cancelled = false;
    getDailyPromise(DEFAULT_TRANSLATION_ID)
      .then((promise) => {
        if (!cancelled) setDailyPromise(promise);
      })
      .catch(() => {
        // Stay on FALLBACK_PROMISE -- see its own comment.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t.home.title}</Text>
          <Text style={styles.subtitle}>{t.home.subtitle}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel={t.tabs.profile}
        >
          <Ionicons name="person-circle" size={34} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {QUICK_LINKS.map(({ tab, icon, labelKey }) => (
          <TouchableOpacity
            key={tab}
            style={styles.card}
            onPress={() => navigation.navigate(tab)}
            accessibilityRole="button"
            accessibilityLabel={t.tabs[labelKey]}
          >
            {tab === 'PrayerWall' ? (
              <MaterialCommunityIcons name="hands-pray" size={32} color={Colors.gold} />
            ) : (
              <Ionicons name={icon} size={32} color={Colors.gold} />
            )}
            <Text style={styles.cardLabel}>{t.tabs[labelKey]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View
        style={styles.verseCard}
        accessibilityLabel={`Today's promise, ${dailyPromise.reference}`}
      >
        <View style={styles.verseCardLabel}>
          <Ionicons name="sunny" size={13} color={Colors.gold} />
          <Text style={styles.verseCardLabelText}>Today's Promise</Text>
        </View>
        <Text style={styles.verseText}>"{dailyPromise.text}"</Text>
        <Text style={styles.verseRef}>{dailyPromise.reference}</Text>
      </View>

      <TouchableOpacity
        style={styles.aboutCard}
        onPress={() =>
          // Navigates up to the root stack's own "AboutApp" modal (see
          // RootNavigator.tsx) rather than pushing into SettingsStack --
          // that used to leave the Settings tab's own stack parked on
          // this screen, so switching tabs away and back to Settings
          // reopened this instead of the settings list.
          navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('AboutApp', ABOUT_APP)
        }
        accessibilityRole="button"
        accessibilityLabel={`${ABOUT_APP_CARD.title} -- ${ABOUT_APP_CARD.subtitle}`}
      >
        <Ionicons name="apps-outline" size={18} color={Colors.gold} />
        <View style={{ flex: 1 }}>
          <Text style={styles.aboutCardTitle}>{ABOUT_APP_CARD.title}</Text>
          <Text style={styles.aboutCardSubtitle}>{ABOUT_APP_CARD.subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
      </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
  },
  profileBtn: {
    marginLeft: 12,
    marginTop: 2,
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
  verseCard: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  aboutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    backgroundColor: Colors.royalLight,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  aboutCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ivory,
  },
  aboutCardSubtitle: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  verseCardLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 10,
  },
  verseCardLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  verseText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
    color: Colors.ivory,
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
