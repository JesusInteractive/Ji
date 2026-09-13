// "Jesus Interactive Bible Games" hub -- one tile per game, each in its
// own vivid color (see data/gamesCatalog.ts's own comment on why this
// screen breaks from the app's usual navy/gold palette: colorful and
// inviting is the explicit goal here). Every game is fully unlocked --
// no useFeatureAccess()/PaywallLockScreen anywhere on this screen or any
// of its 9 children, by design (see the approved plan).
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../../theme/colors';
import DraggableScrollbar from '../../components/DraggableScrollbar';
import { GAMES_CATALOG } from '../../data/gamesCatalog';
import type { GamesStackParamList } from '../../navigation/GamesStack';

type Props = NativeStackScreenProps<GamesStackParamList, 'GamesHub'>;

export default function GamesHubScreen({ navigation }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  // Disabled while dragging the custom scrollbar thumb -- see DraggableScrollbar.tsx's onDragStart/onDragEnd comment.
  const [scrollbarDragging, setScrollbarDragging] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.getParent()?.navigate('HomeTab' as never)}
          accessibilityLabel="Close Games Hub"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={20} color={Colors.royal} />
        </TouchableOpacity>
        <Text style={styles.title}>Jesus Interactive Games Hub</Text>
        <Text style={styles.subhead}>Tap a game to start playing. Each one has its own difficulty levels.</Text>
      </View>
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
          onContentSizeChange={(_w, h) => setContentHeight(h)}
          onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          scrollEnabled={!scrollbarDragging}
        >
          {GAMES_CATALOG.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[styles.tile, { backgroundColor: game.color }]}
              onPress={() => navigation.navigate(game.id)}
              accessibilityRole="button"
              accessibilityLabel={`${game.title} -- ${game.subtitle}`}
            >
              <Ionicons name={game.icon} size={34} color={Colors.white} />
              <Text style={styles.tileTitle}>{game.title}</Text>
              <Text style={styles.tileSubtitle}>{game.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <DraggableScrollbar
          contentHeight={contentHeight}
          viewportHeight={viewportHeight}
          scrollOffset={scrollOffset}
          onScrollTo={(offset) => {
            scrollRef.current?.scrollTo({ y: offset, animated: false });
            setScrollOffset(offset);
          }}
          onDragStart={() => setScrollbarDragging(true)}
          onDragEnd={() => setScrollbarDragging(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.ivory },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, alignItems: 'center' },
  closeButton: {
    position: 'absolute', top: 12, right: 16, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#EFE9DA', alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.royal, textAlign: 'center' },
  subhead: { fontSize: 12.5, color: '#8A8577', marginTop: 6, textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  tile: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  tileTitle: { fontSize: 15.5, fontWeight: '800', color: Colors.white, textAlign: 'center', marginTop: 10 },
  tileSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 4 },
});
