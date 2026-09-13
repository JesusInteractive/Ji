// "The Passion Relics" -- reached from its own Home card, directly
// under "Journeys Through the Bible." Five sections (Shroud of Turin,
// crown of thorns, spear, nails, John's burial cloths), each with a
// media well, the scripture the tradition points back to, and an
// honest "science file" of badged claims -- tradition and science are
// never presented as if they were the biblical text itself. See
// passionRelics.ts's own comment on why the shroud section is titled
// "The Shroud of Turin," not "The Shroud of Jesus."
import React, { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { PASSION_RELICS, type RelicBadge } from '../data/passionRelics';
import { getVerse } from '../services/bibleGamesContent';
import DraggableScrollbar from '../components/DraggableScrollbar';

const BADGE_LABELS: Record<RelicBadge, string> = {
  text: 'Text',
  tradition: 'Tradition',
  science: 'Science',
  disputed: 'Disputed',
};

export default function PassionRelicsScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollbarDragging, setScrollbarDragging] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
        onContentSizeChange={(_w, h) => setContentHeight(h)}
        onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        scrollEnabled={!scrollbarDragging}
      >
        <Text style={styles.introTitle}>The Passion Relics</Text>
        <Text style={styles.introBody}>
          Objects venerated by tradition as relics of the crucifixion and burial -- each paired here with the
          scripture the tradition points back to, and an honest account of what has actually been tested and found.
        </Text>

        {PASSION_RELICS.map((relic) => (
          <View key={relic.id} style={styles.card}>
            <View style={styles.media}>
              {relic.photoUrl ? (
                <Image source={{ uri: relic.photoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={styles.mediaPlaceholder}>
                  <Ionicons name="image-outline" size={26} color="rgba(251,247,236,0.35)" />
                  <Text style={styles.mediaPlaceholderText}>No photo sourced for this relic yet</Text>
                </View>
              )}
            </View>
            {relic.photoUrl && relic.photoCredit && (
              <Text style={styles.photoCredit}>{relic.photoCredit}</Text>
            )}

            <Text style={styles.relicName}>{relic.name}</Text>
            <Text style={styles.relicSubtitle}>{relic.subtitle}</Text>

            {relic.keyReferences.map((ref, i) => {
              const verse = getVerse(ref);
              return (
                <View key={i} style={styles.verseCard}>
                  <View style={styles.verseHeaderRow}>
                    <Text style={styles.verseReference}>
                      {verse.bookName} {ref.chapter}:{ref.verse}
                    </Text>
                    <View style={[styles.badge, styles.badge_text]}>
                      <Text style={styles.badgeText}>{BADGE_LABELS.text}</Text>
                    </View>
                  </View>
                  <Text style={styles.verseText}>"{verse.text}"</Text>
                </View>
              );
            })}

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>Tradition</Text>
                <View style={[styles.badge, styles.badge_tradition]}>
                  <Text style={styles.badgeText}>{BADGE_LABELS.tradition}</Text>
                </View>
              </View>
              <Text style={styles.body}>{relic.tradition}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Science File</Text>
              {relic.scienceFile.map((claim, i) => (
                <View key={i} style={styles.claimRow}>
                  <View style={[styles.badge, styles[`badge_${claim.badge}` as const]]}>
                    <Text style={styles.badgeText}>{BADGE_LABELS[claim.badge]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.claimText}>{claim.text}</Text>
                    {claim.imageUrl && (
                      <View style={styles.claimImageWrap}>
                        <Image source={{ uri: claim.imageUrl }} style={styles.claimImage} resizeMode="cover" />
                        {claim.imageCredit && <Text style={styles.claimImageCredit}>{claim.imageCredit}</Text>}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <DraggableScrollbar
        contentHeight={contentHeight}
        viewportHeight={viewportHeight}
        scrollOffset={scrollOffset}
        thumbColor={Colors.gold}
        onScrollTo={(offset) => {
          scrollRef.current?.scrollTo({ y: offset, animated: false });
          setScrollOffset(offset);
        }}
        onDragStart={() => setScrollbarDragging(true)}
        onDragEnd={() => setScrollbarDragging(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.royal },
  content: { padding: 20, paddingBottom: 40 },
  introTitle: { fontSize: 22, fontWeight: '800', color: Colors.ivory },
  introBody: { fontSize: 13.5, color: 'rgba(251,247,236,0.8)', marginTop: 8, lineHeight: 19, marginBottom: 20 },
  card: {
    backgroundColor: Colors.royalLight, borderRadius: 16, padding: 16, marginBottom: 18,
    borderWidth: 1, borderColor: 'rgba(201,162,39,0.25)',
  },
  media: { width: '100%', height: 160, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.2)', overflow: 'hidden', marginBottom: 12 },
  mediaPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  mediaPlaceholderText: { fontSize: 11.5, color: 'rgba(251,247,236,0.45)' },
  photoCredit: { fontSize: 10, color: 'rgba(251,247,236,0.45)', marginBottom: 10, marginTop: -2 },
  relicName: { fontSize: 18, fontWeight: '800', color: Colors.ivory },
  relicSubtitle: { fontSize: 12.5, color: 'rgba(251,247,236,0.7)', marginTop: 3, marginBottom: 10, lineHeight: 17 },
  verseCard: { backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 12, padding: 12, marginBottom: 10 },
  verseHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  verseReference: { fontSize: 12.5, fontWeight: '800', color: Colors.gold },
  verseText: { fontSize: 13.5, color: Colors.ivory, lineHeight: 19, fontStyle: 'italic' },
  section: { marginTop: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sectionLabel: {
    fontSize: 11.5, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 6,
  },
  body: { fontSize: 13.5, color: 'rgba(251,247,236,0.85)', lineHeight: 19 },
  claimRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  claimText: { fontSize: 13, color: 'rgba(251,247,236,0.85)', lineHeight: 18 },
  claimImageWrap: { marginTop: 8 },
  claimImage: { width: '100%', height: 120, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.2)' },
  claimImageCredit: { fontSize: 9.5, color: 'rgba(251,247,236,0.45)', marginTop: 4 },
  badge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 9.5, fontWeight: '800', color: Colors.royal, letterSpacing: 0.2 },
  badge_text: { backgroundColor: 'rgba(251,247,236,0.7)' },
  badge_tradition: { backgroundColor: '#5B8DEF' },
  badge_science: { backgroundColor: '#6FCF97' },
  badge_disputed: { backgroundColor: '#EF6C4D' },
});
