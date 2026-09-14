import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import CloseToHomeButton from '../components/CloseToHomeButton';
import GamesHubScreen from '../screens/games/GamesHubScreen';
import ComingSoonGameScreen from '../screens/games/ComingSoonGameScreen';
import BibleWordSearchScreen from '../screens/BibleWordSearchScreen';
import TriviaScreen from '../screens/trivia/TriviaScreen';
import CrosswordScreen from '../screens/games/CrosswordScreen';
import VerseRebuildScreen from '../screens/games/VerseRebuildScreen';
import MemoryMatchScreen from '../screens/games/MemoryMatchScreen';
import FillInBlankScreen from '../screens/games/FillInBlankScreen';
import GuessCharacterScreen from '../screens/games/GuessCharacterScreen';
import TimelineSortScreen from '../screens/games/TimelineSortScreen';
import ScrabbleScreen from '../screens/games/ScrabbleScreen';
import BibleMazesScreen from '../screens/games/BibleMazesScreen';

// Jesus Interactive Bible Games -- one hub + 9 flat sibling game routes,
// same nested-stack shape as StudyToolsStack.tsx (one hub screen, every
// destination a flat sibling, not further sub-nested). Prefixed `Game*`
// route names avoid any shadowing risk against RootStackParamList's
// unrelated `WordSearch`/`Trivia` routes (the existing, separate,
// paywalled games) -- different param lists so there's no compile-time
// collision either way, but distinct names cost nothing and remove any
// ambiguity about which `navigation.navigate('WordSearch')` call would
// resolve to.
export type GamesStackParamList = {
  GamesHub: undefined;
  GameCrossword: undefined;
  GameVerseRebuild: undefined;
  GameMemoryMatch: undefined;
  GameFillInBlank: undefined;
  GameGuessCharacter: undefined;
  GameTimelineSort: undefined;
  GameWordSearch: undefined;
  GameTrivia: undefined;
  GameScrabble: undefined;
  GameBibleMazes: undefined;
};

const Stack = createNativeStackNavigator<GamesStackParamList>();

export default function GamesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: Colors.royal, animation: 'fade', headerRight: () => <CloseToHomeButton /> }}>
      <Stack.Screen name="GamesHub" component={GamesHubScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GameCrossword" component={CrosswordScreen} options={{ title: 'Bible Crossword' }} />
      <Stack.Screen name="GameVerseRebuild" component={VerseRebuildScreen} options={{ title: 'Verse Rebuild' }} />
      <Stack.Screen name="GameMemoryMatch" component={MemoryMatchScreen} options={{ title: 'Memory Match' }} />
      <Stack.Screen name="GameFillInBlank" component={FillInBlankScreen} options={{ title: 'Fill-in-the-Blank' }} />
      <Stack.Screen name="GameGuessCharacter" component={GuessCharacterScreen} options={{ title: 'Guess the Character' }} />
      <Stack.Screen name="GameTimelineSort" component={TimelineSortScreen} options={{ title: 'Timeline Sort' }} />
      <Stack.Screen name="GameWordSearch" component={BibleWordSearchScreen} options={{ title: 'Bible Word Search' }} />
      <Stack.Screen name="GameTrivia" component={TriviaScreen} options={{ title: 'Bible Trivia' }} />
      <Stack.Screen name="GameScrabble" component={ScrabbleScreen} options={{ title: 'Bible Scrabble' }} />
      <Stack.Screen name="GameBibleMazes" component={BibleMazesScreen} options={{ title: 'Bible Mazes' }} />
    </Stack.Navigator>
  );
}
