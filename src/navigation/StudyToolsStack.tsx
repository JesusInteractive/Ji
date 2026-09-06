import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import StudyToolsScreen from '../screens/StudyToolsScreen';
import SermonWriterScreen from '../screens/SermonWriterScreen';
import GlobalLibraryScreen from '../screens/GlobalLibraryScreen';
import StudyLibraryEntranceScreen from '../screens/StudyLibraryEntranceScreen';
import StudyLibraryShelvesScreen from '../screens/StudyLibraryShelvesScreen';
import StudyLibraryReaderScreen from '../screens/StudyLibraryReaderScreen';

export type StudyToolsStackParamList = {
  StudyToolsHome: undefined;
  SermonWriter: undefined;
  GlobalLibrary: undefined;
  // The "Read Aloud" flow: one still entrance room, then the working
  // shelves, then a specific book. titleId matches
  // constants/studyLibraryAudio.ts's READ_ALOUD_TITLES ids.
  StudyLibraryEntrance: undefined;
  StudyLibraryShelves: undefined;
  StudyLibraryReader: { titleId: string };
};

const Stack = createNativeStackNavigator<StudyToolsStackParamList>();

export default function StudyToolsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: Colors.royal, animation: 'fade' }}>
      <Stack.Screen name="StudyToolsHome" component={StudyToolsScreen} options={{ title: 'Study Tools' }} />
      <Stack.Screen name="SermonWriter" component={SermonWriterScreen} options={{ title: 'Sermon Writer' }} />
      <Stack.Screen name="GlobalLibrary" component={GlobalLibraryScreen} options={{ title: 'Multi-Language Bible Tools' }} />
      <Stack.Screen
        name="StudyLibraryEntrance"
        component={StudyLibraryEntranceScreen}
        // headerShown:false hides this screen's OWN header (the entrance
        // image is deliberately chrome-free), but React Navigation still
        // uses this screen's title for the NEXT screen's back button --
        // without an explicit title it falls back to the raw route key
        // ("StudyLibraryEntrance"), which is what showed up on the
        // Shelves screen's back button before this fix.
        options={{ headerShown: false, title: '' }}
      />
      <Stack.Screen name="StudyLibraryShelves" component={StudyLibraryShelvesScreen} options={{ title: 'Study Library' }} />
      <Stack.Screen name="StudyLibraryReader" component={StudyLibraryReaderScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
