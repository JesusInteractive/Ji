import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import type { SettingsStackParamList } from '../navigation/SettingsStack';
import DraggableScrollbar from '../components/DraggableScrollbar';

type Props = NativeStackScreenProps<SettingsStackParamList, 'LegalDoc'>;

// Generic read-only viewer for finalized legal documents (Privacy
// Policy, Terms of Service, AI Disclosure) linked from Settings.
export default function LegalDocScreen({ route }: Props) {
  const { title, lastUpdated, intro, sections, closing } = route.params;

  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
          onContentSizeChange={(_width, height) => setContentHeight(height)}
          onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        >
          {lastUpdated ? <Text style={styles.updated}>Last Updated: {lastUpdated}</Text> : null}
          {intro ? <Text style={styles.body}>{intro}</Text> : null}
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
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  scroll: { padding: 20, paddingBottom: 40 },
  updated: { fontSize: 12, color: '#8A8474', marginBottom: 16 },
  section: { marginBottom: 14 },
  heading: { fontSize: 14, fontWeight: '700', color: Colors.royal, marginBottom: 4 },
  body: { fontSize: 13.5, lineHeight: 20, color: Colors.ink, marginBottom: 12 },
});
