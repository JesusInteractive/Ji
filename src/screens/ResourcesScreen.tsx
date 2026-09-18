// "Resources" -- reached from its own Home grid tile. Deliberately the
// catch-all for complimentary/third-party content (24/7 Sermons and
// News Watch both link out to other ministries' own sites; the JESUS
// film is the Jesus Film Project's own work) plus a couple of personal
// utility shortcuts (Journal, My Library) -- everything Jesus
// Interactive actually built (Ask Jesus, the atlas, the translator, the
// Sermon Generator, the Games Hub, Scripture) gets its own first-class
// Home tile instead, so this app never presents someone else's content
// as if it were a headline feature.
import React, { useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import type { MainTabParamList } from '../navigation/MainTabs';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { COMMON_QUESTIONS } from '../constants/commonQuestions';
import DraggableScrollbar from '../components/DraggableScrollbar';

const JESUS_FILM_WATCH_URL = 'https://www.jesusfilm.org/watch/jesus.html';
const JESUS_FILM_LANGUAGE_URL = 'https://www.jesusfilm.org/watch.html';

// Same open-externally-with-a-friendly-fallback pattern as
// SermonsLandingScreen.tsx's own openLink -- no video player/iframe here,
// the official Jesus Film Project site handles language selection and
// playback itself.
function openExternalLink(url: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert('Could not open link', 'Please try again in a moment.');
  });
}

export default function ResourcesScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollbarDragging, setScrollbarDragging] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
          onContentSizeChange={(_width, height) => setContentHeight(height)}
          onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          scrollEnabled={!scrollbarDragging}
        >
          <Text style={styles.title}>Resources</Text>
          <Text style={styles.subtitle}>Sermons, news, and study helps -- including links to other ministries.</Text>

          <Pressable onHoverIn={() => setHoveredKey('sermonsLanding')} onHoverOut={() => setHoveredKey(null)}>
            <TouchableOpacity
              style={[styles.aboutCard, styles.firstCard, hoveredKey === 'sermonsLanding' && styles.aboutCardHovered]}
              onPress={() => rootNavigation?.navigate('SermonsLanding')}
              accessibilityRole="button"
              accessibilityLabel="24/7 Sermons and Teaching -- free sermons and Bible teaching"
            >
              <Ionicons name="mic-outline" size={16} color={Colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.aboutCardTitle}>24/7 Sermons and Teaching</Text>
                <Text style={styles.aboutCardSubtitle}>Free sermons and Bible teaching</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
            </TouchableOpacity>
          </Pressable>

          <Pressable onHoverIn={() => setHoveredKey('passionRelics')} onHoverOut={() => setHoveredKey(null)}>
            <TouchableOpacity
              style={[styles.aboutCard, hoveredKey === 'passionRelics' && styles.aboutCardHovered]}
              onPress={() => rootNavigation?.navigate('PassionRelics')}
              accessibilityRole="button"
              accessibilityLabel="The Passion Relics -- the Shroud of Turin, crown of thorns, and other traditional relics"
            >
              <Ionicons name="ribbon-outline" size={16} color={Colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.aboutCardTitle}>The Passion Relics</Text>
                <Text style={styles.aboutCardSubtitle}>The Shroud of Turin, crown of thorns, and other traditional relics</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
            </TouchableOpacity>
          </Pressable>

          <Pressable onHoverIn={() => setHoveredKey('newsWatch')} onHoverOut={() => setHoveredKey(null)}>
            <TouchableOpacity
              style={[styles.aboutCard, hoveredKey === 'newsWatch' && styles.aboutCardHovered]}
              onPress={() => rootNavigation?.navigate('NewsHeadlines')}
              accessibilityRole="button"
              accessibilityLabel="Jesus Interactive News Brief -- Christian headlines with source credit"
            >
              <Ionicons name="newspaper-outline" size={16} color={Colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.aboutCardTitle}>Jesus Interactive News Brief</Text>
                <Text style={styles.aboutCardSubtitle}>Christian headlines with source credit</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
            </TouchableOpacity>
          </Pressable>

          <Pressable onHoverIn={() => setHoveredKey('commonQuestions')} onHoverOut={() => setHoveredKey(null)}>
            <TouchableOpacity
              style={[styles.aboutCard, hoveredKey === 'commonQuestions' && styles.aboutCardHovered]}
              onPress={() => rootNavigation?.navigate('AboutApp', COMMON_QUESTIONS)}
              accessibilityRole="button"
              accessibilityLabel="Common Questions -- salvation, baptism, communion, and more"
            >
              <Ionicons name="help-circle-outline" size={16} color={Colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.aboutCardTitle}>Common Questions</Text>
                <Text style={styles.aboutCardSubtitle}>Salvation, baptism, communion, and more</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
            </TouchableOpacity>
          </Pressable>

          <Pressable onHoverIn={() => setHoveredKey('journal')} onHoverOut={() => setHoveredKey(null)}>
            <TouchableOpacity
              style={[styles.aboutCard, hoveredKey === 'journal' && styles.aboutCardHovered]}
              onPress={() => navigation.navigate('Journal')}
              accessibilityRole="button"
              accessibilityLabel="Journal -- write what He is showing you"
            >
              <Ionicons name="journal-outline" size={16} color={Colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.aboutCardTitle}>Journal</Text>
                <Text style={styles.aboutCardSubtitle}>Write what He is showing you</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
            </TouchableOpacity>
          </Pressable>

          <Pressable onHoverIn={() => setHoveredKey('library')} onHoverOut={() => setHoveredKey(null)}>
            <TouchableOpacity
              style={[styles.aboutCard, hoveredKey === 'library' && styles.aboutCardHovered]}
              onPress={() => navigation.navigate('Library')}
              accessibilityRole="button"
              accessibilityLabel="My Library -- your saved sermons, verses, and journal notes"
            >
              <Ionicons name="albums-outline" size={16} color={Colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.aboutCardTitle}>My Library</Text>
                <Text style={styles.aboutCardSubtitle}>Your saved sermons, verses, and notes</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
            </TouchableOpacity>
          </Pressable>

          <View style={[styles.aboutCard, styles.jesusFilmCard]}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="film-outline" size={16} color={Colors.gold} />
              <Text style={styles.aboutCardTitle}>JESUS</Text>
            </View>
            <Text style={styles.jesusFilmBody}>
              The life of Jesus, dramatized from the Gospel of Luke by the Jesus Film Project -- available free in over 2,000 languages.
            </Text>
            <View style={styles.jesusFilmButtonRow}>
              <TouchableOpacity
                style={styles.jesusFilmPrimaryButton}
                onPress={() => openExternalLink(JESUS_FILM_WATCH_URL)}
                accessibilityRole="button"
                accessibilityLabel="Watch Now -- the JESUS film"
              >
                <Text style={styles.jesusFilmPrimaryButtonText}>Watch Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openExternalLink(JESUS_FILM_LANGUAGE_URL)}
                accessibilityRole="button"
                accessibilityLabel="Choose a language"
              >
                <Text style={styles.jesusFilmSecondaryLink}>Choose a language</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.royal },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.ivory },
  subtitle: { fontSize: 12.5, color: 'rgba(251,247,236,0.7)', marginTop: 4, marginBottom: 4, lineHeight: 17 },
  aboutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    backgroundColor: Colors.royalLight,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  firstCard: { marginTop: 16 },
  aboutCardHovered: {
    backgroundColor: '#28398C',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 5,
  },
  aboutCardTitle: { fontSize: 13, fontWeight: '700', color: Colors.ivory },
  aboutCardSubtitle: { fontSize: 11, color: Colors.gold, marginTop: 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  jesusFilmCard: { flexDirection: 'column', alignItems: 'flex-start', paddingVertical: 12 },
  jesusFilmBody: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 10,
  },
  jesusFilmButtonRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  jesusFilmPrimaryButton: {
    backgroundColor: Colors.gold,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  jesusFilmPrimaryButtonText: { color: Colors.royal, fontWeight: '800', fontSize: 12.5 },
  jesusFilmSecondaryLink: { color: Colors.gold, fontWeight: '700', fontSize: 12.5, textDecorationLine: 'underline' },
});
