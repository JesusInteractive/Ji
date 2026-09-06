import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import type { TriviaLeaderboardRange, TriviaScoreEntry } from '../../types/trivia';
import { fetchLeaderboard } from '../../services/triviaApi';

interface Props {
  onBack: () => void;
}

export default function LeaderboardView({ onBack }: Props) {
  const [range, setRange] = useState<TriviaLeaderboardRange>('week');
  const [entries, setEntries] = useState<TriviaScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchLeaderboard(range)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backRow} accessibilityRole="button">
        <Ionicons name="chevron-back" size={18} color={Colors.royal} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Leaderboard</Text>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, range === 'week' && styles.tabActive]} onPress={() => setRange('week')}>
          <Text style={[styles.tabText, range === 'week' && styles.tabTextActive]}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, range === 'all-time' && styles.tabActive]} onPress={() => setRange('all-time')}>
          <Text style={[styles.tabText, range === 'all-time' && styles.tabTextActive]}>All-Time</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.royal} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.emptyText}>Could not load the leaderboard. Check your connection.</Text>
      ) : entries.length === 0 ? (
        <Text style={styles.emptyText}>No scores yet -- be the first!</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>{index + 1}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {item.displayName}
              </Text>
              <Text style={styles.score}>
                {item.score}/{item.total}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backText: { color: Colors.royal, fontWeight: '600', fontSize: 14 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.royal, textAlign: 'center', marginBottom: 16 },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.muted, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.royal, borderColor: Colors.royal },
  tabText: { color: Colors.ink, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: Colors.ivory },
  emptyText: { textAlign: 'center', color: Colors.ink, opacity: 0.6, marginTop: 32, fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.25)',
  },
  rank: { width: 24, fontWeight: '800', color: Colors.gold, fontSize: 15 },
  name: { flex: 1, fontSize: 15, color: Colors.ink, fontWeight: '600' },
  score: { fontSize: 15, color: Colors.royal, fontWeight: '800' },
});
