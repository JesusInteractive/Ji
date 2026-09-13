// "24/7 News Watch" -- a Jesus-Interactive-owned landing screen listing
// free Christian news sources, reached from a Home card placed directly
// under "24/7 Global Praise and Worship". Same treatment as
// SermonsLandingScreen.tsx: every row is a plain outbound Linking.openURL
// (opens the OS's own in-app browser, never framed/embedded), no
// third-party logos, no license/partnership needed for a plain outbound
// link. Jesus Interactive doesn't host or monetize any of this content.
//
// A couple of entries from the original source list were swapped or
// dropped after checking each URL:
// - CBN's dedicated live-TV-channel page (cbn.com/news/live) requires a
//   paid "CBN Family" subscription -- linked to cbn.com/news (their free
//   general news articles) instead.
// - GOD TV's live watch page (watch.god.tv) returned an error page on
//   the one check made and has had paid tiers historically -- only their
//   free YouTube channel is linked here until that's confirmed free.
import React, { useCallback, useRef, useState } from 'react';
import { Alert, ImageBackground, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import DraggableScrollbar from '../components/DraggableScrollbar';
import { useArrowKeyScroll } from '../hooks/useArrowKeyScroll';

const NEWS_SOURCES: { label: string; url: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'CBN News', url: 'https://cbn.com/news', icon: 'newspaper-outline' },
  { label: 'CBN News -- YouTube', url: 'https://www.youtube.com/@CBNnewsonline', icon: 'logo-youtube' },
  { label: 'The Christian Post', url: 'https://www.christianpost.com/news', icon: 'document-text-outline' },
  { label: 'Christianity Today', url: 'https://www.christianitytoday.com/news/', icon: 'globe-outline' },
  { label: 'Baptist Press', url: 'https://www.baptistpress.com/', icon: 'megaphone-outline' },
  { label: 'Charisma News', url: 'https://mycharisma.com/category/news/', icon: 'flame-outline' },
  { label: 'The Pour Over', url: 'https://www.thepourover.org/', icon: 'mail-outline' },
  { label: 'GOD TV -- YouTube', url: 'https://www.youtube.com/@godtv', icon: 'tv-outline' },
];

function openLink(url: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert('Could not open link', 'Please try again in a moment.');
  });
}

export default function NewsWatchScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  // Disabled while dragging the custom scrollbar thumb -- see DraggableScrollbar.tsx's onDragStart/onDragEnd comment.
  const [scrollbarDragging, setScrollbarDragging] = useState(false);

  useArrowKeyScroll({
    getOffset: useCallback(() => scrollOffset, [scrollOffset]),
    scrollTo: useCallback((y: number) => scrollRef.current?.scrollTo({ y, animated: true }), []),
  });

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
      <Text style={styles.title}>24/7 News Watch</Text>
      <Text style={styles.intro}>Christian headlines and live reporting, updated daily.</Text>

      <View style={styles.secondaryList}>
        {NEWS_SOURCES.map((source) => (
          <TouchableOpacity
            key={source.label}
            style={styles.secondaryRow}
            onPress={() => openLink(source.url)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${source.label}`}
          >
            <Ionicons name={source.icon} size={18} color={Colors.gold} />
            <Text style={styles.secondaryRowText}>{source.label}</Text>
            <Ionicons name="open-outline" size={16} color={Colors.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.disclaimer}>
        Each source is its own free news site, not hosted by Jesus Interactive. Links open official
        sources. Jesus Interactive does not host or monetize their content.
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
    marginBottom: 28,
    lineHeight: 21,
  },
  secondaryList: { width: '100%' },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.royalLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  secondaryRowText: { flex: 1, color: Colors.ivory, fontSize: 14, fontWeight: '600' },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 24,
  },
});
