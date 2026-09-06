import React, { useRef, useState } from 'react';
import { Alert, ImageBackground, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import { useI18n } from '../i18n';
import type { StudyToolsStackParamList } from '../navigation/StudyToolsStack';
import { CATEGORIES } from './StudyToolsScreen';
import { READ_ALOUD_TITLES } from '../constants/studyLibraryAudio';
import DraggableScrollbar from '../components/DraggableScrollbar';

type Props = NativeStackScreenProps<StudyToolsStackParamList, 'StudyLibraryShelves'>;

// A leather-spine coloring rotated by a stable hash of the title, so
// shelves don't look copy-pasted -- three tones, matching the finalized
// Read Aloud spec's asset list.
const SPINE_TONES = ['#5C3D2A', '#4A2E1C', '#6B4530'];
function spineTone(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % SPINE_TONES.length;
  return SPINE_TONES[hash];
}

export default function StudyLibraryShelvesScreen({ navigation }: Props) {
  const { t } = useI18n();

  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  // Disabled while dragging the custom scrollbar thumb -- see DraggableScrollbar.tsx's onDragStart/onDragEnd comment.
  const [scrollbarDragging, setScrollbarDragging] = useState(false);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(t.studyTools.linkErrorTitle, t.studyTools.linkErrorMessage);
    });
  };

  return (
    <View style={{ flex: 1 }}>
    <ImageBackground source={require('../../assets/textures/parchment.jpg')} style={styles.container} resizeMode="cover">
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      onContentSizeChange={(_w, height) => setContentHeight(height)}
      onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
      onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
      scrollEnabled={!scrollbarDragging}
    >
      <View style={styles.readAloudShelf}>
        <View style={styles.readAloudHeader}>
          <Ionicons name="volume-high" size={18} color={Colors.gold} />
          <Text style={styles.readAloudTitle}>{t.studyLibrary.readAloudShelfTitle}</Text>
        </View>
        <Text style={styles.readAloudSubtitle}>{t.studyLibrary.readAloudShelfSubtitle}</Text>
        <Text style={styles.readAloudDisclosure}>{t.studyLibrary.jesusVoiceDisclosure}</Text>
        <View style={styles.spineRow}>
          {READ_ALOUD_TITLES.map((title) => (
            <TouchableOpacity
              key={title.id}
              style={[styles.spine, { backgroundColor: spineTone(title.id) }]}
              onPress={() => navigation.navigate('StudyLibraryReader', { titleId: title.id })}
            >
              <View style={styles.spineBadge}>
                <Ionicons name="volume-high" size={11} color="#241A13" />
              </View>
              <Text style={styles.spineText} numberOfLines={6}>{title.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {CATEGORIES.map((category) => (
        <View key={category.heading} style={styles.category}>
          <Text style={styles.categoryHeading}>{category.heading}</Text>
          {category.note && <Text style={styles.categoryNote}>{category.note}</Text>}
          {category.resources.map((resource) => (
            <TouchableOpacity
              key={resource.title}
              style={styles.resourceRow}
              onPress={() => openLink(resource.url)}
              accessibilityRole="link"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <Text style={styles.resourceMeta}>{resource.author} · {resource.era}</Text>
              </View>
              <View style={styles.textOnlyTag}>
                <Text style={styles.textOnlyTagText}>{t.studyLibrary.textOnlyLabel}</Text>
              </View>
              <Ionicons name="open-outline" size={16} color="#A0AEC0" />
            </TouchableOpacity>
          ))}
        </View>
      ))}
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
    </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFE7D6' },
  content: { padding: 20, paddingBottom: 48 },
  readAloudShelf: {
    backgroundColor: '#2E1F16',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  readAloudHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  readAloudTitle: { fontSize: 16, fontWeight: '800', color: Colors.gold },
  readAloudSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 8 },
  readAloudDisclosure: { fontSize: 10.5, color: 'rgba(255,255,255,0.5)', lineHeight: 15, marginBottom: 14 },
  spineRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  spine: {
    width: 46,
    height: 132,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  spineBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  spineText: { color: '#E4C766', fontSize: 9, fontWeight: '700', textAlign: 'center', lineHeight: 11 },
  category: { marginBottom: 20 },
  categoryHeading: { fontSize: 17, fontWeight: '800', color: Colors.royal, marginBottom: 4 },
  categoryNote: { fontSize: 12, color: '#718096', marginBottom: 8, fontStyle: 'italic' },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  resourceTitle: { fontSize: 13.5, fontWeight: '700', color: Colors.ink },
  resourceMeta: { fontSize: 11, color: '#A0AEC0', marginTop: 2 },
  textOnlyTag: { backgroundColor: '#F1F1EC', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
  textOnlyTagText: { fontSize: 10, fontWeight: '700', color: '#8A8A7A' },
});
