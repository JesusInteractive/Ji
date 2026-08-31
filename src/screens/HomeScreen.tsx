import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import type { MainTabParamList } from '../navigation/MainTabs';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { getDailyPromise, type DailyPromise } from '../services/devotions';
import { ABOUT_APP, ABOUT_APP_CARD } from '../constants/aboutApp';
import DraggableScrollbar from '../components/DraggableScrollbar';

// Enlarged and floated over the Prayer Wall card (see prayerCardCenterX
// below) instead of sitting inline in the header -- was 34.
const PROFILE_SIZE = 56;

const QUICK_LINKS: {
  tab: Exclude<keyof MainTabParamList, 'HomeTab' | 'Profile'>;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: 'chat' | 'prayerWall' | 'bible' | 'journal' | 'studyTools' | 'devotions';
}[] = [
  { tab: 'ChatTab', icon: 'chatbubble-ellipses', labelKey: 'chat' },
  { tab: 'PrayerWall', icon: 'hand-left', labelKey: 'prayerWall' },
  { tab: 'Bible', icon: 'book', labelKey: 'bible' },
  { tab: 'Journal', icon: 'journal', labelKey: 'journal' },
  { tab: 'StudyTools', icon: 'library', labelKey: 'studyTools' },
  // Was Profile's grid spot -- Profile moved to a header icon (top-right,
  // next to the title) so this spot could go to the planned devotional
  // feature instead. See DailyDevotionsScreen.tsx.
  { tab: 'DailyDevotions', icon: 'sunny', labelKey: 'devotions' },
];

// Same default translation the rest of the app's devotional features use
// (see services/devotions.ts) -- keeps this card's text in the same
// translation as everything else, even though it no longer links to the
// full devotion.
const DEFAULT_TRANSLATION_ID = 'BSB';

// Matthew 7:7 -- shown until the real daily promise loads, and again if
// fetching it fails for any reason (offline, API hiccup). Never leaves
// this card blank or erroring; worst case it's just not "today's"
// promise specifically.
const FALLBACK_PROMISE: DailyPromise = {
  day: 0,
  reference: 'Matthew 7:7',
  text: "Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.",
};

export default function HomeScreen() {
  const { t } = useI18n();
  const { profilePhotoUri } = useApp();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { width: screenWidth } = useWindowDimensions();
  const [dailyPromise, setDailyPromise] = useState<DailyPromise>(FALLBACK_PROMISE);
  // Estimated from the grid's own layout constants (container padding
  // 20, two 47%-wide columns, 14 gap) so the button has a sane position
  // from the very first frame, then corrected to the exact measured
  // value once the Prayer Wall card's onLayout fires below. Profile has
  // no other entry point (its tab-bar button is suppressed), so this
  // can never be null/absent -- a wrong-but-close estimate is far
  // safer than Profile silently becoming unreachable if that onLayout
  // measurement is ever delayed or doesn't fire.
  const estimatedCenterX = useMemo(() => {
    const innerWidth = screenWidth - 40;
    return 20 + 0.47 * innerWidth + 14 + 0.235 * innerWidth;
  }, [screenWidth]);
  const [prayerCardCenterX, setPrayerCardCenterX] = useState<number>(estimatedCenterX);

  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getDailyPromise(DEFAULT_TRANSLATION_ID)
      .then((promise) => {
        if (!cancelled) setDailyPromise(promise);
      })
      .catch(() => {
        // Stay on FALLBACK_PROMISE -- see its own comment.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
        onContentSizeChange={(_width, height) => setContentHeight(height)}
        onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t.home.title}</Text>
          <Text style={styles.subtitle}>{t.home.subtitle}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {QUICK_LINKS.map(({ tab, icon, labelKey }) => (
          <TouchableOpacity
            key={tab}
            style={styles.card}
            onPress={() => navigation.navigate(tab)}
            accessibilityRole="button"
            accessibilityLabel={t.tabs[labelKey]}
            onLayout={
              tab === 'PrayerWall'
                ? (e) => setPrayerCardCenterX(e.nativeEvent.layout.x + e.nativeEvent.layout.width / 2)
                : undefined
            }
          >
            {tab === 'PrayerWall' ? (
              <MaterialCommunityIcons name="hands-pray" size={32} color={Colors.gold} />
            ) : (
              <Ionicons name={icon} size={32} color={Colors.gold} />
            )}
            <Text style={styles.cardLabel}>{t.tabs[labelKey]}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.profileBtn, { left: prayerCardCenterX - PROFILE_SIZE / 2 }]}
          onPress={() => navigation.navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel={t.tabs.profile}
        >
          {profilePhotoUri ? (
            <Image source={{ uri: profilePhotoUri }} style={styles.profilePhoto} />
          ) : (
            <Ionicons name="person-circle" size={PROFILE_SIZE} color={Colors.gold} />
          )}
        </TouchableOpacity>
      </View>

      <View
        style={styles.verseCard}
        accessibilityLabel={`Today's promise, ${dailyPromise.reference}`}
      >
        <View style={styles.verseCardLabel}>
          <Ionicons name="sunny" size={13} color={Colors.gold} />
          <Text style={styles.verseCardLabelText}>Today's Promise</Text>
        </View>
        <Text style={styles.verseText}>"{dailyPromise.text}"</Text>
        <Text style={styles.verseRef}>{dailyPromise.reference}</Text>
      </View>

      <TouchableOpacity
        style={[styles.aboutCard, styles.firstBottomCard]}
        onPress={() =>
          // Same root-level-modal pattern as AboutApp below -- see
          // RootNavigator.tsx's own comment on why WordSearch lives there
          // instead of nested in a tab stack.
          navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('WordSearch')
        }
        accessibilityRole="button"
        accessibilityLabel="Bible Word Search -- find hidden biblical words in a letter grid"
      >
        <Ionicons name="grid-outline" size={16} color={Colors.gold} />
        <View style={{ flex: 1 }}>
          <Text style={styles.aboutCardTitle}>Bible Word Search</Text>
          <Text style={styles.aboutCardSubtitle}>Find hidden names, places, and words</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.aboutCard}
        onPress={() =>
          // Navigates up to the root stack's own "AboutApp" modal (see
          // RootNavigator.tsx) rather than pushing into SettingsStack --
          // that used to leave the Settings tab's own stack parked on
          // this screen, so switching tabs away and back to Settings
          // reopened this instead of the settings list.
          navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('AboutApp', ABOUT_APP)
        }
        accessibilityRole="button"
        accessibilityLabel={`${ABOUT_APP_CARD.title} -- ${ABOUT_APP_CARD.subtitle}`}
      >
        <Ionicons name="apps-outline" size={16} color={Colors.gold} />
        <View style={{ flex: 1 }}>
          <Text style={styles.aboutCardTitle}>{ABOUT_APP_CARD.title}</Text>
          <Text style={styles.aboutCardSubtitle}>{ABOUT_APP_CARD.subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
      </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: Colors.royal,
  },
  // Home used to be a fixed (non-scrolling) View -- fine on the tall
  // simulator screens this was tested on, but on a real device with a
  // shorter usable height (e.g. Android's on-screen nav bar eating into
  // it), the last card could get clipped behind the tab bar with no way
  // to scroll down and reach it. paddingBottom here is deliberately
  // generous so the last card (now Bible Word Search, stacked below
  // About This App) always clears the tab bar with room to spare,
  // regardless of device height -- bumped from 32 to 48 once a second
  // card was added here, since the tab bar was visibly crowding it at 32.
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
  },
  profileBtn: {
    position: 'absolute',
    // Floats above the grid, centered (via the measured `left` passed
    // inline) on the Prayer Wall card underneath it. -24 accounts for
    // headerRow's own marginBottom, so the circle's BOTTOM edge lines up
    // with the "Where would you like to go?" subtitle just above the
    // grid, not the grid's own top edge.
    top: -(PROFILE_SIZE + 24),
    zIndex: 2,
  },
  profilePhoto: {
    width: PROFILE_SIZE,
    height: PROFILE_SIZE,
    borderRadius: PROFILE_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.ivory,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.muted,
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    position: 'relative',
  },
  card: {
    width: '47%',
    backgroundColor: Colors.royalLight,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.ivory,
  },
  verseCard: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  // Both "About This App" and "Bible Word Search" (Home's two stacked
  // bottom cards) share this style -- sized compact enough that both fit
  // in view together on typical device heights without needing to
  // scroll, rather than requiring a scroll to reach the second one.
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
  // Nudges just the first of the two stacked bottom cards further from
  // the verse above it, so the pair sits centered in the leftover space
  // between the verse and the tab bar instead of hugging the verse --
  // the second card's own marginTop (shared aboutCard style) still
  // controls the gap between the two cards themselves.
  firstBottomCard: {
    marginTop: 18,
  },
  aboutCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ivory,
  },
  aboutCardSubtitle: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  verseCardLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 10,
  },
  verseCardLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  verseText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
    color: Colors.ivory,
  },
  verseRef: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.gold,
    marginTop: 8,
    letterSpacing: 0.3,
  },
});
