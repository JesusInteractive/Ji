// The written half of "Jesus Interactive News Brief" -- Now Brief
// paragraph, On This Day, and the full Headlines list. Reached from
// Resources; the video half (YouTube clips) lives on its own screen,
// NewsWatchScreen.tsx, reached instead from Home's NewsBriefHomeCard --
// per direct request to split "written news" (here) from "video"
// (there) rather than mixing both on every entry point.
//
// This is a headline + summary brief with source attribution and
// outbound links, not a licensed video feed -- there is no CBN/live-TV
// branding anywhere in this screen, and none should be added back until
// an actual license exists (see NewsTvPreview.tsx's removal for the
// same reasoning).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ImageBackground, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import DraggableScrollbar from '../components/DraggableScrollbar';
import { useArrowKeyScroll } from '../hooks/useArrowKeyScroll';
import { fetchNewsBrief, type NewsBrief, type NewsBriefHeadline } from '../services/newsBriefApi';
import { getOnThisDay, type HistoryEntry } from '../data/christianHistory';

function openLink(url: string) {
  if (!url) return;
  Linking.openURL(url).catch(() => {
    Alert.alert('Could not open link', 'Please try again in a moment.');
  });
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMonthDay(month: number, day: number): string {
  return `${MONTH_NAMES[month - 1]} ${day}`;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'over', 'into', 'their', 'about', 'after', 'have', 'will']);

function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4 && !STOPWORDS.has(w));
}

// Deliberately conservative -- most headlines won't match any given
// day's history entry, and that's fine (spec: "If no overlap, show the
// headline alone"). A match is either a shared tag keyword appearing in
// the headline text, or a shared significant word between the two
// titles.
function findRelatedHeadline(entry: HistoryEntry, headlines: NewsBriefHeadline[]): NewsBriefHeadline | null {
  const entryWords = new Set(significantWords(entry.title));
  for (const tag of entry.tags) entryWords.add(tag.toLowerCase());
  for (const headline of headlines) {
    const headlineText = `${headline.title} ${headline.summary}`.toLowerCase();
    for (const word of entryWords) {
      if (headlineText.includes(word)) return headline;
    }
  }
  return null;
}

function findRelatedHistoryTitle(headline: NewsBriefHeadline, entries: HistoryEntry[]): string | null {
  const headlineWords = new Set(significantWords(`${headline.title} ${headline.summary}`));
  for (const entry of entries) {
    for (const tag of entry.tags) {
      if (headlineWords.has(tag.toLowerCase())) return entry.title;
    }
    for (const word of significantWords(entry.title)) {
      if (headlineWords.has(word)) return entry.title;
    }
  }
  return null;
}

export default function NewsHeadlinesScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollbarDragging, setScrollbarDragging] = useState(false);

  const [brief, setBrief] = useState<NewsBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const historyEntries = getOnThisDay(today);
  const isFromArchive = historyEntries.length > 0 && (historyEntries[0].month !== todayMonth || historyEntries[0].day !== todayDay);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNewsBrief();
      setBrief(result);
    } catch {
      // Keep whatever brief we already have (last-good-cache) -- only
      // show the error state below if we have nothing at all yet.
      setError('Could not refresh headlines.');
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

  const headlines = brief?.headlines ?? [];

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
      <View style={styles.iconWrap}>
        <Ionicons name="newspaper" size={56} color={Colors.gold} />
      </View>
      <Text style={styles.title}>Jesus Interactive News Brief</Text>
      <Text style={styles.intro}>Christian headlines with source credit. Tap to read the original.</Text>

      {/* --- Now Brief --- */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionEyebrow}>Now Brief</Text>
        {loading && !brief ? (
          <Text style={styles.bodyText}>Updating headlines…</Text>
        ) : error && !brief ? (
          <View>
            <Text style={styles.bodyText}>Could not load the brief right now.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={load} accessibilityRole="button" accessibilityLabel="Retry">
              <Text style={styles.retryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : brief && brief.briefText ? (
          <>
            <Text style={styles.bodyText}>{brief.briefText}</Text>
            <Text style={styles.timestamp}>Updated {formatRelativeTime(brief.updatedAt)}</Text>
          </>
        ) : (
          <Text style={styles.bodyText}>Updating headlines…</Text>
        )}
      </View>

      {/* --- On This Day --- */}
      {historyEntries.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>On This Day</Text>
          {isFromArchive && (
            <Text style={styles.archiveLabel}>From the archive · {formatMonthDay(historyEntries[0].month, historyEntries[0].day)}</Text>
          )}
          {historyEntries.map((entry) => {
            const related = findRelatedHeadline(entry, headlines);
            return (
              <View key={entry.title} style={styles.historyItem}>
                <Text style={styles.historyDate}>{formatMonthDay(entry.month, entry.day)}{entry.year ? `, ${entry.year}` : ''}</Text>
                <Text style={styles.historyTitle}>{entry.title}</Text>
                <Text style={styles.bodyText}>{entry.summary}</Text>
                {entry.scripture && <Text style={styles.scripture}>{entry.scripture}</Text>}
                <Text style={styles.sourceLine}>Source: {entry.source}</Text>
                {related && (
                  <TouchableOpacity onPress={() => openLink(related.link)} accessibilityRole="button" accessibilityLabel={`Related headline: ${related.title}`}>
                    <Text style={styles.relatedLink}>Related headline: {related.title}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* --- Headlines --- */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionEyebrow}>Headlines</Text>
        {headlines.length === 0 ? (
          <Text style={styles.bodyText}>{loading ? 'Updating headlines…' : 'No headlines available right now.'}</Text>
        ) : (
          <View style={styles.secondaryList}>
            {headlines.map((headline, index) => {
              const relatedTitle = findRelatedHistoryTitle(headline, historyEntries);
              return (
                <View key={`${headline.link}-${index}`} style={styles.headlineCard}>
                  <Text style={styles.headlineTitle}>{headline.title}</Text>
                  {headline.summary ? <Text style={styles.headlineSummary}>{headline.summary}</Text> : null}
                  <View style={styles.headlineMetaRow}>
                    <Text style={styles.headlineSource}>{headline.source}</Text>
                    {headline.publishedAt ? <Text style={styles.headlineTime}>· {formatRelativeTime(headline.publishedAt)}</Text> : null}
                  </View>
                  {relatedTitle && <Text style={styles.contextLine}>Context · On This Day: {relatedTitle}</Text>}
                  <TouchableOpacity
                    style={styles.readOriginalButton}
                    onPress={() => openLink(headline.link)}
                    accessibilityRole="button"
                    accessibilityLabel={`Read original: ${headline.title}`}
                  >
                    <Text style={styles.readOriginalText}>Read original</Text>
                    <Ionicons name="open-outline" size={14} color={Colors.gold} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <Text style={styles.disclaimer}>
        Headlines courtesy of each publisher. Jesus Interactive is not affiliated with these outlets
        unless a license is shown.
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
    marginBottom: 16,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  bodyText: { fontSize: 14, color: Colors.ivory, lineHeight: 21 },
  timestamp: { fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 10 },
  retryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: Colors.royalLight,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  retryButtonText: { color: Colors.gold, fontWeight: '700', fontSize: 13 },
  archiveLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 10, fontStyle: 'italic' },
  historyItem: { marginBottom: 4 },
  historyDate: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  historyTitle: { fontSize: 16, fontWeight: '700', color: Colors.white, marginBottom: 6 },
  scripture: { fontSize: 12.5, color: Colors.gold, marginTop: 8, fontStyle: 'italic' },
  sourceLine: { fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
  relatedLink: { fontSize: 12.5, color: Colors.gold, marginTop: 8, textDecorationLine: 'underline' },
  secondaryList: { width: '100%' },
  headlineCard: {
    backgroundColor: Colors.royalLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  headlineTitle: { fontSize: 15, fontWeight: '700', color: Colors.ivory, marginBottom: 6 },
  headlineSummary: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 19, marginBottom: 8 },
  headlineMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headlineSource: { fontSize: 12, fontWeight: '700', color: Colors.gold },
  headlineTime: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  contextLine: { fontSize: 11.5, color: 'rgba(255,255,255,0.6)', marginTop: 6, fontStyle: 'italic' },
  readOriginalButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  readOriginalText: { fontSize: 12.5, fontWeight: '700', color: Colors.gold },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 8,
  },
});
