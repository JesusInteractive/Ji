import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
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
import { COMMON_QUESTIONS } from '../constants/commonQuestions';
import { APPROVED_CHARITIES_SUBTITLE, APPROVED_CHARITIES_TITLE } from '../constants/approvedCharities';
import DraggableScrollbar from '../components/DraggableScrollbar';
import { useArrowKeyScroll } from '../hooks/useArrowKeyScroll';

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
  const [quickSearchText, setQuickSearchText] = useState('');
  const runQuickSearch = () => {
    const q = quickSearchText.trim();
    if (!q) return;
    navigation.navigate('Bible', { initialQuery: q });
    setQuickSearchText('');
  };
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
  // Pointer hover (iPad/Mac trackpad or mouse -- this app supports both,
  // see app.json's supportsTablet and the "Mac (Designed for iPad)"
  // destination) -- a single key covers every hoverable item on this
  // screen, not per-section state, since only one item can be hovered
  // at a time regardless of which section it's in.
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

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
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
      <ImageBackground source={require('../../assets/textures/parchment-navy.jpg')} style={styles.container} resizeMode="cover">
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
        onContentSizeChange={(_width, height) => setContentHeight(height)}
        onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        scrollEnabled={!scrollbarDragging}
      >
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t.home.title}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {QUICK_LINKS.map(({ tab, icon, labelKey }) => (
          <Pressable
            key={tab}
            // Carries the row's 47%-column width -- the inner
            // TouchableOpacity just fills this (width: 100%). Giving the
            // wrapper itself no size here was the bug: a nested
            // percentage width resolved against an unsized flex parent is
            // ambiguous, and yoga was resolving it inconsistently
            // (cramped cards, badly-wrapped labels, and a wrong
            // measurement below since onLayout was reading that same
            // ambiguous box).
            //
            // Pressable, not plain View, for hover -- onHoverIn/onHoverOut
            // is React Native's own documented hover API (unlike a bare
            // View's onPointerEnter/onPointerLeave, which isn't confirmed
            // to actually fire on this RN version/Simulator). No onPress
            // here, though -- press stays on the nested TouchableOpacity
            // below, keeping this Pressable's only job as hover detection
            // so it can't reintroduce the ScrollView gesture conflict
            // that using Pressable for press+hover together caused
            // earlier.
            style={styles.cardTile}
            onHoverIn={() => setHoveredKey(tab)}
            onHoverOut={() => setHoveredKey(null)}
            onLayout={
              tab === 'PrayerWall'
                ? (e) => setPrayerCardCenterX(e.nativeEvent.layout.x + e.nativeEvent.layout.width / 2)
                : undefined
            }
          >
            <TouchableOpacity
              style={[styles.card, hoveredKey === tab && styles.cardHovered]}
              onPress={() => navigation.navigate(tab)}
              onPressOut={() => setHoveredKey((k) => (k === tab ? null : k))}
              accessibilityRole="button"
              accessibilityLabel={t.tabs[labelKey]}
            >
              {tab === 'PrayerWall' ? (
                <MaterialCommunityIcons name="hands-pray" size={32} color={Colors.gold} />
              ) : (
                <Ionicons name={icon} size={32} color={Colors.gold} />
              )}
              <Text style={styles.cardLabel}>{t.tabs[labelKey]}</Text>
            </TouchableOpacity>
          </Pressable>
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

      <ImageBackground
        source={require('../../assets/textures/parchment.jpg')}
        style={styles.verseCard}
        imageStyle={styles.verseCardImage}
        accessibilityLabel={`Today's promise, ${dailyPromise.reference}`}
      >
        <View style={styles.verseCardLabel}>
          <Ionicons name="sunny" size={12} color={Colors.gold} />
          <Text style={styles.verseCardLabelText}>Today's Promise</Text>
        </View>
        <Text style={styles.verseText}>"{dailyPromise.text}"</Text>
        <Text style={styles.verseRef}>{dailyPromise.reference}</Text>
      </ImageBackground>

      <Pressable onHoverIn={() => setHoveredKey('wordSearch')} onHoverOut={() => setHoveredKey(null)}>
        <TouchableOpacity
          style={[styles.aboutCard, styles.firstBottomCard, hoveredKey === 'wordSearch' && styles.aboutCardHovered]}
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
      </Pressable>

      <Pressable onHoverIn={() => setHoveredKey('trivia')} onHoverOut={() => setHoveredKey(null)}>
        <TouchableOpacity
          style={[styles.aboutCard, hoveredKey === 'trivia' && styles.aboutCardHovered]}
          onPress={() =>
            // Same root-level-modal pattern as WordSearch just above --
            // see RootNavigator.tsx's own comment.
            navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Trivia')
          }
          accessibilityRole="button"
          accessibilityLabel="Bible Trivia -- multiple choice questions on scripture, solo or with a group"
        >
          <Ionicons name="help-circle-outline" size={16} color={Colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.aboutCardTitle}>Bible Trivia</Text>
            <Text style={styles.aboutCardSubtitle}>Test your knowledge, solo or with a group</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
        </TouchableOpacity>
      </Pressable>

      <Pressable onHoverIn={() => setHoveredKey('jiRadio')} onHoverOut={() => setHoveredKey(null)}>
        <TouchableOpacity
          style={[styles.aboutCard, hoveredKey === 'jiRadio' && styles.aboutCardHovered]}
          onPress={() =>
            // Same root-level-modal pattern as WordSearch just above --
            // see RootNavigator.tsx and JIRadioScreen.tsx's own comments.
            navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('JIRadio')
          }
          accessibilityRole="button"
          accessibilityLabel="24/7 Global Praise and Worship -- worship radio"
        >
          <Ionicons name="radio-outline" size={16} color={Colors.gold} />
          <View style={{ flex: 1 }}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.aboutCardTitle}>24/7 Global Praise and Worship</Text>
              {/* Static for now -- JIRadioScreen's own banner flips off
                  automatically once radio_config is seeded (see its
                  comment), but Home doesn't fetch that state, so this tag
                  needs a manual removal at the same time. */}
              <View style={styles.comingSoonTag}>
                <Text style={styles.comingSoonTagText}>Coming Soon</Text>
              </View>
            </View>
            <Text style={styles.aboutCardSubtitle}>Launching soon</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
        </TouchableOpacity>
      </Pressable>

      <View style={styles.quickSearchBar}>
        <Ionicons name="search" size={16} color={Colors.gold} />
        <TextInput
          style={styles.quickSearchInput}
          placeholder="Quick Scripture Search (e.g. John 3:16)"
          placeholderTextColor={Colors.muted}
          value={quickSearchText}
          onChangeText={setQuickSearchText}
          onSubmitEditing={runQuickSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
        {quickSearchText.length > 0 && (
          <TouchableOpacity onPress={runQuickSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-forward-circle" size={22} color={Colors.gold} />
          </TouchableOpacity>
        )}
      </View>

      <Pressable onHoverIn={() => setHoveredKey('gospelTranslator')} onHoverOut={() => setHoveredKey(null)}>
        <TouchableOpacity
          style={[styles.aboutCard, hoveredKey === 'gospelTranslator' && styles.aboutCardHovered]}
          onPress={() =>
            // Same root-level-modal pattern as WordSearch/JIRadio above --
            // see RootNavigator.tsx and GospelTranslatorScreen.tsx's own
            // comments. Placed directly below Quick Scripture Search so
            // it's within easy reach on Home, not buried in a submenu.
            navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('GospelTranslator')
          }
          accessibilityRole="button"
          accessibilityLabel="Gospel Translator -- live two-way speech translation for sharing the gospel across languages"
        >
          <Ionicons name="language-outline" size={16} color={Colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.aboutCardTitle}>Gospel Translator</Text>
            <Text style={styles.aboutCardSubtitle}>Live, two-way speech translation for sharing the gospel</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
        </TouchableOpacity>
      </Pressable>

      <Pressable onHoverIn={() => setHoveredKey('commonQuestions')} onHoverOut={() => setHoveredKey(null)}>
        <TouchableOpacity
          style={[styles.aboutCard, hoveredKey === 'commonQuestions' && styles.aboutCardHovered]}
          onPress={() =>
            // Same root-level-modal pattern as the two cards above --
            // reuses LegalDocScreen via the same "AboutApp" route with
            // different params, see commonQuestions.ts's own comment.
            navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('AboutApp', COMMON_QUESTIONS)
          }
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

      <Pressable onHoverIn={() => setHoveredKey('aboutApp')} onHoverOut={() => setHoveredKey(null)}>
        <TouchableOpacity
          style={[styles.aboutCard, hoveredKey === 'aboutApp' && styles.aboutCardHovered]}
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
      </Pressable>

      <Pressable onHoverIn={() => setHoveredKey('approvedCharities')} onHoverOut={() => setHoveredKey(null)}>
        <TouchableOpacity
          style={[styles.aboutCard, hoveredKey === 'approvedCharities' && styles.aboutCardHovered]}
          onPress={() =>
            // Same root-level-modal pattern as the cards above -- does NOT
            // open a browser itself, just navigates in-app to the list
            // screen, where each row opens its own giving page.
            navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('ApprovedCharities')
          }
          accessibilityRole="button"
          accessibilityLabel={`${APPROVED_CHARITIES_TITLE} -- ${APPROVED_CHARITIES_SUBTITLE}`}
        >
          <Ionicons name="heart-outline" size={16} color={Colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.aboutCardTitle}>{APPROVED_CHARITIES_TITLE}</Text>
            <Text style={styles.aboutCardSubtitle}>{APPROVED_CHARITIES_SUBTITLE}</Text>
            <View style={styles.charityChipRow}>
              {['Gospel', 'Life', 'Children', 'Rescue', 'Animals'].map((label) => (
                <View key={label} style={styles.charityChip}>
                  <Text style={styles.charityChipText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
        </TouchableOpacity>
      </Pressable>
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
      </ImageBackground>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.royal,
  },
  container: {
    flex: 1,
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
    paddingBottom: 90,
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
  // The actual flex-row column -- sized here, not on the TouchableOpacity
  // inside it (see this tile's own comment in the render above).
  cardTile: {
    width: '47%',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.royalLight,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  // Pointer-hover highlight (iPad/Mac trackpad or mouse) -- a soft glow,
  // not a hard outline: a warm background tint plus a diffuse gold
  // shadow, rather than a visible border stroke.
  cardHovered: {
    backgroundColor: '#28398C',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 6,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.ivory,
  },
  verseCard: {
    marginTop: 14,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  verseCardImage: {
    borderRadius: 14,
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
  // Same soft-glow hover treatment as the grid cards' cardHovered above.
  aboutCardHovered: {
    backgroundColor: '#28398C',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 5,
  },
  quickSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    backgroundColor: Colors.royalLight,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.35)',
  },
  quickSearchInput: { flex: 1, height: 40, fontSize: 14, color: Colors.ivory },
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
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  comingSoonTag: {
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  comingSoonTagText: { fontSize: 9, fontWeight: '800', color: Colors.royal },
  charityChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  charityChip: {
    backgroundColor: 'rgba(201,162,39,0.16)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  charityChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gold,
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
    color: Colors.ink,
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
