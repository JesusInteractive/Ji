import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { getDevotion, type Devotion } from '../services/devotions';
import DraggableScrollbar from '../components/DraggableScrollbar';

// Real translation is BSB by default, matching ScriptureSearchScreen.tsx's
// own default -- keeps the passage text consistent with what Scripture
// shows if the user opens the same reference there.
const DEFAULT_TRANSLATION_ID = 'BSB';

export default function DailyDevotionsScreen() {
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Same scroll-to-bottom pattern as Study Tools/Scripture -- shows
  // immediately on load (not just after a manual scroll), since a full
  // devotion (verses + reflection + prayer) is reliably longer than one
  // screen.
  const scrollRef = useRef<ScrollView>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const recomputeInitialVisibility = (newContentHeight: number, newViewportHeight: number) => {
    if (newContentHeight && newViewportHeight) {
      setShowScrollToBottom(newContentHeight - newViewportHeight > 200);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // languageCode: the devotion's own reflection/prayer text is
      // generated in English for now -- wiring this to the app's
      // selected UI language (useI18n().language) is a one-line change
      // once that's wanted, matching how ChatScreen passes languageCode
      // through to the backend today.
      const result = await getDevotion(DEFAULT_TRANSLATION_ID, 'en');
      setDevotion(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={Colors.royal} size="large" />
      </View>
    );
  }

  if (error || !devotion) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={40} color="#A0AEC0" />
        <Text style={styles.errorText}>
          {error ?? 'Could not load today\'s devotion.'}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load} accessibilityRole="button" accessibilityLabel="Retry">
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      onLayout={({ nativeEvent }) => {
        setViewportHeight(nativeEvent.layout.height);
        recomputeInitialVisibility(contentHeight, nativeEvent.layout.height);
      }}
      onContentSizeChange={(_width, height) => {
        setContentHeight(height);
        recomputeInitialVisibility(height, viewportHeight);
      }}
      onScroll={({ nativeEvent }) => {
        const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
        const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
        setShowScrollToBottom(distanceFromBottom > 200);
        setScrollOffset(contentOffset.y);
      }}
      scrollEventThrottle={16}
    >
      <View style={styles.badge}>
        <Ionicons name="sunny" size={16} color={Colors.gold} />
        <Text style={styles.badgeText}>Day {devotion.day} of 365</Text>
      </View>

      <Text style={styles.reference}>{devotion.reference}</Text>

      <View style={styles.verseBlock}>
        {devotion.verses.map((v, i) => {
          const isNewChapter = i === 0 || devotion.verses[i - 1].chapter !== v.chapter;
          return (
            <React.Fragment key={`${v.chapter}-${v.number}`}>
              {isNewChapter && i > 0 && (
                <Text style={styles.chapterLabel}>Chapter {v.chapter}</Text>
              )}
              <Text style={styles.verseText}>
                <Text style={styles.verseNum}>{v.number} </Text>
                {v.text}
              </Text>
            </React.Fragment>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Reflection</Text>
      {devotion.reflection.split('\n\n').map((para, i) => (
        <Text key={i} style={styles.paragraph}>{para}</Text>
      ))}

      <Text style={styles.sectionTitle}>A Prayer</Text>
      <View style={styles.prayerBlock}>
        <Text style={styles.prayerText}>{devotion.prayer}</Text>
      </View>
    </ScrollView>
    <DraggableScrollbar
      contentHeight={contentHeight}
      viewportHeight={viewportHeight}
      scrollOffset={scrollOffset}
      onScrollTo={(offset) => {
        scrollRef.current?.scrollTo({ y: offset, animated: false });
        setScrollOffset(offset);
      }}
    />
    {showScrollToBottom && (
      <TouchableOpacity
        style={styles.scrollToBottomBtn}
        onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
        accessibilityLabel="Scroll to bottom"
      >
        <Ionicons name="arrow-down" size={20} color={Colors.white} />
      </TouchableOpacity>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 14.5,
    color: '#718096',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: Colors.royal,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  reference: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.royal,
    marginBottom: 14,
  },
  verseBlock: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  verseText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: Colors.ink,
  },
  verseNum: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold,
  },
  chapterLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A0AEC0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.ink,
    marginBottom: 12,
  },
  prayerBlock: {
    backgroundColor: '#EBF8FF',
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
  },
  prayerText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: Colors.royal,
    fontStyle: 'italic',
  },
  scrollToBottomBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.royal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
