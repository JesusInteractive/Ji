// Home's "Jesus Interactive News Brief" module -- an editorial card,
// not a grid tile. Deliberately its own visual system (navy/gold/cream
// literals below, not the shared tile palette) per direct design spec:
// this should feel like news, not another app-feature button. Pure
// presentational component -- HomeScreen.tsx owns the fetch and picks
// which state (loading/empty/error/this) to render.
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NAVY = '#0B1B3A';
const GOLD = '#D4AF37';
const WHITE = '#FFFFFF';
const MUTED_CREAM = 'rgba(201, 194, 176, 0.8)'; // #C9C2B0 @ 80%

function formatRelativeTime(input: Date | string): string {
  const then = typeof input === 'string' ? new Date(input) : input;
  const ms = then.getTime();
  if (Number.isNaN(ms)) return '';
  const minutes = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export interface NewsBriefCardProps {
  headline: string;
  source: string;
  publishedAt: Date | string;
  // Optional: YouTube's public feed doesn't expose clip length without
  // a paid Data API key, so this is omitted from the meta line (rather
  // than showing a fabricated duration) whenever it isn't supplied.
  duration?: string;
  thumbnailUrl: string;
  storyCount?: number;
  isLive?: boolean;
  onPress: () => void;
}

export default function NewsBriefCard({
  headline,
  source,
  publishedAt,
  duration,
  thumbnailUrl,
  storyCount,
  isLive,
  onPress,
}: NewsBriefCardProps) {
  const metaParts = [source, formatRelativeTime(publishedAt), duration].filter(Boolean);
  const accessibilityLabel = `News brief. ${headline}. ${source}. ${duration ?? ''}. Double tap to watch.`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.thumbWrap}>
        <Image source={{ uri: thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
        <View style={styles.thumbOverlay} />
        <View style={styles.playButton}>
          <Ionicons name="play" size={16} color={GOLD} style={styles.playIcon} />
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.kickerRow}>
          {isLive ? (
            <View style={styles.livePill}>
              <Text style={styles.livePillText}>LIVE</Text>
            </View>
          ) : (
            <Text style={styles.kicker}>NEWS BRIEF · TODAY</Text>
          )}
          {!!storyCount && storyCount > 1 && <Text style={styles.storyCount}>{storyCount} stories</Text>}
        </View>
        <Text style={styles.headline} numberOfLines={2}>{headline}</Text>
        <Text style={styles.meta} numberOfLines={1}>{metaParts.join(' · ')}</Text>
        <Text style={styles.action}>Watch brief  ›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  cardPressed: { opacity: 0.9 },
  thumbWrap: {
    width: '36%',
    aspectRatio: 4 / 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  thumb: { width: '100%', height: '100%' },
  thumbOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: 'rgba(11, 27, 58, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { marginLeft: 2 },
  info: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  kicker: { fontSize: 11, fontWeight: '600', color: GOLD, letterSpacing: 1.2 },
  storyCount: { fontSize: 11, fontWeight: '600', color: MUTED_CREAM },
  livePill: { backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  livePillText: { fontSize: 10.5, fontWeight: '800', color: NAVY, letterSpacing: 0.6 },
  headline: { fontSize: 16.5, fontWeight: '600', color: WHITE, lineHeight: 21, marginBottom: 6 },
  meta: { fontSize: 12, color: MUTED_CREAM, marginBottom: 8 },
  action: { fontSize: 13, fontWeight: '600', color: GOLD },
});
