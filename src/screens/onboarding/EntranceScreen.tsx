import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../../theme/colors';
import GlorySplash, { type GlorySplashHandle } from '../../components/GlorySplash';
import { useI18n } from '../../i18n';
import { useApp } from '../../context/AppContext';
import { NEXT_MUSIC_LEVEL, type MusicLevel } from '../../services/musicLevel';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Entrance'>;

export default function EntranceScreen({ navigation }: Props) {
  const { t, language } = useI18n();
  const { markEntranceSeen } = useApp();
  const insets = useSafeAreaInsets();
  const splashRef = useRef<GlorySplashHandle>(null);
  const [musicLevel, setMusicLevel] = useState<MusicLevel>('full');

  const handleEnter = () => {
    markEntranceSeen();
    navigation.replace('Pricing');
  };

  const cycleMusic = () => {
    setMusicLevel((current) => {
      const next = NEXT_MUSIC_LEVEL[current];
      splashRef.current?.setMusicLevel(next);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <GlorySplash
        ref={splashRef}
        verseReference={t.entrance.verseReference}
        verseText={t.entrance.verseText}
        languageCode={language}
      />

      <View style={[styles.topIcons, { top: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => splashRef.current?.replay()}
          accessibilityRole="button"
          accessibilityLabel="Replay Jesus's entrance"
        >
          <Ionicons name="refresh-outline" size={20} color={Colors.ivory} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={cycleMusic}
          accessibilityRole="button"
          accessibilityLabel={
            musicLevel === 'off'
              ? 'Background music off. Tap for low volume.'
              : musicLevel === 'low'
                ? 'Background music low. Tap for full volume.'
                : 'Background music on. Tap to turn off.'
          }
        >
          <Ionicons
            name={musicLevel === 'off' ? 'volume-mute-outline' : musicLevel === 'low' ? 'volume-low-outline' : 'volume-high-outline'}
            size={20}
            color={musicLevel === 'off' ? Colors.ivory : Colors.glory}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cta} onPress={handleEnter}>
        <Text style={styles.ctaText}>{t.entrance.cta}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.royal },
  topIcons: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    gap: 14,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    position: 'absolute',
    bottom: 48,
    left: 32,
    right: 32,
    backgroundColor: Colors.gold,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: { color: Colors.goldDark, fontWeight: '800', fontSize: 16 },
});
