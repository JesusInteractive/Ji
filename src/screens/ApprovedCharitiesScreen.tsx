import React, { useCallback, useRef, useState } from 'react';
import { Alert, ImageBackground, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../theme/colors';
import { useI18n } from '../i18n';
import {
  APPROVED_CHARITIES_DISCLAIMER,
  APPROVED_CHARITIES_TITLE,
  APPROVED_CHARITY_CATEGORIES,
  type ApprovedCharity,
} from '../constants/approvedCharities';
import DraggableScrollbar from '../components/DraggableScrollbar';
import { useArrowKeyScroll } from '../hooks/useArrowKeyScroll';

export default function ApprovedCharitiesScreen() {
  const { t } = useI18n();
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

  const openCharity = (charity: ApprovedCharity) => {
    Linking.openURL(charity.url).catch(() => {
      Alert.alert(t.studyTools.linkErrorTitle, t.studyTools.linkErrorMessage);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Same navy parchment as HomeScreen -- "same blue as the home
          screen so it reads as one object," not its own page inside the
          book like most other screens (which stay on the tan texture). */}
      <ImageBackground source={require('../../assets/textures/parchment-navy.jpg')} style={styles.container} resizeMode="cover">
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.content}
            onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
            onContentSizeChange={(_width, height) => setContentHeight(height)}
            onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
            scrollEnabled={!scrollbarDragging}
          >
            <Text style={styles.title}>{APPROVED_CHARITIES_TITLE}</Text>
            <Text style={styles.disclaimer}>{APPROVED_CHARITIES_DISCLAIMER}</Text>

            {APPROVED_CHARITY_CATEGORIES.map((category) => (
              <View key={category.id} style={styles.section}>
                <Text style={styles.sectionLabel}>{category.label}</Text>
                {category.charities.map((charity) => (
                  <TouchableOpacity
                    key={charity.id}
                    style={styles.row}
                    onPress={() => openCharity(charity)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${charity.name} giving page`}
                  >
                    {/* Text-only mark, never an official logo -- see
                        approvedCharities.ts's own comment. Sits directly
                        on the blue now, no bordered stamp box. */}
                    <Text style={styles.mark} numberOfLines={1} adjustsFontSizeToFit>
                      {charity.mark}
                    </Text>
                    <View style={styles.rowText}>
                      <Text style={styles.rowName}>{charity.name}</Text>
                      <Text style={styles.rowSynopsis} numberOfLines={2}>
                        {charity.synopsis}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
          <DraggableScrollbar
            contentHeight={contentHeight}
            viewportHeight={viewportHeight}
            scrollOffset={scrollOffset}
            thumbColor={Colors.gold}
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
  safeArea: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 21, fontWeight: '800', color: Colors.ivory, marginBottom: 8, textAlign: 'center' },
  disclaimer: { fontSize: 12.5, lineHeight: 18, color: Colors.muted, marginBottom: 22, textAlign: 'center' },
  section: { marginBottom: 22 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  rowText: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '700', color: Colors.ivory },
  rowSynopsis: { fontSize: 12.5, lineHeight: 17.5, color: Colors.muted, marginTop: 2 },
  mark: {
    width: 46,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: Colors.gold,
  },
});
