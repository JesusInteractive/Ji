import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

// @react-navigation/bottom-tabs (v6, installed here) has no built-in
// screen-transition animation the way native-stack's `animation: 'fade'`
// does -- tab switches just hard-cut by default. This wraps a tab
// screen so it fades in whenever it becomes the focused tab, giving tab
// switches the same dissolve feel as every stack transition elsewhere
// in the app. It only animates the incoming screen (the outgoing one
// is hidden by the tab navigator itself, not faded out by us) -- still
// reads as a soft cross-dissolve rather than the previous instant cut.
export function withFadeIn<P extends object>(Component: React.ComponentType<P>) {
  return function FadedScreen(props: P) {
    const isFocused = useIsFocused();
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (isFocused) {
        opacity.setValue(0);
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      }
    }, [isFocused, opacity]);

    return (
      <Animated.View style={{ flex: 1, opacity }}>
        <Component {...props} />
      </Animated.View>
    );
  };
}
