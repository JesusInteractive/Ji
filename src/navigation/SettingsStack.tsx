import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import SettingsScreen from '../screens/SettingsScreen';
import TokenGiftScreen from '../screens/TokenGiftScreen';
import LegalDocScreen from '../screens/LegalDocScreen';
import ReportIssueScreen from '../screens/ReportIssueScreen';

export type LegalDocParams = {
  title: string;
  lastUpdated?: string;
  intro?: string;
  sections: { heading: string; body: string }[];
  closing?: string;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  TokenGift: undefined;
  LegalDoc: LegalDocParams;
  ReportIssue: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: Colors.royal, animation: 'fade' }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="TokenGift" component={TokenGiftScreen} options={{ title: 'Buy & Gift' }} />
      <Stack.Screen
        name="LegalDoc"
        component={LegalDocScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} options={{ title: 'Report an Issue' }} />
    </Stack.Navigator>
  );
}
