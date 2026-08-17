import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import ChatScreen from '../screens/ChatScreen';
import AboutScreen from '../screens/AboutScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import GuidedPrayerScreen from '../screens/GuidedPrayerScreen';

export type ChatStackParamList = {
  ChatHome: undefined;
  About: undefined;
  Favorites: undefined;
  GuidedPrayer: undefined;
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

export default function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: Colors.royal, animation: 'fade' }}>
      <Stack.Screen name="ChatHome" component={ChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About Jesus' }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorites' }} />
      <Stack.Screen name="GuidedPrayer" component={GuidedPrayerScreen} options={{ title: 'Guided Prayer' }} />
    </Stack.Navigator>
  );
}
