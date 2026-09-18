import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../theme/colors';
import {
  fetchTestimonies,
  fetchTestimonyStats,
  postTestimony,
  reactToTestimony,
  reportTestimony,
  REACTION_EMOJI,
  type ReactionEmoji,
  type RemoteTestimony,
  type TestimonyStats,
} from '../services/testimonyApi';

// The Testimony Stream, on its own page -- previously the bottom half of
// PrayerWallScreen, split-screen with prayers. Pulled out so the whole
// screen can be the stream itself (full-height list, not a cramped
// half), and to give room for tap-to-react emoji (see REACTION_EMOJI)
// without further squeezing an already-tight composer.
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// The top-of-feed banner is what turns "a list of text" into "a shared
// space" -- real counts pulled from GET /v1/testimonies/stats (every
// device sees the same numbers, since it's one Postgres table, not
// per-device local data), not a static "welcome" message. Shown even
// while stats are still loading (with a plain "Live" badge, no number)
// so the banner doesn't pop in late and shift the feed underneath it.
function CommunityBanner({ stats }: { stats: TestimonyStats | null }) {
  return (
    <View style={styles.banner}>
      <View style={styles.bannerIcon}>
        <Ionicons name="earth" size={20} color={Colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerTitle}>Live Testimony &amp; Prayer Stream</Text>
        <Text style={styles.bannerSubtitle}>
          {stats
            ? `${stats.total.toLocaleString()} shared by believers everywhere${stats.today > 0 ? ` · ${stats.today} today` : ''} -- tap 🙏 to pray for someone`
            : 'Believers everywhere, sharing and praying in real time'}
        </Text>
      </View>
    </View>
  );
}

// 🙏 gets pulled out of the generic reaction row into its own dedicated
// button -- it's the one that actually means "I'm praying for you" here,
// not just a reaction, so it deserves its own weight (icon + label +
// count) rather than sitting as a same-size pill next to ❤️🙌🔥✨. Same
// underlying mechanism as every other reaction (testimony_reactions in
// db.js, toggled via reactToTestimony) -- no new backend needed, just a
// different UI treatment for one specific emoji.
const PRAYER_EMOJI: ReactionEmoji = '🙏';
const SECONDARY_REACTIONS = REACTION_EMOJI.filter((emoji) => emoji !== PRAYER_EMOJI);

function TestimonyCard({
  item,
  onReact,
  onReport,
}: {
  item: RemoteTestimony;
  onReact: (id: string, emoji: ReactionEmoji) => void;
  onReport: (id: string) => void;
}) {
  const countFor = (emoji: string) => item.reactions.find((r) => r.emoji === emoji)?.count ?? 0;
  const praying = item.myReactions.includes(PRAYER_EMOJI);
  const prayerCount = countFor(PRAYER_EMOJI);
  return (
    <TouchableOpacity style={styles.card} onLongPress={() => onReport(item.id)} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <Ionicons name="sparkles" size={13} color={Colors.gold} />
        <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
      </View>
      <Text style={styles.cardText}>{item.text}</Text>

      <TouchableOpacity
        style={[styles.prayButton, praying && styles.prayButtonActive]}
        onPress={() => onReact(item.id, PRAYER_EMOJI)}
        accessibilityRole="button"
        accessibilityLabel={praying ? `Stop praying for this -- ${prayerCount} praying` : `Pray for this${prayerCount ? `, ${prayerCount} already praying` : ''}`}
      >
        <Text style={styles.prayButtonEmoji}>🙏</Text>
        <Text style={[styles.prayButtonText, praying && styles.prayButtonTextActive]}>
          {praying ? 'Praying' : 'Pray for this'}
        </Text>
        {prayerCount > 0 && (
          <Text style={[styles.prayButtonCount, praying && styles.prayButtonTextActive]}>{prayerCount}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.reactionRow}>
        {SECONDARY_REACTIONS.map((emoji) => {
          const active = item.myReactions.includes(emoji);
          const count = countFor(emoji);
          return (
            <TouchableOpacity
              key={emoji}
              style={[styles.reactionPill, active && styles.reactionPillActive]}
              onPress={() => onReact(item.id, emoji)}
              accessibilityRole="button"
              accessibilityLabel={`React with ${emoji}${count ? `, ${count} so far` : ''}`}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
              {count > 0 && (
                <Text style={[styles.reactionCount, active && styles.reactionCountActive]}>{count}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

export default function TestimonyStreamScreen() {
  const [testimonies, setTestimonies] = useState<RemoteTestimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [testimonyText, setTestimonyText] = useState('');
  const [posting, setPosting] = useState(false);
  const [stats, setStats] = useState<TestimonyStats | null>(null);

  const load = useCallback(async () => {
    try {
      const rows = await fetchTestimonies();
      setTestimonies(rows);
      setHasMore(rows.length >= 30);
    } catch {
      // Silent -- the composer still works even if the initial load fails.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // Independent try/catch on purpose -- a stats failure shouldn't ever
    // block the feed itself from loading, and vice versa.
    try {
      setStats(await fetchTestimonyStats());
    } catch {
      // Silent -- the banner just falls back to its no-number copy.
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || testimonies.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = testimonies[testimonies.length - 1];
      const rows = await fetchTestimonies(oldest.createdAt);
      setTestimonies((prev) => [...prev, ...rows]);
      setHasMore(rows.length >= 30);
    } catch {
      // Silent -- next scroll attempt (or pull-to-refresh) just retries.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, testimonies]);

  const handleShare = async () => {
    const trimmed = testimonyText.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      const saved = await postTestimony(trimmed);
      setTestimonies((prev) => [saved, ...prev]);
      setTestimonyText('');
      // Optimistic -- reflects the share immediately in the banner
      // rather than waiting for the next full stats fetch.
      setStats((prev) => (prev ? { total: prev.total + 1, today: prev.today + 1 } : prev));
    } catch {
      Alert.alert("Couldn't share testimony", 'Check your connection and try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleReact = useCallback((id: string, emoji: ReactionEmoji) => {
    // Optimistic: flip the local state immediately, then reconcile with
    // whatever the server actually settled on (see reactToTestimony's
    // own comment -- it always returns authoritative counts).
    setTestimonies((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const active = t.myReactions.includes(emoji);
        const myReactions = active ? t.myReactions.filter((e) => e !== emoji) : [...t.myReactions, emoji];
        const reactions = t.reactions.some((r) => r.emoji === emoji)
          ? t.reactions.map((r) => (r.emoji === emoji ? { ...r, count: Math.max(0, r.count + (active ? -1 : 1)) } : r))
          : [...t.reactions, { emoji, count: 1 }];
        return { ...t, myReactions, reactions };
      })
    );
    reactToTestimony(id, emoji)
      .then(({ reactions, myReactions }) => {
        setTestimonies((prev) => prev.map((t) => (t.id === id ? { ...t, reactions, myReactions } : t)));
      })
      .catch(() => {
        // Leave the optimistic state as-is rather than reverting --
        // worst case it's off by one reaction until the next refresh.
      });
  }, []);

  const handleReport = useCallback((id: string) => {
    Alert.alert('Report this testimony?', "We'll flag it for review.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: () => {
          reportTestimony(id).catch(() => {});
        },
      },
    ]);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ImageBackground
        source={require('../../assets/textures/parchment.jpg')}
        style={styles.container}
        resizeMode="cover"
      >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
      <FlatList
        data={testimonies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TestimonyCard item={item} onReact={handleReact} onReport={handleReport} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.gold} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={<CommunityBanner stats={stats} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.emptyState} color={Colors.gold} />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="sparkles" size={22} color={Colors.gold} />
              <Text style={styles.emptyText}>No testimonies shared yet. Be the first to share, or the first to pray.</Text>
            </View>
          )
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color={Colors.gold} /> : null}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Share what God has done..."
          placeholderTextColor="#A0AEC0"
          value={testimonyText}
          onChangeText={setTestimonyText}
          multiline
          editable={!posting}
          accessibilityLabel="Write your testimony"
        />
        <TouchableOpacity
          style={[styles.shareBtn, posting && styles.shareBtnDisabled]}
          onPress={handleShare}
          disabled={posting}
          accessibilityRole="button"
          accessibilityLabel="Share testimony"
        >
          <Ionicons name="sparkles" size={16} color={Colors.white} />
          <Text style={styles.shareBtnText}>{posting ? 'Sharing…' : 'Share testimony'}</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#2E1F16',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: Colors.gold },
  bannerSubtitle: { fontSize: 12.5, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  cardTime: { fontSize: 11, color: '#A0AEC0', fontWeight: '600' },
  cardText: { fontSize: 14.5, color: Colors.ink, lineHeight: 21, marginBottom: 10 },
  prayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#F1F1EC',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  prayButtonActive: { backgroundColor: '#B8933E' },
  prayButtonEmoji: { fontSize: 15 },
  prayButtonText: { fontSize: 12.5, fontWeight: '700', color: '#5C5446' },
  prayButtonTextActive: { color: Colors.white },
  prayButtonCount: { fontSize: 12.5, fontWeight: '700', color: '#5C5446' },
  reactionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F1EC',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  reactionPillActive: { backgroundColor: '#FCEFCB' },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 11.5, fontWeight: '700', color: '#8A8A7A' },
  reactionCountActive: { color: '#B8933E' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 13, color: '#A0AEC0' },
  footerLoader: { paddingVertical: 16 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#E9E2D0',
    backgroundColor: 'rgba(251,246,234,0.88)',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.ink,
    maxHeight: 90,
  },
  shareBtn: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#B8933E',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnDisabled: { opacity: 0.6 },
  shareBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
});
