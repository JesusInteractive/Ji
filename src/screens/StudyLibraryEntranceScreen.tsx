import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { StudyToolsStackParamList } from '../navigation/StudyToolsStack';
import { useI18n } from '../i18n';

type Props = NativeStackScreenProps<StudyToolsStackParamList, 'StudyLibraryEntrance'>;

// The door, not the library. One full-bleed still -- dark wood, warm
// lamp light, a few shelves receding into shadow. No icons, no cards, no
// second button: the whole frame is the tap target. Restraint is the
// entire design here; the room does the selling.
//
// This is a still frame, not the source clip (assets/study-library-
// entrance.png, extracted from Desktop/Study Tools.mp4) -- the clip
// itself has a sweeping sunbeam and a billowing curtain partway through,
// which read as too cinematic/"movie-like" for a quiet entrance per the
// explicit direction this asset was chosen against. Same room either
// way; this is the calmest frame of it. The original frame had "Enter
// the library." burned into the image itself -- that text was patched
// out of the asset (nearby floor texture cloned over it) so the label
// below is real, editable copy instead of baked-in pixels.
export default function StudyLibraryEntranceScreen({ navigation }: Props) {
  const { t } = useI18n();
  return (
    <Pressable style={styles.container} onPress={() => navigation.navigate('StudyLibraryShelves')}>
      <ImageBackground
        source={require('../../assets/study-library-entrance.png')}
        style={styles.image}
        resizeMode="cover"
      >
        <Text style={styles.label}>{t.studyLibrary.enterLibrary}</Text>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  label: {
    color: '#EDE0CC',
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
    paddingBottom: 64,
    opacity: 0.92,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
