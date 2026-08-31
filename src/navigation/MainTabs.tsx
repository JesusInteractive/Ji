import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { useI18n } from '../i18n';
import HomeScreen from '../screens/HomeScreen';
import ChatStack, { type ChatStackParamList } from './ChatStack';
import PrayerWallScreen from '../screens/PrayerWallScreen';
import ScriptureSearchScreen from '../screens/ScriptureSearchScreen';
import JournalScreen from '../screens/JournalScreen';
import StudyToolsStack from './StudyToolsStack';
import ProfileScreen from '../screens/ProfileScreen';
import DailyDevotionsScreen from '../screens/DailyDevotionsScreen';
import SettingsStack, { type SettingsStackParamList } from './SettingsStack';
import { withFadeIn } from './withFadeIn';
import DedicationFooter from '../components/DedicationFooter';

// Wrapped once here rather than inline in the JSX below, so each stays a
// stable component reference across renders (an inline wrap on every
// render would remount the screen -- and lose its state -- every time
// MainTabs re-renders).
const FadedHome = withFadeIn(HomeScreen);
const FadedChatStack = withFadeIn(ChatStack);
const FadedPrayerWall = withFadeIn(PrayerWallScreen);
const FadedBible = withFadeIn(ScriptureSearchScreen);
const FadedJournal = withFadeIn(JournalScreen);
const FadedStudyToolsStack = withFadeIn(StudyToolsStack);
const FadedProfile = withFadeIn(ProfileScreen);
const FadedDailyDevotions = withFadeIn(DailyDevotionsScreen);
const FadedSettingsStack = withFadeIn(SettingsStack);

export type MainTabParamList = {
  HomeTab: undefined;
  // Allows jumping directly into a screen nested inside the Chat stack
  // (e.g. ProfileScreen linking straight to Favorites) from a sibling
  // tab, same pattern as SettingsTab below.
  ChatTab: NavigatorScreenParams<ChatStackParamList> | undefined;
  PrayerWall: undefined;
  // GlobalLibraryScreen (Study Tools > Bible Library) deep-links here
  // with a specific translation id when the user taps a Bible in their
  // language -- undefined for the normal tab-bar tap, which keeps
  // whatever translation was last selected (see ScriptureSearchScreen).
  Bible: { translationId?: string } | undefined;
  Journal: undefined;
  StudyTools: undefined;
  Profile: undefined;
  DailyDevotions: undefined;
  // Allows jumping directly into a screen nested inside the Settings
  // stack (e.g. ProfileScreen linking straight to TokenGift) from a
  // sibling tab, not just landing on the stack's own home screen.
  SettingsTab: NavigatorScreenParams<SettingsStackParamList> | undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  HomeTab: 'home',
  ChatTab: 'chatbubble-ellipses',
  // Rendered via MaterialCommunityIcons instead (cupped praying hands,
  // not a single raised hand) -- see tabBarIcon below. Kept here too
  // just so this Record stays total over every tab; never actually read.
  PrayerWall: 'hand-left',
  Bible: 'book',
  Journal: 'journal',
  StudyTools: 'library',
  Profile: 'person-circle',
  DailyDevotions: 'sunny',
  SettingsTab: 'settings',
};

export default function MainTabs() {
  const { t } = useI18n();

  return (
    <View style={{ flex: 1 }}>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: { backgroundColor: Colors.royal, borderTopColor: Colors.royalLight },
        tabBarIcon: ({ color, size }) =>
          route.name === 'PrayerWall' ? (
            <MaterialCommunityIcons name="hands-pray" size={size} color={color} />
          ) : (
            <Ionicons name={ICONS[route.name as keyof MainTabParamList]} size={size} color={color} />
          ),
      })}
    >
      <Tab.Screen name="HomeTab" component={FadedHome} options={{ title: t.tabs.home }} />
      <Tab.Screen name="ChatTab" component={FadedChatStack} options={{ title: t.tabs.chat }} />
      <Tab.Screen name="PrayerWall" component={FadedPrayerWall} options={{ title: t.tabs.prayerWall }} />
      <Tab.Screen name="Bible" component={FadedBible} options={{ title: t.tabs.bible }} />
      <Tab.Screen name="Journal" component={FadedJournal} options={{ title: t.tabs.journal }} />
      <Tab.Screen
        name="StudyTools"
        component={FadedStudyToolsStack}
        options={{
          title: t.tabs.studyTools,
          headerShown: false,
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={FadedProfile}
        options={{
          title: t.tabs.profile,
          headerShown: true,
          headerTintColor: Colors.royal,
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="DailyDevotions"
        component={FadedDailyDevotions}
        options={{
          title: t.tabs.devotions,
          headerShown: true,
          headerTintColor: Colors.royal,
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen name="SettingsTab" component={FadedSettingsStack} options={{ title: t.tabs.settings }} />
    </Tab.Navigator>
    <DedicationFooter />
    </View>
  );
}
