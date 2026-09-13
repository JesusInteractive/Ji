// Placeholder for a Jesus Interactive Bible Games tile not yet built.
// Swapped out for the real game screen as each one ships (see the
// approved plan's build order) -- kept as its own component rather than
// inlined in GamesStack.tsx so that swap is a one-line change there.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../../theme/colors';
import { GAMES_CATALOG } from '../../data/gamesCatalog';
import type { GamesStackParamList } from '../../navigation/GamesStack';

type Props = NativeStackScreenProps<GamesStackParamList, keyof Omit<GamesStackParamList, 'GamesHub'>>;

export default function ComingSoonGameScreen({ route }: Props) {
  const entry = GAMES_CATALOG.find((g) => g.id === route.name);
  return (
    <View style={[styles.container, { backgroundColor: entry?.color ?? Colors.royal }]}>
      <View style={styles.iconWrap}>
        <Ionicons name={entry?.icon ?? 'game-controller-outline'} size={56} color={Colors.white} />
      </View>
      <Text style={styles.title}>{entry?.title ?? 'Coming Soon'}</Text>
      <Text style={styles.subtitle}>This game is on its way -- check back soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  subtitle: { fontSize: 14.5, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 10 },
});
