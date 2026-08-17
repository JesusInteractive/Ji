import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { useI18n } from '../i18n';
import HomeScreen from '../screens/HomeScreen';
import ChatStack from './ChatStack';
import PrayerWallScreen from '../screens/PrayerWallScreen';
import ScriptureSearchScreen from '../screens/ScriptureSearchScreen';
import JournalScreen from '../screens/JournalScreen';
import StudyToolsScreen from '../screens/StudyToolsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsStack, { type SettingsStackParamList } from './SettingsStack';
import { withFadeIn } from './withFadeIn';

// Wrapped once here rather than inline in the JSX below, so each stays a
// stable component reference across renders (an inline wrap on every
// render would remount the screen -- and lose its state -- every time
// MainTabs re-renders).
const FadedHome = withFadeIn(HomeScreen);
const FadedChatStack = withFadeIn(ChatStack);
const FadedPrayerWall = withFadeIn(PrayerWallScreen);
const FadedBible = withFadeIn(ScriptureSearchScreen);
const FadedJournal = withFadeIn(JournalScreen);
const FadedStudyTools = withFadeIn(StudyToolsScreen);
const FadedProfile = withFadeIn(ProfileScreen);
const FadedSettingsStack = withFadeIn(SettingsStack);

export type MainTabParamList = {
  HomeTab: undefined;
  ChatTab: undefined;
  PrayerWall: undefined;
  Bible: undefined;
  Journal: undefined;
  StudyTools: undefined;
  Profile: undefined;
  // Allows jumping directly into a screen nested inside the Settings
  // stack (e.g. ProfileScreen linking straight to TokenGift) from a
  // sibling tab, not just landing on the stack's own home screen.
  SettingsTab: NavigatorScreenParams<SettingsStackParamList> | undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  HomeTab: 'home',
  ChatTab: 'chatbubble-ellipses',
  PrayerWall: 'hand-left',
  Bible: 'book',
  Journal: 'journal',
  StudyTools: 'library',
  Profile: 'person-circle',
  SettingsTab: 'settings',
};

export default function MainTabs() {
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: { backgroundColor: Colors.royal, borderTopColor: Colors.royalLight },
        tabBarIcon: ({ color, size }) => (
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
        component={FadedStudyTools}
        options={{
          title: t.tabs.studyTools,
          headerShown: true,
          headerTintColor: Colors.royal,
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
      <Tab.Screen name="SettingsTab" component={FadedSettingsStack} options={{ title: t.tabs.settings }} />
    </Tab.Navigator>
  );
}
