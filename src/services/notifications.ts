// Push notifications for the daily verse (spec section 3 / 7).
// Uses expo-notifications. Requires a real device (not the iOS Simulator)
// to receive remote pushes, and an EAS project ID in app.json (extra.eas)
// for getExpoPushTokenAsync to work in a production build.

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { pickDailyVerseNotification } from '../constants/notificationsCopy';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForDailyVersePush(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-verse', {
      name: 'Daily verse',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync();
  // TODO: send tokenResponse.data to your backend, associated with the
  // user's account and their chosen daily-verse send time, so the
  // backend can schedule/send the push. Do not schedule the recurring
  // send purely on-device; a backend-scheduled push is what actually
  // reaches users when the app isn't open.
  return tokenResponse.data;
}

// Local (on-device, no backend needed) fallback: schedules a daily
// reminder at a fixed time using content already cached on-device. Picks
// one of the gentle example notifications in constants/notificationsCopy.ts
// at schedule time -- note this means the SAME notification repeats every
// day until the user changes their reminder time, since a locally
// repeating trigger can't vary its content day to day. Swap for the
// backend-driven flow above (registerForDailyVersePush) once the API is
// live, so the server can pick fresh copy -- or a fresh verse -- every day.
export async function scheduleLocalDailyVerseReminder(hour = 8, minute = 0) {
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
}
