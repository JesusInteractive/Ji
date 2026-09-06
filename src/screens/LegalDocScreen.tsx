import React, { useCallback, useRef, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../theme/colors';
import type { LegalDocParams } from '../navigation/SettingsStack';
import DraggableScrollbar from '../components/DraggableScrollbar';
import { useArrowKeyScroll } from '../hooks/useArrowKeyScroll';

// Typed against just the params shape, not a specific stack's
// ParamList -- this screen is mounted both inside SettingsStack
// (Privacy Policy, Terms, AI Disclosure) and at the root navigator
// (the "About This App" modal, reachable from Home and Settings alike
// without either polluting the other's own navigation stack).
interface Props {
  route: { params: LegalDocParams };
}

// Generic read-only viewer for finalized legal/reference documents.
export default function LegalDocScreen({ route }: Props) {
  const { title, lastUpdated, intro, sectionsHeading, sections, closing } = route.params;

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
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ImageBackground source={require('../../assets/textures/parchment.jpg')} style={styles.container} resizeMode="cover">
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
          onContentSizeChange={(_width, height) => setContentHeight(height)}
          onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          scrollEnabled={!scrollbarDragging}
        >
          {lastUpdated ? <Text style={styles.updated}>Last Updated: {lastUpdated}</Text> : null}
          {intro ? <Text style={styles.body}>{intro}</Text> : null}
          {sectionsHeading ? <Text style={styles.sectionsHeading}>{sectionsHeading}</Text> : null}
          {sections.map((s) => (
            <View key={s.heading} style={styles.section}>
              <Text style={styles.heading}>{s.heading}</Text>
              <Text style={styles.body}>{s.body}</Text>
            </View>
          ))}
          {closing ? <Text style={styles.body}>{closing}</Text> : null}
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
        />
      </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, borderWidth: 5, borderColor: Colors.royal },
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  updated: { fontSize: 12, color: '#8A8474', marginBottom: 16 },
  sectionsHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.royal,
    marginTop: 4,
    marginBottom: 12,
  },
  section: { marginBottom: 14 },
  heading: { fontSize: 14, fontWeight: '700', color: Colors.royal, marginBottom: 4 },
  body: { fontSize: 13.5, lineHeight: 20, color: Colors.ink, marginBottom: 12 },
});
