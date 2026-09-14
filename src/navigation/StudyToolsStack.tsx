import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import CloseToHomeButton from '../components/CloseToHomeButton';
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
    <Stack.Navigator screenOptions={{ headerTintColor: Colors.royal, animation: 'fade', headerRight: () => <CloseToHomeButton /> }}>
      <Stack.Screen
        name="StudyToolsHome"
        component={StudyToolsScreen}
        options={({ navigation }) => ({
          title: 'Study Tools',
          // First screen of this stack -- no auto back arrow, and this
          // is also StudyTools' hidden-tab root, so "back" means leaving
          // the tab entirely. Same explicit navigate('HomeTab') pattern
          // as GamesHubScreen.tsx's own close button, for the same
          // "first screen of a nested stack inside a hidden tab" reason.
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('HomeTab' as never)}
              accessibilityRole="button"
              accessibilityLabel="Back to Home"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ paddingHorizontal: 4 }}
            >
              <Ionicons name="chevron-back" size={26} color={Colors.royal} />
            </TouchableOpacity>
          ),
        })}
      />
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
