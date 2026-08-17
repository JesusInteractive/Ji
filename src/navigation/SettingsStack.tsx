import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import SettingsScreen from '../screens/SettingsScreen';
import TokenGiftScreen from '../screens/TokenGiftScreen';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  TokenGift: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: Colors.royal, animation: 'fade' }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="TokenGift" component={TokenGiftScreen} options={{ title: 'Buy & Gift' }} />
    </Stack.Navigator>
  );
}
