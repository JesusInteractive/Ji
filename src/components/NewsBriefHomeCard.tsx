// Home's bottom-of-page "Jesus Interactive News Brief" module -- sits in
// the exact spot the old CBN/"24/7 News TV" placeholder (NewsTvPreview.tsx,
// removed) was reserved for, now backed by the real thing instead of a
// dev-only mock. Per direct request, this reads as a constant flow of
// video clips (the "24/7" live-feed feeling the CBN slot was meant to
// have) -- it auto-cycles through the fetched YouTube clips' thumbnails,
// crossfading every few seconds, and hands off to the full
// NewsWatchScreen (with the real embedded player, Now Brief, On This
// Day, and every Headline) on tap. Falls back to cycling headlines if
// video clips haven't loaded, and never blocks or breaks Home if the
// fetch fails outright.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { fetchNewsBrief, type NewsBriefHeadline, type NewsBriefVideoClip } from '../services/newsBriefApi';

const CLIP_INTERVAL_MS = 4500;
const FADE_MS = 350;

export default function NewsBriefHomeCard({ onPress }: { onPress: () => void }) {
  const [clips, setClips] = useState<NewsBriefVideoClip[]>([]);
  const [headlines, setHeadlines] = useState<NewsBriefHeadline[]>([]);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    fetchNewsBrief()
      .then((result) => {
        if (cancelled) return;
        if (result.videoClips.length > 0) setClips(result.videoClips);
        else if (result.headlines.length > 0) setHeadlines(result.headlines);
      })
      .catch(() => {
        // Stay empty -- the generic fallback clip below covers this,
        // and NewsWatchScreen.tsx will retry the real fetch when opened.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const itemCount = clips.length || headlines.length;

  useEffect(() => {
    if (itemCount < 2) return;
    const id = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() => {
        setIndex((i) => (i + 1) % itemCount);
        Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start();
      });
    }, CLIP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [itemCount, opacity]);

  const currentClip = clips[index];
  const currentHeadline = !clips.length ? headlines[index] : undefined;

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Jesus Interactive News Brief -- Christian video clips and headlines with source credit"
      style={[styles.card, hovered && styles.cardHovered]}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="videocam" size={16} color={Colors.gold} />
          <View style={styles.liveDot} />
        </View>
        <Text style={styles.title}>Jesus Interactive News Brief</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
      </View>

      {currentClip ? (
        <Animated.View style={{ opacity }}>
          <View style={styles.thumbWrap}>
            <Image source={{ uri: currentClip.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.playOverlay}>
              <Ionicons name="play-circle" size={44} color="rgba(255,255,255,0.92)" />
            </View>
          </View>
          <Text style={styles.clipTitle} numberOfLines={2}>{currentClip.title}</Text>
          <Text style={styles.clipSource}>{currentClip.channelName}</Text>
        </Animated.View>
      ) : (
        <Animated.View style={{ opacity }}>
          <Text style={styles.clipTitle} numberOfLines={2}>
            {currentHeadline?.title || 'Today\'s Christian headlines and video clips, with source credit for every story.'}
          </Text>
          {currentHeadline && <Text style={styles.clipSource}>{currentHeadline.source}</Text>}
        </Animated.View>
      )}

      {itemCount > 1 && (
        <View style={styles.dots}>
          {Array.from({ length: itemCount }).map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.royalLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    minHeight: 118,
  },
  cardHovered: { opacity: 0.9 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.gold,
    borderWidth: 1.5,
    borderColor: Colors.royalLight,
  },
  title: { flex: 1, fontSize: 13, fontWeight: '800', color: Colors.white, letterSpacing: 0.5, textTransform: 'uppercase' },
  thumbWrap: { width: '100%', aspectRatio: 16 / 9, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000', marginBottom: 10 },
  thumb: { width: '100%', height: '100%' },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  clipTitle: { fontSize: 15, fontWeight: '700', color: Colors.ivory, lineHeight: 21 },
  clipSource: { fontSize: 12, fontWeight: '700', color: Colors.gold, marginTop: 6 },
  dots: { flexDirection: 'row', gap: 5, marginTop: 12 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { backgroundColor: Colors.gold },
});
