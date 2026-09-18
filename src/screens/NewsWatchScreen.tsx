// "Jesus Interactive News Brief" -- the video half of the News Brief
// feature. Reached from Home's NewsBriefHomeCard (the "constant flow of
// video clips" card). The written half (Now Brief paragraph, On This
// Day, and the full Headlines list) lives on its own screen,
// NewsHeadlinesScreen.tsx, reached instead from Resources -- per direct
// request to split "written news" (Resources) from "video" (this
// screen) rather than mixing both on every entry point.
//
// Video clips are public YouTube uploads (backend/newsBriefVideoSources.js),
// embedded via YouTube's own official player (YouTubePlayer.tsx) -- not a
// licensed video feed, no CBN/live-TV branding here, none should be
// added back until an actual license exists (see NewsTvPreview.tsx's
// removal for the same reasoning).
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import DraggableScrollbar from '../components/DraggableScrollbar';
import YouTubePlayer from '../components/YouTubePlayer';
import { useArrowKeyScroll } from '../hooks/useArrowKeyScroll';
import { fetchNewsBrief, type NewsBrief } from '../services/newsBriefApi';

export default function NewsWatchScreen() {
  const scrollRef = React.useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollbarDragging, setScrollbarDragging] = useState(false);

  const [brief, setBrief] = useState<NewsBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClipIndex, setSelectedClipIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNewsBrief();
      setBrief(result);
    } catch {
      setError('Could not load video clips.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useArrowKeyScroll({
    getOffset: useCallback(() => scrollOffset, [scrollOffset]),
    scrollTo: useCallback((y: number) => scrollRef.current?.scrollTo({ y, animated: true }), []),
  });

  const videoClips = brief?.videoClips ?? [];
  const selectedClip = videoClips[selectedClipIndex] ?? videoClips[0];

  return (
    <View style={styles.container}>
    <ImageBackground source={require('../../assets/textures/parchment-navy.jpg')} style={styles.background} resizeMode="cover">
    <ScrollView
      ref={scrollRef}
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
      onContentSizeChange={(_width, height) => setContentHeight(height)}
      onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
      scrollEnabled={!scrollbarDragging}
    >
      {selectedClip ? (
        <View style={styles.hero}>
          <YouTubePlayer videoId={selectedClip.videoId} title={selectedClip.title} channelName={selectedClip.channelName} big />
          {videoClips.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clipStrip} contentContainerStyle={styles.clipStripContent}>
              {videoClips.map((clip, i) => (
                <TouchableOpacity
                  key={clip.videoId}
                  style={[styles.clipThumbWrap, i === selectedClipIndex && styles.clipThumbWrapActive]}
                  onPress={() => setSelectedClipIndex(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`Play: ${clip.title}`}
                >
                  <Image source={{ uri: clip.thumbnailUrl }} style={styles.clipThumb} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
        <>
          <View style={styles.iconWrap}>
            <Ionicons name="videocam" size={56} color={Colors.gold} />
          </View>
          <Text style={styles.title}>Jesus Interactive News Brief</Text>
          <Text style={styles.intro}>Christian video clips, updated regularly.</Text>
          <View style={styles.sectionCard}>
            {loading ? (
              <ActivityIndicator color={Colors.gold} />
            ) : error ? (
              <View>
                <Text style={styles.bodyText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={load} accessibilityRole="button" accessibilityLabel="Retry">
                  <Text style={styles.retryButtonText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.bodyText}>No video clips available right now.</Text>
            )}
          </View>
        </>
      )}

      <Text style={styles.disclaimer}>
        Clips are public YouTube uploads, played with YouTube's own player. Jesus Interactive is not
        affiliated with these channels unless a license is shown.
      </Text>
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
      thumbColor={Colors.gold}
    />
    </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  scrollView: { flex: 1 },
  content: { alignItems: 'center', padding: 32, paddingTop: 40, paddingBottom: 48 },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  intro: {
    fontSize: 14.5,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
    lineHeight: 21,
  },
  sectionCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
  },
  bodyText: { fontSize: 14, color: Colors.ivory, lineHeight: 21 },
  retryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: Colors.royalLight,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  retryButtonText: { color: Colors.gold, fontWeight: '700', fontSize: 13 },
  // Full-bleed: cancels out `content`'s own padding (32 sides, 40 top)
  // so the hero player spans edge to edge instead of sitting inset.
  hero: { width: '100%', marginTop: -40, marginHorizontal: -32, marginBottom: 8 },
  clipStrip: { marginTop: 12, paddingHorizontal: 16 },
  clipStripContent: { gap: 8, paddingRight: 4 },
  clipThumbWrap: {
    width: 96,
    height: 54,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  clipThumbWrapActive: { borderColor: Colors.gold },
  clipThumb: { width: '100%', height: '100%' },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 20,
  },
});
