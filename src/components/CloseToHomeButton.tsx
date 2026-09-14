import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackActions, useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import Colors from '../theme/colors';

// The "×" in the top-right corner of every screen: always takes you back
// to Home. Used as headerRight by each section's stack (Ask Jesus
// sub-screens, Games, Settings, Study Tools) and by the hidden tabs, so
// every page has the same way out as the modals and the Games Hub.
//
// On the way out it resets the section it's in back to that section's
// first screen, so reopening Games (say) starts at the hub instead of
// dropping you back mid-game.
export default function CloseToHomeButton({ color = Colors.royal }: { color?: string }) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const close = () => {
    const state = navigation.getState();
    if (state?.type === 'stack' && state.index > 0) navigation.dispatch(StackActions.popToTop());
    // Walk up to whichever navigator owns the Home tab and switch to it.
    let current: NavigationProp<ParamListBase> | undefined = navigation;
    while (current) {
      if (current.getState()?.routeNames?.includes('HomeTab')) {
        current.navigate('HomeTab');
        return;
      }
      current = current.getParent();
    }
  };

  return (
    <TouchableOpacity
      onPress={close}
      accessibilityRole="button"
      accessibilityLabel="Close and go to Home"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={{ paddingHorizontal: 4 }}
    >
      <Ionicons name="close" size={26} color={color} />
    </TouchableOpacity>
  );
}
