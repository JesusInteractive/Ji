import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { useI18n } from '../i18n';
import HomeScreen from '../screens/HomeScreen';
import ChatStack, { type ChatStackParamList } from './ChatStack';
import PrayerWallScreen from '../screens/PrayerWallScreen';
import TestimonyStreamScreen from '../screens/TestimonyStreamScreen';
import ScriptureSearchScreen from '../screens/ScriptureSearchScreen';
import JournalScreen from '../screens/JournalScreen';
import StudyToolsStack from './StudyToolsStack';
import GamesStack from './GamesStack';
import ProfileScreen from '../screens/ProfileScreen';
import DailyDevotionsScreen from '../screens/DailyDevotionsScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsStack, { type SettingsStackParamList } from './SettingsStack';
import { withFadeIn } from './withFadeIn';
import DedicationFooter from '../components/DedicationFooter';
import RadioOverlay from '../components/RadioOverlay';

// Wrapped once here rather than inline in the JSX below, so each stays a
// stable component reference across renders (an inline wrap on every
// render would remount the screen -- and lose its state -- every time
// MainTabs re-renders).
const FadedHome = withFadeIn(HomeScreen);
const FadedChatStack = withFadeIn(ChatStack);
const FadedPrayerWall = withFadeIn(PrayerWallScreen);
const FadedTestimonyStream = withFadeIn(TestimonyStreamScreen);
const FadedBible = withFadeIn(ScriptureSearchScreen);
const FadedJournal = withFadeIn(JournalScreen);
const FadedStudyToolsStack = withFadeIn(StudyToolsStack);
const FadedGamesStack = withFadeIn(GamesStack);
const FadedProfile = withFadeIn(ProfileScreen);
const FadedDailyDevotions = withFadeIn(DailyDevotionsScreen);
const FadedLibrary = withFadeIn(LibraryScreen);
const FadedSettingsStack = withFadeIn(SettingsStack);

export type MainTabParamList = {
  HomeTab: undefined;
  // Allows jumping directly into a screen nested inside the Chat stack
  // (e.g. ProfileScreen linking straight to Favorites) from a sibling
  // tab, same pattern as SettingsTab below.
  ChatTab: NavigatorScreenParams<ChatStackParamList> | undefined;
  PrayerWall: undefined;
  // Pushed from PrayerWallScreen's header button, not its own tab-bar
  // icon -- same hidden-tab pattern as Profile/DailyDevotions below.
  TestimonyStream: undefined;
  // GlobalLibraryScreen (Study Tools > Bible Library) deep-links here
  // with a specific translation id when the user taps a Bible in their
  // language -- undefined for the normal tab-bar tap, which keeps
  // whatever translation was last selected (see ScriptureSearchScreen).
  // initialQuery: HomeScreen's "Quick Scripture Search" bar deep-links
  // here with typed text pre-filling the book-search filter, so someone
  // can jump straight to a result instead of scrolling the book list.
  Bible: { translationId?: string; initialQuery?: string } | undefined;
  Journal: undefined;
  StudyTools: undefined;
  Profile: undefined;
  DailyDevotions: undefined;
  // Hidden tab (tabBarButton: () => null below), reached from the "My
  // Library" card on Home -- the user's own saved sermons/verses/notes.
  // Named "Library" as the route (not "My Library") since the route id
  // is never user-facing; the screen's own header title is what shows.
  Library: undefined;
  // Hidden tab (tabBarButton: () => null below), reached from the
  // "Jesus Interactive Bible Games" Home card -- a hub + 9 flat sibling
  // game screens (GamesStack.tsx), same hidden-tab-wrapping-a-nested-
  // stack pattern StudyTools uses above. headerShown:false since the
  // nested stack draws its own headers per screen.
  GamesTab: undefined;
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
  // Hidden tab (tabBarButton: () => null below), so this icon is never
  // actually rendered in the tab bar -- kept only so this Record stays
  // total over every route.
  TestimonyStream: 'sparkles',
  Bible: 'book',
  Journal: 'journal',
  StudyTools: 'library',
  Profile: 'person-circle',
  DailyDevotions: 'sunny',
  Library: 'albums',
  // Hidden tab, so this icon is never actually rendered -- kept only so
  // this Record stays total over every route.
  GamesTab: 'game-controller',
  SettingsTab: 'settings',
};

// Shared headerLeft for every hidden tab below (TestimonyStream, Profile,
// DailyDevotions, Library) -- createBottomTabNavigator never generates a
// back arrow on its own the way a native-stack does, and these four are
// only ever reached by navigating in from Home/PrayerWall/Resources, not
// from the tab bar itself, so without this they had no way back at all.
// Goes straight to HomeTab rather than navigation.goBack() -- a tab
// navigator doesn't keep the kind of screen history "back" would need,
// so this matches GamesHubScreen.tsx's own close button, which does the
// same explicit navigate('HomeTab') for the same reason.
function HeaderBackToHome({ navigation }: { navigation: BottomTabScreenProps<MainTabParamList>['navigation'] }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('HomeTab')}
      accessibilityRole="button"
      accessibilityLabel="Back to Home"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={{ paddingHorizontal: 4 }}
    >
      <Ionicons name="chevron-back" size={26} color={Colors.royal} />
    </TouchableOpacity>
  );
}

export default function MainTabs() {
  const { t } = useI18n();

  return (
    <View style={{ flex: 1 }}>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.gold,
        tabBarStyle: { backgroundColor: Colors.royal, borderTopColor: Colors.royalLight },
        // Icons stay gold (tint color above); labels use the same ivory
        // used everywhere else in the app (card labels, etc.) instead of
        // inheriting that same gold tint.
        tabBarLabelStyle: { color: Colors.ivory },
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
      <Tab.Screen
        name="TestimonyStream"
        component={FadedTestimonyStream}
        options={({ navigation }) => ({
          title: 'Testimony Stream',
          headerShown: true,
          headerTintColor: Colors.royal,
          headerLeft: () => <HeaderBackToHome navigation={navigation} />,
          tabBarButton: () => null,
        })}
      />
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
        options={({ navigation }) => ({
          title: t.tabs.profile,
          headerShown: true,
          headerTintColor: Colors.royal,
          headerLeft: () => <HeaderBackToHome navigation={navigation} />,
          tabBarButton: () => null,
        })}
      />
      <Tab.Screen
        name="DailyDevotions"
        component={FadedDailyDevotions}
        options={({ navigation }) => ({
          title: t.tabs.devotions,
          headerShown: true,
          headerTintColor: Colors.royal,
          headerLeft: () => <HeaderBackToHome navigation={navigation} />,
          tabBarButton: () => null,
        })}
      />
      <Tab.Screen
        name="Library"
        component={FadedLibrary}
        options={({ navigation }) => ({
          title: 'My Library',
          headerShown: true,
          headerTintColor: Colors.royal,
          headerLeft: () => <HeaderBackToHome navigation={navigation} />,
          tabBarButton: () => null,
        })}
      />
      <Tab.Screen
        name="GamesTab"
        component={FadedGamesStack}
        options={{
          title: 'Jesus Interactive Games Hub',
          headerShown: false,
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen name="SettingsTab" component={FadedSettingsStack} options={{ title: t.tabs.settings }} />
    </Tab.Navigator>
    <DedicationFooter />
    <RadioOverlay />
    </View>
  );
}
