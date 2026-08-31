import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import StudyToolsScreen from '../screens/StudyToolsScreen';
import SermonWriterScreen from '../screens/SermonWriterScreen';
import GlobalLibraryScreen from '../screens/GlobalLibraryScreen';

export type StudyToolsStackParamList = {
  StudyToolsHome: undefined;
  SermonWriter: undefined;
  GlobalLibrary: undefined;
};

const Stack = createNativeStackNavigator<StudyToolsStackParamList>();

export default function StudyToolsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: Colors.royal, animation: 'fade' }}>
      <Stack.Screen name="StudyToolsHome" component={StudyToolsScreen} options={{ title: 'Study Tools' }} />
      <Stack.Screen name="SermonWriter" component={SermonWriterScreen} options={{ title: 'Sermon Writer' }} />
      <Stack.Screen name="GlobalLibrary" component={GlobalLibraryScreen} options={{ title: 'Multi-Language Bible Tools' }} />
    </Stack.Navigator>
  );
}
