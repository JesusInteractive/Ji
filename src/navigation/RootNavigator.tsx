import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import Colors from '../theme/colors';
import LogoIntroScreen from '../screens/LogoIntroScreen';
import LanguageSelectScreen from '../screens/onboarding/LanguageSelectScreen';
import DisclaimerScreen from '../screens/onboarding/DisclaimerScreen';
import UserAgreementScreen from '../screens/onboarding/UserAgreementScreen';
import EntranceScreen from '../screens/onboarding/EntranceScreen';
import PricingScreen from '../screens/onboarding/PricingScreen';
import MainTabs from './MainTabs';

export type OnboardingStackParamList = {
  LanguageSelect: undefined;
  Disclaimer: undefined;
  UserAgreement: undefined;
  Entrance: undefined;
  Pricing: undefined;
};

export type RootStackParamList = {
  LogoIntro: undefined;
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <OnboardingStack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
      <OnboardingStack.Screen name="Disclaimer" component={DisclaimerScreen} />
      <OnboardingStack.Screen name="UserAgreement" component={UserAgreementScreen} />
      <OnboardingStack.Screen name="Entrance" component={EntranceScreen} />
      <OnboardingStack.Screen name="Pricing" component={PricingScreen} />
    </OnboardingStack.Navigator>
  );
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
  const { onboardingComplete } = useApp();
  return (
    <LogoIntroScreen onFinish={() => navigation.replace(onboardingComplete ? 'Main' : 'Onboarding')} />
  );
}

export default function RootNavigator() {
  const { onboardingComplete, ready } = useApp();

  // Navy, not null -- an empty render here left a plain white flash
  // between the native splash screen ending and the logo video starting
  // (an empty NavigationContainer has nothing to paint a background with
  // on its own), which read as its own "blank white page."
  if (!ready) return <View style={{ flex: 1, backgroundColor: Colors.royal }} />;

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
      {onboardingComplete ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
}
