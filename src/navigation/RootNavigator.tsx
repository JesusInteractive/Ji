import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import Colors from '../theme/colors';
import LogoIntroScreen from '../screens/LogoIntroScreen';
import LanguageSelectScreen from '../screens/onboarding/LanguageSelectScreen';
import AgreementsScreen from '../screens/onboarding/AgreementsScreen';
import EntranceScreen from '../screens/onboarding/EntranceScreen';
import PricingScreen from '../screens/onboarding/PricingScreen';
import LegalDocScreen from '../screens/LegalDocScreen';
import BibleWordSearchScreen from '../screens/BibleWordSearchScreen';
import BibleTriviaScreen from '../screens/trivia/TriviaScreen';
import JIRadioScreen from '../screens/JIRadioScreen';
import SermonsLandingScreen from '../screens/SermonsLandingScreen';
import NewsWatchScreen from '../screens/NewsWatchScreen';
import NewsHeadlinesScreen from '../screens/NewsHeadlinesScreen';
import GlobalMapScreen from '../screens/GlobalMapScreen';
import SiteDossierScreen from '../screens/SiteDossierScreen';
import PassionRelicsScreen from '../screens/PassionRelicsScreen';
import GospelTranslatorScreen from '../screens/GospelTranslatorScreen';
import SermonWriterScreen from '../screens/SermonWriterScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import MainTabs from './MainTabs';
import type { LegalDocParams } from './SettingsStack';

// Pricing is no longer a forced day-one step here -- see EntranceScreen's
// handleEnter and AppContext.tsx's onboardingComplete (which dropped its
// old `plan !== null` clause). Everyone gets straight into Main once
// they've seen Entrance; the 5-day trial starts silently, and Pricing
// only resurfaces from Settings/Profile or a paywall once it expires
// (it's still registered at the root level below, just never inside
// this onboarding stack).
export type OnboardingStackParamList = {
  LanguageSelect: undefined;
  Agreements: undefined;
  Entrance: undefined;
};

export type RootStackParamList = {
  LogoIntro: undefined;
  Onboarding: undefined;
  LegalUpdate: undefined;
  Main: undefined;
  // A root-level modal, deliberately NOT nested inside SettingsStack --
  // reachable from both Home and Settings without either one leaving
  // the Settings tab's own internal stack parked on this screen (which
  // is what happened when this used to be pushed via SettingsStack's
  // LegalDoc route: switching tabs away and back to Settings landed back
  // on this screen instead of the settings list, since tab navigators
  // remember each tab's last-active screen).
  AboutApp: LegalDocParams;
  // Same PricingScreen component used during onboarding (see
  // OnboardingStackParamList below), registered a second time here so
  // it's reachable AFTER onboarding too -- from ChatScreen when the free
  // introductory offer's questions run out, and from Profile/Settings'
  // "Plan" row. PricingScreen itself tells the two apart via
  // hasSelectedPlan (see its own comment), not a route param.
  Pricing: undefined;
  // Its own dedicated page, reached from a teaser card on Home directly
  // below "About This App" -- same root-level-modal pattern as AboutApp
  // above, not nested in a tab stack, since it's a standalone diversion
  // rather than part of any tab's own flow.
  WordSearch: undefined;
  // Same root-level-modal pattern as WordSearch above, reached from a
  // card directly below it on Home. See src/screens/trivia/TriviaScreen.tsx's
  // own comment on why it's one route with internal view-state rather
  // than a nested stack.
  Trivia: undefined;
  // Same root-level-modal pattern as WordSearch above, reached from a
  // card directly below it on Home. "24/7 Global Praise and Worship" --
  // this app's own radio.co-hosted live stream, played in-app via
  // expo-audio. See JIRadioScreen.tsx's own comment for the
  // backend-hosted stream config this fetches at runtime.
  JIRadio: undefined;
  // Same root-level-modal pattern as JIRadio above -- the video half of
  // the News Brief, reached from Home's NewsBriefHomeCard. See
  // NewsWatchScreen.tsx's own comment on the written/video split.
  NewsWatch: undefined;
  // The written half of the News Brief (Now Brief, On This Day,
  // Headlines) -- reached from Resources instead. See
  // NewsHeadlinesScreen.tsx's own comment on the split.
  NewsHeadlines: undefined;
  // Same root-level-modal pattern as JIRadio above, reached from a card
  // directly below it on Home. See SermonsLandingScreen.tsx's own
  // comment on why this is a landing screen, not a raw outbound jump.
  SermonsLanding: undefined;
  // Same root-level-modal pattern as the others above, reached from a
  // card directly below Quick Scripture Search on Home. See
  // GospelTranslatorScreen.tsx's own comment for the two-pane,
  // face-to-face design.
  //
  // initialText/initialLabel are optional: ScriptureSearchScreen's "Read
  // in Gospel Translator" (a chapter) and SermonWriterScreen's (a
  // generated sermon) both hand off through these -- see their own
  // comments -- so the pastor's own pane opens already carrying exactly
  // what they meant to read aloud, translated immediately, instead of
  // making them re-type or re-speak it from memory.
  GospelTranslator: { initialText: string; initialLabel: string } | undefined;
  // Same root-level-modal pattern as the others above, reached from a
  // card directly below the News Brief on Home. See GlobalMapScreen.tsx's
  // own comment -- a reference atlas, not part of the Games Hub.
  GlobalMap: undefined;
  // One shared detail screen for every site in src/data/bibleSites.ts,
  // reused via this single param'd route rather than one route per site.
  SiteDossier: { siteId: string };
  // Same root-level-modal pattern as the others above, reached from a
  // card directly below Journeys Through the Bible on Home.
  PassionRelics: undefined;
  // Second entry point into the same SermonWriterScreen already reached
  // via StudyToolsStack's own internal "SermonWriter" route (Study Tools
  // -> its own card) -- this one is a direct Home grid tile ("Sermon
  // Generator"), same dual-entry-point pattern as WordSearch/Trivia
  // below, which are also reachable both via the Games Hub and directly.
  SermonWriter: undefined;
  // Reached from Home's own "Resources" grid tile -- a consolidated list
  // of features that don't each earn a first-class grid tile. See
  // ResourcesScreen.tsx's own comment.
  Resources: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <OnboardingStack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
      <OnboardingStack.Screen name="Agreements" component={OnboardingAgreementsRoute} />
      <OnboardingStack.Screen name="Entrance" component={EntranceScreen} />
    </OnboardingStack.Navigator>
  );
}

function OnboardingAgreementsRoute({ navigation }: NativeStackScreenProps<OnboardingStackParamList, 'Agreements'>) {
  return <AgreementsScreen mode="onboarding" onAccepted={() => navigation.replace('Entrance')} />;
}

// Shown instead of Main when an already-onboarded user's recorded consent
// is for an older version of any legal document (see AppContext's
// needsLegalReconsent). Accepting flips that flag, which re-renders this
// navigator into Main -- the same conditional-screen swap onboarding uses.
function LegalUpdateRoute() {
  return <AgreementsScreen mode="update" />;
}

// A thin wrapper so LogoIntroScreen (which just needs a plain onFinish
// callback, no navigation-specific typing) can be a real screen in this
// stack -- that's the fix for the glitchy hard-cut into the next page.
// Previously RootNavigator rendered LogoIntroScreen as a separate
// conditional (`if (!introDone) return <LogoIntroScreen .../>`) OUTSIDE
// this Stack.Navigator entirely, so swapping to the Stack afterward was
// a raw unmount/mount with no transition -- none of the `animation:
// 'fade'` below applied to it. As an actual Stack.Screen, navigating
// away from it goes through the same native-stack fade as every other
// screen change in the app.
function LogoIntroRoute({ navigation }: NativeStackScreenProps<RootStackParamList, 'LogoIntro'>) {
  const { onboardingComplete, needsLegalReconsent } = useApp();
  return (
    <LogoIntroScreen
      onFinish={() => navigation.replace(!onboardingComplete ? 'Onboarding' : needsLegalReconsent ? 'LegalUpdate' : 'Main')}
    />
  );
}

export default function RootNavigator() {
  const { onboardingComplete, needsLegalReconsent, ready } = useApp();

  // Navy, not null -- an empty render here left a plain white flash
  // between the native splash screen ending and the logo video starting
  // (an empty NavigationContainer has nothing to paint a background with
  // on its own), which read as its own "blank white page."
  if (!ready) return <View style={{ flex: 1, backgroundColor: Colors.royalLight }} />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="LogoIntro" component={LogoIntroRoute} />
      {/* Conditionally including only one of these (not both, unlike
          LogoIntro above) is what makes PricingScreen's completion
          auto-advance into Main -- see LogoIntroRoute's own comment.
          onboardingComplete flipping true re-renders this with Main in
          the tree instead of Onboarding, and React Navigation treats
          that as a screen change (still animated via `animation: 'fade'`
          above), with no explicit navigate() call needed anywhere. */}
      {onboardingComplete && needsLegalReconsent ? (
        <Stack.Screen name="LegalUpdate" component={LegalUpdateRoute} />
      ) : onboardingComplete ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="AboutApp"
            component={LegalDocScreen}
            options={({ route, navigation }) => ({
              headerShown: true,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: route.params.title,
              headerTintColor: Colors.royal,
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={26} color={Colors.royal} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="Pricing"
            component={PricingScreen}
            options={({ navigation }) => ({
              headerShown: true,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: 'Choose your plan',
              headerTintColor: Colors.royal,
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={26} color={Colors.royal} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="WordSearch"
            component={BibleWordSearchScreen}
            options={({ navigation }) => ({
              headerShown: true,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: 'Bible Word Search',
              headerTintColor: Colors.royal,
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={26} color={Colors.royal} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="Trivia"
            component={BibleTriviaScreen}
            options={({ navigation }) => ({
              headerShown: true,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: 'Bible Trivia',
              headerTintColor: Colors.royal,
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={26} color={Colors.royal} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="JIRadio"
            component={JIRadioScreen}
            options={({ navigation }) => ({
              headerShown: true,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: '24/7 Global Praise and Worship',
              headerTintColor: Colors.royal,
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={26} color={Colors.royal} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="NewsWatch"
            component={NewsWatchScreen}
            options={({ navigation }) => ({
              headerShown: true,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: 'Jesus Interactive News Brief',
              headerTintColor: Colors.royal,
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={26} color={Colors.royal} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="NewsHeadlines"
            component={NewsHeadlinesScreen}
            options={({ navigation }) => ({
              headerShown: true,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: 'Jesus Interactive News Brief',
              headerTintColor: Colors.royal,
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={26} color={Colors.royal} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="SermonsLanding"
            component={SermonsLandingScreen}
            options={({ navigation }) => ({
              headerShown: true,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: '24/7 Sermons and Teaching',
              headerTintColor: Colors.royal,
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={26} color={Colors.royal} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="GospelTranslator"
            component={GospelTranslatorScreen}
            options={({ navigation }) => ({
              headerShown: true,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: 'Gospel Translator',
              headerStyle: { backgroundColor: Colors.royal },
              headerTintColor: Colors.gold,
              headerTitleStyle: { color: Colors.ivory },
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={26} color={Colors.gold} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="GlobalMap"
            component={GlobalMapScreen}
            options={({ navigation }) => ({
              headerShown: true,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: 'Journeys Through the Bible',
              headerStyle: { backgroundColor: Colors.royal },
              headerTitleStyle: { color: Colors.ivory },
              headerTintColor: Colors.ivory,
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={26} color={Colors.ivory} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="SiteDossier"
            component={SiteDossierScreen}
            options={{
              headerShown: false,
              presentation: 'transparentModal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="PassionRelics"
            component={PassionRelicsScreen}
            options={({ navigation }) => ({
              headerShown: true,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: 'The Passion Relics',
              headerStyle: { backgroundColor: Colors.royal },
              headerTitleStyle: { color: Colors.ivory },
              headerTintColor: Colors.ivory,
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={26} color={Colors.ivory} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="SermonWriter"
            component={SermonWriterScreen}
            options={({ navigation }) => ({
              headerShown: true,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: 'Sermon Writer',
              headerTintColor: Colors.royal,
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={26} color={Colors.royal} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="Resources"
            component={ResourcesScreen}
            options={({ navigation }) => ({
              headerShown: true,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: 'Resources',
              headerStyle: { backgroundColor: Colors.royal },
              headerTitleStyle: { color: Colors.ivory },
              headerTintColor: Colors.ivory,
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={26} color={Colors.ivory} />
                </TouchableOpacity>
              ),
            })}
          />
        </>
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
}
