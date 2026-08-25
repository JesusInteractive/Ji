// Local (on-device) daily verse reminder. Deliberately local-only, not
// remote push -- this app has no backend database/user accounts (see
// AppContext's own architecture comment) to associate a push token
// with, so there was never anywhere for a real registerForDailyVersePush
// (getExpoPushTokenAsync) flow to send its token, and it was dead code,
// never called from any screen. Removed rather than kept as an unused
// stub -- also sidesteps needing the isExpoGo guard below for it
// specifically, since Expo Go on Android (SDK 53+) throws immediately
// merely importing expo-notifications' remote-push machinery at all,
// which is exactly the "[runtime not ready]" crash this file used to
// cause on every Android Expo Go launch (setNotificationHandler below
// touches that same machinery internally) -- not just when a push
// function was actually called.

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { pickDailyVerseNotification } from '../constants/notificationsCopy';

// Same Expo Go detection as services/purchases.ts -- SDK 53+ removed
// remote-push support from Expo Go on ANDROID specifically (iOS Expo Go
// is unaffected), and even local notification setup here touches enough
// of the same native module surface to throw there. A real dev-client/
// production build (what this crash's own error message points you
// toward) doesn't have this restriction.
const isBlockedInExpoGo = Constants.executionEnvironment === 'storeClient' && Platform.OS === 'android';

if (!isBlockedInExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Local (on-device, no backend needed): schedules a daily reminder at a
// fixed time using content already cached on-device. Picks one of the
// gentle example notifications in constants/notificationsCopy.ts at
// schedule time -- note this means the SAME notification repeats every
// day until the user changes their reminder time, since a locally
// repeating trigger can't vary its content day to day. Returns false
// (and schedules nothing) if permission is denied, so the caller
// (SettingsScreen) can flip its toggle back off rather than showing "on"
// for a reminder that will never actually fire, or if running in Expo
// Go on Android -- see isBlockedInExpoGo's own comment.
export async function scheduleLocalDailyVerseReminder(hour = 8, minute = 0): Promise<boolean> {
  if (isBlockedInExpoGo) {
    console.warn('Local notifications are unavailable in Expo Go on Android (SDK 53+) -- use a development build.');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-verse', {
      name: 'Daily verse',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  const { title, body } = pickDailyVerseNotification();
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
  return true;
}

export async function cancelLocalDailyVerseReminder() {
  if (isBlockedInExpoGo) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
