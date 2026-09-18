import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
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
import DraggableScrollbar from '../components/DraggableScrollbar';
import NewsBriefHomeCard from '../components/NewsBriefHomeCard';
import { useArrowKeyScroll } from '../hooks/useArrowKeyScroll';

// Enlarged and floated over the Prayer Wall card (see prayerCardCenterX
// below) instead of sitting inline in the header -- was 34.
// 72: down from the original 82, which overpowered the greeting, then back
// up from 64, which read as too small once a real photo was in it.
const PROFILE_SIZE = 72;
// Space between the greeting and the first row of tiles.
const GREETING_GAP = 24;

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

type HomeTile = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  // Only Prayer Wall uses this (MaterialCommunityIcons' "hands-pray" has
  // no Ionicons equivalent) -- every other tile uses `icon` above.
  materialIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  comingSoon?: boolean;
  accessibilityLabel: string;
};

export default function HomeScreen() {
  const { t } = useI18n();
  const { profilePhotoUri, displayName } = useApp();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const { width: screenWidth } = useWindowDimensions();
  const [dailyPromise, setDailyPromise] = useState<DailyPromise>(FALLBACK_PROMISE);
  // Estimated from the grid's own layout constants (container padding
  // 20, two 47%-wide columns, 14 gap) so the button has a sane position
  // from the very first frame, then corrected to the exact measured
  // value once the "Daily Devotion" card's onLayout fires below.
  const estimatedCenterX = useMemo(() => {
    const innerWidth = screenWidth - 40;
    return 20 + 0.47 * innerWidth + 14 + 0.235 * innerWidth;
  }, [screenWidth]);
  const [profileAnchorCenterX, setProfileAnchorCenterX] = useState<number>(estimatedCenterX);
  // The greeting's height -- "Welcome, friend" and "Welcome / name" differ,
  // and the profile circle centers itself on whichever is showing.
  const [greetingHeight, setGreetingHeight] = useState(60);
  // Pointer hover (iPad/Mac trackpad or mouse) -- a single key covers
  // every hoverable tile on this screen, not per-row state.
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
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

  // Explicit 12-tile layout, per direct request: feature everything
  // Jesus Interactive actually built (Ask Jesus, the atlas, the
  // translator, the Sermon Generator, the Games Hub, Scripture) as its
  // own first-class tile; complimentary/third-party content (24/7
  // Sermons and the News Brief's headlines both link out to other
  // ministries/publishers, the JESUS film
  // is the Jesus Film Project's own work) plus a couple of personal
  // utility shortcuts (Journal, My Library) live one tap away inside the
  // single "Resources" tile instead -- see ResourcesScreen.tsx.
  //
  // "Scripture" and "Scripture Search" are deliberately two separate
  // tiles into the *same* destination (the Bible tab, which is what
  // ScriptureSearchScreen.tsx actually renders) -- there's no separate
  // search-only screen to send the second tile to, so both are honest,
  // just labeled for how someone might be looking for this feature.
  const ROW_1: HomeTile[] = [
    { key: 'chat', icon: 'chatbubble-ellipses', label: t.tabs.chat, accessibilityLabel: t.tabs.chat },
    { key: 'devotions', icon: 'sunny', label: 'Daily Devotion', accessibilityLabel: t.tabs.devotions },
  ];
  const ROW_2: HomeTile[] = [
    { key: 'jiRadio', icon: 'radio-outline', label: '24/7 Praise', comingSoon: true, accessibilityLabel: '24/7 Global Praise and Worship -- worship radio' },
    { key: 'bible', icon: 'book', label: t.tabs.bible, accessibilityLabel: t.tabs.bible },
  ];
  const ROW_3: HomeTile[] = [
    { key: 'studyTools', icon: 'library', label: t.tabs.studyTools, accessibilityLabel: t.tabs.studyTools },
    { key: 'globalMap', icon: 'map-outline', label: 'Journeys', accessibilityLabel: 'Journeys Through the Bible -- interactive biblical atlas, sites, prophets, and the Holy Land' },
  ];
  const ROW_4: HomeTile[] = [
    { key: 'gospelTranslator', icon: 'language-outline', label: 'Translator', accessibilityLabel: 'Gospel Translator -- live two-way speech translation for sharing the gospel across languages' },
    { key: 'sermonWriter', icon: 'create-outline', label: 'Sermon Generator', accessibilityLabel: 'Sermon Generator -- write a full sermon or Bible study on any topic or passage' },
  ];
  const ROW_5: HomeTile[] = [
    { key: 'scriptureSearch', icon: 'search-outline', label: 'Scripture Search', accessibilityLabel: 'Scripture Search -- find a verse or passage' },
    { key: 'prayerWall', icon: 'hand-left', materialIcon: 'hands-pray', label: t.tabs.prayerWall, accessibilityLabel: t.tabs.prayerWall },
  ];
  const ROW_6: HomeTile[] = [
    { key: 'resources', icon: 'apps-outline', label: 'Resources', accessibilityLabel: 'Resources -- sermons, news, JESUS film, and more' },
    { key: 'gamesHub', icon: 'game-controller-outline', label: 'Games', accessibilityLabel: 'Jesus Interactive Games Hub -- free Bible word and trivia games' },
  ];

  const handleTilePress = (key: string) => {
    switch (key) {
      case 'chat':
        navigation.navigate('ChatTab');
        return;
      case 'devotions':
        navigation.navigate('DailyDevotions');
        return;
      case 'jiRadio':
        rootNavigation?.navigate('JIRadio');
        return;
      case 'bible':
      case 'scriptureSearch':
        navigation.navigate('Bible');
        return;
      case 'studyTools':
        navigation.navigate('StudyTools');
        return;
      case 'globalMap':
        rootNavigation?.navigate('GlobalMap');
        return;
      case 'gospelTranslator':
        rootNavigation?.navigate('GospelTranslator');
        return;
      case 'sermonWriter':
        rootNavigation?.navigate('SermonWriter');
        return;
      case 'prayerWall':
        navigation.navigate('PrayerWall');
        return;
      case 'resources':
        rootNavigation?.navigate('Resources');
        return;
      case 'gamesHub':
        navigation.navigate('GamesTab');
        return;
    }
  };

  const renderTile = (tile: HomeTile, anchorForProfile?: boolean) => (
    <Pressable
      key={tile.key}
      style={styles.cardTile}
      onHoverIn={() => setHoveredKey(tile.key)}
      onHoverOut={() => setHoveredKey(null)}
      onLayout={
        anchorForProfile
          ? (e) => setProfileAnchorCenterX(e.nativeEvent.layout.x + e.nativeEvent.layout.width / 2)
          : undefined
      }
    >
      <TouchableOpacity
        style={[styles.card, hoveredKey === tile.key && styles.cardHovered]}
        onPress={() => handleTilePress(tile.key)}
        onPressOut={() => setHoveredKey((k) => (k === tile.key ? null : k))}
        accessibilityRole="button"
        accessibilityLabel={tile.accessibilityLabel}
      >
        {tile.comingSoon && (
          <View style={styles.comingSoonTag}>
            <Text style={styles.comingSoonTagText}>Soon</Text>
          </View>
        )}
        {tile.materialIcon ? (
          <MaterialCommunityIcons name={tile.materialIcon} size={32} color={Colors.gold} />
        ) : (
          <Ionicons name={tile.icon} size={32} color={Colors.gold} />
        )}
        <Text style={styles.cardLabel}>{tile.label}</Text>
      </TouchableOpacity>
    </Pressable>
  );

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
        <View style={styles.headerText} onLayout={(e) => setGreetingHeight(e.nativeEvent.layout.height)}>
          {displayName ? (
            <>
              <Text style={styles.titleGreeting}>Welcome</Text>
              <Text style={styles.titleName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                {displayName.trim().split(/\s+/)[0]}
              </Text>
            </>
          ) : (
            <Text style={styles.title}>{t.home.title}</Text>
          )}
        </View>
      </View>

      <View style={styles.grid}>
        {ROW_1.map((tile) => renderTile(tile, tile.key === 'devotions'))}

        <TouchableOpacity
          style={[
            styles.profileBtn,
            {
              left: profileAnchorCenterX - PROFILE_SIZE / 2,
              // Level with the middle of the greeting beside it.
              top: -(GREETING_GAP + greetingHeight / 2) - PROFILE_SIZE / 2,
            },
          ]}
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

      <View style={[styles.grid, styles.gridRowSpacing]}>{ROW_2.map((tile) => renderTile(tile))}</View>
      <View style={[styles.grid, styles.gridRowSpacing]}>{ROW_3.map((tile) => renderTile(tile))}</View>

      <ImageBackground
        source={require('../../assets/textures/parchment.jpg')}
        style={styles.verseCard}
        imageStyle={styles.verseCardImage}
        accessibilityLabel={`Today's promise, ${dailyPromise.reference}`}
      >
        <View style={styles.verseCardLabel}>
          <Ionicons name="sunny" size={12} color={Colors.goldOnLight} />
          <Text style={styles.verseCardLabelText}>Today's Promise</Text>
        </View>
        <Text style={styles.verseText}>"{dailyPromise.text}"</Text>
        <Text style={styles.verseRef}>{dailyPromise.reference}</Text>
      </ImageBackground>

      <View style={[styles.grid, styles.gridRowSpacing]}>{ROW_4.map((tile) => renderTile(tile))}</View>
      <View style={[styles.grid, styles.gridRowSpacing]}>{ROW_5.map((tile) => renderTile(tile))}</View>
      <View style={[styles.grid, styles.gridRowSpacing]}>{ROW_6.map((tile) => renderTile(tile))}</View>

      <NewsBriefHomeCard onPress={() => rootNavigation?.navigate('NewsWatch')} />
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: GREETING_GAP,
  },
  headerText: {
    width: '47%',
    marginTop: 6,
  },
  profileBtn: {
    position: 'absolute',
    zIndex: 2,
  },
  profilePhoto: {
    width: PROFILE_SIZE,
    height: PROFILE_SIZE,
    borderRadius: PROFILE_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  // "Welcome, friend" -- same 28pt as the named greeting (titleGreeting) below.
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.ivory,
    textAlign: 'center',
  },
  titleGreeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.ivory,
    textAlign: 'center',
  },
  titleName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gold,
    textAlign: 'center',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    position: 'relative',
  },
  gridRowSpacing: {
    marginTop: 14,
  },
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
  comingSoonTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  comingSoonTagText: { fontSize: 9, fontWeight: '800', color: Colors.royal },
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
    color: Colors.goldOnLight,
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
    color: Colors.goldOnLight,
    marginTop: 8,
    letterSpacing: 0.3,
  },
});
