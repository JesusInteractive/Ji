// "Journeys Through the Bible" -- the Global Map hub. Reached from a
// Home card placed directly under 24/7 News Watch (see HomeScreen.tsx).
// NOT part of the Jesus Interactive Games Hub -- this is a reference
// feature (a scholar-grade biblical atlas), not a game, and uses the
// app's own navy/gold theme rather than the games hub's vivid palette.
//
// The map area is intentionally kept OUTSIDE any vertical ScrollView --
// FlatAtlasMapEngine owns its own pinch/pan gesture, and nesting a
// gesture-handled view inside a scrolling container is a well-known
// source of gesture conflicts. Era filters and the journey picker are
// fixed horizontal strips above the map; the news list is a separate
// scroll region below it.
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { BIBLE_SITES, type EraId } from '../data/bibleSites';
import { BIBLE_JOURNEYS } from '../data/bibleJourneys';
import { BIBLE_ATLAS_NEWS } from '../data/bibleAtlasNews';
import FlatAtlasMapEngine from '../components/globe/FlatAtlasMapEngine';
import DraggableScrollbar from '../components/DraggableScrollbar';

type Props = NativeStackScreenProps<RootStackParamList, 'GlobalMap'>;

const ERAS: EraId[] = ['Patriarchs', 'Exodus', 'Kingdoms', 'Prophets', 'Gospels', 'Acts', 'Epistles', 'EndTimes'];

export default function GlobalMapScreen({ navigation }: Props) {
  const [activeEras, setActiveEras] = useState<Set<EraId>>(new Set(ERAS));
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);
  const [journeyStopIndex, setJourneyStopIndex] = useState(0);

  const newsScrollRef = useRef<ScrollView>(null);
  const [newsScrollOffset, setNewsScrollOffset] = useState(0);
  const [newsContentHeight, setNewsContentHeight] = useState(0);
  const [newsViewportHeight, setNewsViewportHeight] = useState(0);
  const [newsScrollbarDragging, setNewsScrollbarDragging] = useState(false);

  const activeJourney = BIBLE_JOURNEYS.find((j) => j.id === activeJourneyId) ?? null;

  const journeySites = useMemo(() => {
    if (!activeJourney) return null;
    return activeJourney.siteIds
      .map((id) => BIBLE_SITES.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s);
  }, [activeJourney]);

  // While a journey is running, its own stops are shown regardless of the
  // era filter -- toggling eras off shouldn't silently break the active
  // journey's path.
  const visibleSites = journeySites ?? BIBLE_SITES.filter((s) => s.eras.some((e) => activeEras.has(e)));

  const toggleEra = (era: EraId) => {
    setActiveEras((prev) => {
      const next = new Set(prev);
      if (next.has(era)) next.delete(era);
      else next.add(era);
      return next;
    });
  };

  const startJourney = (journeyId: string) => {
    setActiveJourneyId((prev) => (prev === journeyId ? null : journeyId));
    setJourneyStopIndex(0);
  };

  const currentStop = journeySites?.[journeyStopIndex];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>Explore the Bible geographically -- tap a place to learn what happened there.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
        {ERAS.map((era) => {
          const active = activeEras.has(era);
          return (
            <Pressable key={era} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleEra(era)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{era}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.journeyRow} contentContainerStyle={styles.chipRowContent}>
        {BIBLE_JOURNEYS.map((journey) => {
          const active = journey.id === activeJourneyId;
          return (
            <Pressable
              key={journey.id}
              style={[styles.journeyCard, active && styles.journeyCardActive]}
              onPress={() => startJourney(journey.id)}
            >
              <Ionicons name="footsteps-outline" size={14} color={active ? Colors.royal : Colors.gold} />
              <View>
                <Text style={[styles.journeyCardTitle, active && styles.journeyCardTitleActive]}>{journey.title}</Text>
                <Text style={[styles.journeyCardPerson, active && styles.journeyCardPersonActive]}>{journey.personLabel}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.mapArea}>
        <FlatAtlasMapEngine
          sites={visibleSites}
          activeJourney={activeJourney ? { journey: activeJourney, stopIndex: journeyStopIndex } : undefined}
          onSitePress={(siteId) => navigation.navigate('SiteDossier', { siteId })}
        />

        {activeJourney && currentStop && (
          <View style={styles.stopCard}>
            <Text style={styles.stopCardLabel}>
              Stop {journeyStopIndex + 1} of {activeJourney.siteIds.length}
            </Text>
            <Text style={styles.stopCardTitle}>{currentStop.name}</Text>
            <View style={styles.stopCardButtons}>
              <Pressable
                style={styles.stopCardButtonSecondary}
                onPress={() => navigation.navigate('SiteDossier', { siteId: currentStop.id })}
              >
                <Text style={styles.stopCardButtonSecondaryText}>View Dossier</Text>
              </Pressable>
              {journeyStopIndex < activeJourney.siteIds.length - 1 && (
                <Pressable
                  style={styles.stopCardButtonPrimary}
                  onPress={() => setJourneyStopIndex((i) => i + 1)}
                >
                  <Text style={styles.stopCardButtonPrimaryText}>Next Stop</Text>
                  <Ionicons name="arrow-forward" size={14} color={Colors.royal} />
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={styles.newsWrapper}>
        <ScrollView
          ref={newsScrollRef}
          style={styles.newsScroll}
          contentContainerStyle={styles.newsContent}
          showsVerticalScrollIndicator={false}
          onLayout={({ nativeEvent }) => setNewsViewportHeight(nativeEvent.layout.height)}
          onContentSizeChange={(_w, h) => setNewsContentHeight(h)}
          onScroll={({ nativeEvent }) => setNewsScrollOffset(nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          scrollEnabled={!newsScrollbarDragging}
        >
          <Text style={styles.newsSectionLabel}>Latest Discoveries</Text>
          {BIBLE_ATLAS_NEWS.map((entry) => (
            <View key={entry.id} style={styles.newsCard}>
              <Text style={styles.newsCardDate}>{entry.date}</Text>
              <Text style={styles.newsCardTitle}>{entry.title}</Text>
              <Text style={styles.newsCardSummary}>{entry.summary}</Text>
              <Text style={styles.newsCardSource}>{entry.sourceName}</Text>
            </View>
          ))}
        </ScrollView>
        <DraggableScrollbar
          contentHeight={newsContentHeight}
          viewportHeight={newsViewportHeight}
          scrollOffset={newsScrollOffset}
          thumbColor={Colors.gold}
          onScrollTo={(offset) => {
            newsScrollRef.current?.scrollTo({ y: offset, animated: false });
            setNewsScrollOffset(offset);
          }}
          onDragStart={() => setNewsScrollbarDragging(true)}
          onDragEnd={() => setNewsScrollbarDragging(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.royal },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  subtitle: { fontSize: 12.5, color: 'rgba(251,247,236,0.7)', marginTop: 4, lineHeight: 17 },
  chipRow: { flexGrow: 0 },
  chipRowContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: Colors.royalLight },
  chipActive: { backgroundColor: Colors.gold },
  chipText: { fontSize: 12, fontWeight: '700', color: 'rgba(251,247,236,0.8)' },
  chipTextActive: { color: Colors.royal },
  journeyRow: { flexGrow: 0 },
  journeyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: Colors.royalLight,
  },
  journeyCardActive: { backgroundColor: Colors.gold },
  journeyCardTitle: { fontSize: 12.5, fontWeight: '700', color: Colors.ivory },
  journeyCardTitleActive: { color: Colors.royal },
  journeyCardPerson: { fontSize: 10.5, color: 'rgba(251,247,236,0.65)', marginTop: 1 },
  journeyCardPersonActive: { color: 'rgba(13,27,76,0.7)' },
  mapArea: { height: 340, marginTop: 4 },
  stopCard: {
    position: 'absolute', left: 14, right: 14, bottom: 12,
    backgroundColor: Colors.royalLight, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: 'rgba(201,162,39,0.35)',
  },
  stopCardLabel: { fontSize: 10.5, color: Colors.gold, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  stopCardTitle: { fontSize: 15, fontWeight: '800', color: Colors.ivory, marginTop: 2 },
  stopCardButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  stopCardButtonSecondary: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.gold },
  stopCardButtonSecondaryText: { color: Colors.gold, fontWeight: '700', fontSize: 12 },
  stopCardButtonPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: Colors.gold,
  },
  stopCardButtonPrimaryText: { color: Colors.royal, fontWeight: '800', fontSize: 12 },
  newsWrapper: { flex: 1, marginTop: 10 },
  newsScroll: { flex: 1 },
  newsContent: { paddingHorizontal: 20, paddingBottom: 24 },
  newsSectionLabel: {
    fontSize: 12, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 8,
  },
  newsCard: {
    backgroundColor: Colors.royalLight, borderRadius: 12, padding: 12, marginBottom: 10,
  },
  newsCardDate: { fontSize: 10.5, color: 'rgba(251,247,236,0.55)', fontWeight: '700' },
  newsCardTitle: { fontSize: 13.5, fontWeight: '700', color: Colors.ivory, marginTop: 2 },
  newsCardSummary: { fontSize: 12, color: 'rgba(251,247,236,0.75)', marginTop: 4, lineHeight: 17 },
  newsCardSource: { fontSize: 10.5, color: Colors.gold, marginTop: 6, fontWeight: '700' },
});
