// One shared detail screen for every site on the Global Map -- reused
// via route params (`{ siteId }`) rather than one screen per site, so
// the starter set (and any future growth) never needs new navigation
// routes. Presented as a sheet over the map (RootNavigator registers
// this route with `presentation: 'transparentModal'`), so GlobalMapScreen
// stays mounted and visible behind it, per explicit design direction --
// tapping a pin should feel like the map is still there, not a hard cut
// to a new page.
//
// The header is a large media block, in strict fallback order so no
// site ever shows an empty "no media" card:
//   1. A real embedded live camera when one genuinely exists
//      (`site.liveFeedUrl`, badged LIVE -- never faked, see
//      bibleSites.ts's own comment on why this is only set where it's
//      been verified as a real, currently-operating public stream).
//   2. A real on-location photo when one is sourced (`site.photoUrl`,
//      badged "ON LOCATION").
//   3. A live satellite look-down centered on the site's own real
//      coordinates (Apple MapKit satellite tiles via the same
//      `react-native-maps` the globe uses, badged "SATELLITE VIEW") --
//      this is the default filler for the large majority of sites that
//      will never have a shrine cam or a sourced photo, and it needs no
//      per-site asset sourcing since it's generated from the coordinate
//      that already exists in the data.
// A one-line "Pin · lat, lng · name · media type · Live cam: status"
// caption under the media block always states plainly which of the
// three this is -- never leave the viewer guessing what they're looking at.
import React, { useRef, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import MapView from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { BIBLE_SITES, type ClaimBadge } from '../data/bibleSites';
import { getVerse, getCharacters } from '../services/bibleGamesContent';
import DraggableScrollbar from '../components/DraggableScrollbar';

type Props = NativeStackScreenProps<RootStackParamList, 'SiteDossier'>;

const BADGE_LABELS: Record<ClaimBadge, string> = {
  text: 'Text',
  fact: 'Second Temple fact',
  'present-day': 'Present-day',
  vision: 'Vision',
  diagram: 'Diagram',
  pack: 'Interpretation pack',
  movement: 'Contemporary movement',
};

type PackChoice = 'futurist' | 'historical' | 'symbolic';
const PACK_LABELS: Record<PackChoice, string> = {
  futurist: 'Futurist',
  historical: 'Historical',
  symbolic: 'Symbolic',
};

export default function SiteDossierScreen({ route, navigation }: Props) {
  const { siteId } = route.params;
  const site = BIBLE_SITES.find((s) => s.id === siteId);

  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollbarDragging, setScrollbarDragging] = useState(false);
  const [packChoice, setPackChoice] = useState<PackChoice>('futurist');

  if (!site) {
    return (
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <Text style={styles.notFound}>Site not found.</Text>
        </SafeAreaView>
      </View>
    );
  }

  const characters = getCharacters();
  const relatedCharacters = site.relatedCharacterIds
    .map((id) => characters.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);
  const relatedSites = (site.relatedSiteIds ?? [])
    .map((id) => BIBLE_SITES.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s);

  return (
    <View style={styles.backdrop}>
      <Pressable style={styles.backdropTapArea} onPress={() => navigation.goBack()} accessibilityLabel="Close" accessibilityRole="button" />
      <SafeAreaView style={styles.sheetSafeArea} edges={['bottom']}>
        <View style={styles.sheet}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>
          <Pressable
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={20} color={Colors.ivory} />
          </Pressable>

          <View style={styles.scrollWrapper}>
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
            <View style={styles.media}>
              {site.liveFeedUrl ? (
                <>
                  <WebView source={{ uri: site.liveFeedUrl }} style={StyleSheet.absoluteFill} />
                  <View style={[styles.mediaBadge, styles.liveBadge]}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                </>
              ) : site.photoUrl ? (
                <>
                  <Image source={{ uri: site.photoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  <View style={styles.mediaBadge}>
                    <Text style={styles.mediaBadgeText}>ON LOCATION</Text>
                  </View>
                </>
              ) : (
                <>
                  <MapView
                    style={StyleSheet.absoluteFill}
                    mapType="satellite"
                    scrollEnabled
                    zoomEnabled
                    pitchEnabled
                    rotateEnabled
                    {...(site.satelliteCamera
                      ? {
                          initialCamera: {
                            center: { latitude: site.satelliteCamera.latitude, longitude: site.satelliteCamera.longitude },
                            heading: site.satelliteCamera.heading ?? 0,
                            pitch: site.satelliteCamera.pitch ?? 0,
                            altitude: site.satelliteCamera.altitude ?? 600,
                            zoom: 16,
                          },
                        }
                      : {
                          initialRegion: {
                            latitude: site.coordinates.lat,
                            longitude: site.coordinates.lng,
                            latitudeDelta: 0.12,
                            longitudeDelta: 0.12,
                          },
                        })}
                  />
                  <View style={styles.mediaBadge}>
                    <Text style={styles.mediaBadgeText}>SATELLITE -- pinch to explore</Text>
                  </View>
                </>
              )}
            </View>
            <Text style={styles.mediaCaption}>
              Pin · {site.coordinates.lat.toFixed(4)}, {site.coordinates.lng.toFixed(4)} · {site.name} ·{' '}
              {site.liveFeedUrl ? 'Live camera' : site.photoUrl ? 'On-location photo' : 'Satellite look-down'} · Live
              cam: {site.liveFeedUrl ? 'this location' : 'none'}
            </Text>

            <View style={styles.eraRow}>
              {site.eras.map((era) => (
                <View key={era} style={styles.eraBadge}>
                  <Text style={styles.eraBadgeText}>{era}</Text>
                </View>
              ))}
            </View>
            <View style={styles.titleRow}>
              <Ionicons name="location" size={18} color={Colors.gold} />
              <Text style={styles.title}>{site.name}</Text>
            </View>
            {site.aliases && site.aliases.length > 0 && (
              <Text style={styles.aliases}>Also known as: {site.aliases.join(', ')}</Text>
            )}
            <Text style={styles.summary}>{site.summary}</Text>

            {site.nonGeographic && (
              <View style={styles.nonGeoBanner}>
                <Ionicons name="cloud-outline" size={14} color={Colors.gold} />
                <Text style={styles.nonGeoBannerText}>Not a physical location -- see the note below.</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>What Happened Here</Text>
              <Text style={styles.body}>{site.whatHappened}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Scripture</Text>
              {(site.badgedReferences ?? site.keyReferences.map((reference) => ({ reference, badge: 'text' as const }))).map(
                (entry, i) => {
                  const verse = getVerse(entry.reference);
                  return (
                    <View key={i} style={styles.verseCard}>
                      <View style={styles.verseHeaderRow}>
                        <Text style={styles.verseReference}>
                          {verse.bookName} {entry.reference.chapter}:{entry.reference.verse}
                        </Text>
                        <View style={[styles.claimBadge, styles[`claimBadge_${entry.badge}` as const]]}>
                          <Text style={styles.claimBadgeText}>{BADGE_LABELS[entry.badge]}</Text>
                        </View>
                      </View>
                      <Text style={styles.verseText}>"{verse.text}"</Text>
                      {'note' in entry && entry.note && <Text style={styles.verseNote}>{entry.note}</Text>}
                    </View>
                  );
                }
              )}
            </View>

            {relatedCharacters.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Related People</Text>
                <View style={styles.pillRow}>
                  {relatedCharacters.map((c) => (
                    <View key={c.id} style={styles.pill}>
                      <Text style={styles.pillText}>{c.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {site.dossier?.archaeology && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Archaeology</Text>
                <Text style={styles.body}>{site.dossier.archaeology}</Text>
              </View>
            )}

            {site.dossier?.excavationHistory && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Excavation History</Text>
                <Text style={styles.body}>{site.dossier.excavationHistory}</Text>
              </View>
            )}

            {site.dossier?.scholarlyDebate && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Scholarly Debate</Text>
                <Text style={styles.body}>{site.dossier.scholarlyDebate}</Text>
              </View>
            )}

            {site.liveFeedUrl && (
              <Pressable onPress={() => Linking.openURL(site.liveFeedUrl!)}>
                <Text style={styles.openExternalLink}>Open live camera in browser</Text>
              </Pressable>
            )}

            {relatedSites.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Related Sites</Text>
                <View style={styles.pillRow}>
                  {relatedSites.map((s) => (
                    <Text
                      key={s.id}
                      style={styles.linkPill}
                      onPress={() => navigation.push('SiteDossier', { siteId: s.id })}
                    >
                      {s.name}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {site.interpretationPack && (
              <View style={styles.section}>
                <View style={styles.packHeaderRow}>
                  <Text style={styles.sectionLabel}>Interpretation Pack</Text>
                  <View style={[styles.claimBadge, styles.claimBadge_pack]}>
                    <Text style={styles.claimBadgeText}>One reading among several</Text>
                  </View>
                </View>
                <View style={styles.packSelector}>
                  {(['futurist', 'historical', 'symbolic'] as PackChoice[]).map((choice) => (
                    <Pressable
                      key={choice}
                      style={[styles.packChip, packChoice === choice && styles.packChipActive]}
                      onPress={() => setPackChoice(choice)}
                    >
                      <Text style={[styles.packChipText, packChoice === choice && styles.packChipTextActive]}>
                        {PACK_LABELS[choice]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.body}>{site.interpretationPack[packChoice]}</Text>
              </View>
            )}
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
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  backdropTapArea: { height: 60 },
  sheetSafeArea: { flex: 1 },
  sheet: {
    flex: 1, backgroundColor: Colors.royal, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    overflow: 'hidden',
  },
  handleRow: { alignItems: 'center', paddingVertical: 8 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(251,247,236,0.3)' },
  closeButton: {
    position: 'absolute', top: 6, right: 12, width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.royalLight, alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  scrollWrapper: { flex: 1 },
  notFound: { color: Colors.ivory, textAlign: 'center', marginTop: 40 },
  content: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  media: {
    width: '100%', height: 220, borderRadius: 14, backgroundColor: Colors.royalLight,
    overflow: 'hidden', marginBottom: 16,
  },
  mediaPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mediaCaption: {
    fontSize: 10.5, color: 'rgba(251,247,236,0.5)', marginTop: 6, marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
  mediaPlaceholderText: { fontSize: 12, color: 'rgba(251,247,236,0.45)' },
  mediaBadge: {
    position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(13,27,76,0.85)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  liveBadge: { backgroundColor: 'rgba(192,57,43,0.9)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white },
  liveBadgeText: { fontSize: 10.5, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
  mediaBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5 },
  eraRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  eraBadge: { backgroundColor: Colors.royalLight, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  eraBadgeText: { fontSize: 10.5, fontWeight: '700', color: Colors.gold },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.ivory },
  aliases: { fontSize: 12, color: 'rgba(251,247,236,0.6)', marginTop: 2, fontStyle: 'italic' },
  summary: { fontSize: 14.5, color: 'rgba(251,247,236,0.85)', marginTop: 10, lineHeight: 21 },
  section: { marginTop: 20 },
  sectionLabel: {
    fontSize: 12, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 8,
  },
  body: { fontSize: 14, color: 'rgba(251,247,236,0.85)', lineHeight: 20 },
  verseCard: { backgroundColor: Colors.royalLight, borderRadius: 12, padding: 12, marginBottom: 8 },
  verseHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 },
  verseReference: { fontSize: 12.5, fontWeight: '800', color: Colors.gold },
  verseText: { fontSize: 13.5, color: Colors.ivory, lineHeight: 19, fontStyle: 'italic' },
  verseNote: { fontSize: 11.5, color: 'rgba(251,247,236,0.6)', marginTop: 6, lineHeight: 16 },
  nonGeoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.royalLight,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginTop: 10, alignSelf: 'flex-start',
  },
  nonGeoBannerText: { fontSize: 11.5, color: Colors.gold, fontWeight: '700' },
  claimBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  claimBadgeText: { fontSize: 9.5, fontWeight: '800', color: Colors.royal, letterSpacing: 0.2 },
  claimBadge_text: { backgroundColor: 'rgba(251,247,236,0.7)' },
  claimBadge_fact: { backgroundColor: '#6FCF97' },
  claimBadge_vision: { backgroundColor: '#A66DD4' },
  claimBadge_diagram: { backgroundColor: '#5B8DEF' },
  claimBadge_pack: { backgroundColor: Colors.gold },
  claimBadge_movement: { backgroundColor: '#FFB454' },
  'claimBadge_present-day': { backgroundColor: '#4ECDC4' },
  packHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  packSelector: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  packChip: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center', backgroundColor: Colors.royalLight },
  packChipActive: { backgroundColor: Colors.gold },
  packChipText: { fontSize: 12, fontWeight: '700', color: Colors.ivory },
  packChipTextActive: { color: Colors.royal },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: Colors.royalLight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontSize: 12.5, fontWeight: '700', color: Colors.ivory },
  linkPill: {
    backgroundColor: Colors.royalLight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
    fontSize: 12.5, fontWeight: '700', color: Colors.gold, textDecorationLine: 'underline',
  },
  openExternalLink: { fontSize: 12.5, fontWeight: '700', color: Colors.gold, textDecorationLine: 'underline', marginTop: 16 },
});
