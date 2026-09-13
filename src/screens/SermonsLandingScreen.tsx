// A Jesus-Interactive-owned landing screen for the "24/7 Sermons and
// Teaching" Home card -- deliberately NOT a raw jump straight into
// SermonAudio's homepage. Every button here is a plain outbound
// Linking.openURL (opens the OS's own in-app browser -- SFSafariViewController
// on iOS, Custom Tabs on Android -- never framed/embedded inside this
// app), matching the same pattern StudyLibraryShelvesScreen's openLink
// and ScriptureSearchScreen's Blue Letter Bible chip already use. No
// SermonAudio logo anywhere -- text-only, matching this app's own royal/
// gold styling throughout.
import React, { useCallback, useRef, useState } from 'react';
import { Alert, ImageBackground, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import DraggableScrollbar from '../components/DraggableScrollbar';
import { useArrowKeyScroll } from '../hooks/useArrowKeyScroll';

const SERMON_LIBRARY_URL = 'https://www.sermonaudio.com/';
const BROWSE_BY_PASSAGE_URL = 'https://legacy.sermonaudio.com/sermonsbible.asp';

// A few other free, no-license-needed teaching libraries alongside
// SermonAudio -- same plain-outbound-link treatment (no logos, opens the
// OS's own in-app browser, never framed/embedded).
const MORE_LIBRARIES: { label: string; url: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'BibleProject', url: 'https://bibleproject.com/', icon: 'film-outline' },
  { label: 'Grace to You', url: 'https://www.gty.org/', icon: 'mic-outline' },
  { label: 'Ligonier Ministries', url: 'https://www.ligonier.org/', icon: 'school-outline' },
  { label: 'In Touch Ministries', url: 'https://www.intouch.org/', icon: 'radio-outline' },
  // Not twft.com -- that domain redirects to CCCM's paid store (Bibles,
  // books, MP3s for purchase). This is Calvary Chapel's own free page for
  // Chuck Smith's "Word for Today" teaching -- daily podcast, video, and
  // articles, donation-supported but no paywall.
  { label: "Chuck Smith -- Word for Today", url: 'https://calvarychapel.com/pastorchuck', icon: 'sunny-outline' },
  { label: 'Desiring God -- John Piper', url: 'https://www.desiringgod.org/messages', icon: 'flame-outline' },
  { label: 'The Gospel Coalition', url: 'https://www.thegospelcoalition.org/videos/', icon: 'videocam-outline' },
  { label: 'SermonCentral', url: 'https://sermoncentral.com/', icon: 'document-text-outline' },
  { label: 'John Hagee Ministries', url: 'https://www.jhm.org/', icon: 'megaphone-outline' },
  { label: 'Insight for Living -- Chuck Swindoll', url: 'https://insight.org/broadcasts', icon: 'headset-outline' },
  { label: 'Truth For Life -- Alistair Begg', url: 'https://www.truthforlife.org/', icon: 'library-outline' },
  { label: 'Love Worth Finding -- Adrian Rogers', url: 'https://www.lwf.org/', icon: 'heart-outline' },
  { label: 'The Urban Alternative -- Tony Evans', url: 'https://tonyevans.org/podcast/', icon: 'people-outline' },
  { label: 'MLJ Trust -- Martyn Lloyd-Jones', url: 'https://mljtrust.org', icon: 'bookmarks-outline' },
  { label: 'Thru the Bible -- J. Vernon McGee', url: 'https://ttb.org/', icon: 'globe-outline' },
  { label: 'Gospel in Life -- Tim Keller', url: 'https://gospelinlife.com/', icon: 'newspaper-outline' },
  { label: 'Matt Chandler -- The Village Church', url: 'https://www.thevillagechurch.net/resources/sermons', icon: 'people-circle-outline' },
  { label: 'Francis Chan -- Crazy Love', url: 'https://crazylove.org/', icon: 'flash-outline' },
  { label: 'Louie Giglio -- Passion City Church', url: 'https://www.passioncitychurch.com/', icon: 'flame-outline' },
  { label: 'J.D. Greear -- The Summit Church', url: 'https://summitchurch.com/message-archive', icon: 'trending-up-outline' },
  { label: "Rick Warren -- Pastor Rick's Daily Hope", url: 'https://pastorrick.com/', icon: 'sunny-outline' },
  { label: 'Saddleback Church', url: 'https://saddleback.com/watch', icon: 'play-circle-outline' },
];

// A separate section per the plan -- women's Bible teaching voices,
// same free-outbound-link treatment as everything above.
const WOMENS_TEACHING: { label: string; url: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Joyce Meyer', url: 'https://joycemeyer.org/shows', icon: 'happy-outline' },
  { label: 'Beth Moore', url: 'https://lproof.org/', icon: 'book-outline' },
  { label: 'Kay Arthur -- Precepts for Life', url: 'https://www.preceptsforlife.com/', icon: 'library-outline' },
  // goingbeyond.com's own site is mostly a store (books/studies for
  // purchase) with little free teaching on the main pages -- included
  // per the list this was requested from, but worth a heads-up (see
  // this screen's own top comment).
  { label: 'Priscilla Shirer -- Going Beyond', url: 'https://goingbeyond.com/', icon: 'compass-outline' },
  { label: 'Nancy DeMoss Wolgemuth -- Revive Our Hearts', url: 'https://www.reviveourhearts.com/', icon: 'heart-outline' },
  { label: 'Lysa TerKeurst -- Proverbs 31 Ministries', url: 'https://proverbs31.org/', icon: 'journal-outline' },
  { label: 'Christine Caine', url: 'https://christinecaine.com/', icon: 'megaphone-outline' },
];

const MESSIANIC_TEACHINGS: { label: string; url: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'ONE FOR ISRAEL', url: 'https://www.oneforisrael.org/', icon: 'star-outline' },
  { label: 'First Fruits of Zion', url: 'https://ffoz.org/', icon: 'leaf-outline' },
  { label: 'Jewish Voice', url: 'https://www.jewishvoice.org/', icon: 'megaphone-outline' },
];

function openLink(url: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert('Could not open link', 'Please try again in a moment.');
  });
}

export default function SermonsLandingScreen() {
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
    <ImageBackground source={require('../../assets/textures/parchment-navy.jpg')} style={styles.container} resizeMode="cover">
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
        <Ionicons name="mic" size={56} color={Colors.gold} />
      </View>
      <Text style={styles.title}>24/7 Sermons and Teaching</Text>
      <Text style={styles.intro}>
        This is a doorway to a large free public library of sermons and Bible teaching, hosted by
        SermonAudio. Listening is free.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => openLink(SERMON_LIBRARY_URL)}
        accessibilityRole="button"
        accessibilityLabel="Open Sermon Library"
      >
        <Text style={styles.primaryButtonText}>Open Sermon Library</Text>
      </TouchableOpacity>

      <View style={styles.secondaryList}>
        <TouchableOpacity
          style={styles.secondaryRow}
          onPress={() => openLink(BROWSE_BY_PASSAGE_URL)}
          accessibilityRole="button"
          accessibilityLabel="Browse by Bible passage"
        >
          <Ionicons name="book-outline" size={18} color={Colors.gold} />
          <Text style={styles.secondaryRowText}>Browse by Bible passage</Text>
          <Ionicons name="open-outline" size={16} color={Colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryRow}
          onPress={() => openLink(SERMON_LIBRARY_URL)}
          accessibilityRole="button"
          accessibilityLabel="Browse latest sermons"
        >
          <Ionicons name="time-outline" size={18} color={Colors.gold} />
          <Text style={styles.secondaryRowText}>Browse latest sermons</Text>
          <Ionicons name="open-outline" size={16} color={Colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryRow}
          onPress={() => openLink(SERMON_LIBRARY_URL)}
          accessibilityRole="button"
          accessibilityLabel="Search speakers"
        >
          <Ionicons name="person-outline" size={18} color={Colors.gold} />
          <Text style={styles.secondaryRowText}>Search speakers</Text>
          <Ionicons name="open-outline" size={16} color={Colors.muted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>Content is hosted by SermonAudio, not by Jesus Interactive.</Text>

      <Text style={styles.sectionLabel}>Additional Teaching Ministries</Text>
      <View style={styles.secondaryList}>
        {MORE_LIBRARIES.map((lib) => (
          <TouchableOpacity
            key={lib.label}
            style={styles.secondaryRow}
            onPress={() => openLink(lib.url)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${lib.label}`}
          >
            <Ionicons name={lib.icon} size={18} color={Colors.gold} />
            <Text style={styles.secondaryRowText}>{lib.label}</Text>
            <Ionicons name="open-outline" size={16} color={Colors.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Women's Teaching</Text>
      <View style={styles.secondaryList}>
        {WOMENS_TEACHING.map((lib) => (
          <TouchableOpacity
            key={lib.label}
            style={styles.secondaryRow}
            onPress={() => openLink(lib.url)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${lib.label}`}
          >
            <Ionicons name={lib.icon} size={18} color={Colors.gold} />
            <Text style={styles.secondaryRowText}>{lib.label}</Text>
            <Ionicons name="open-outline" size={16} color={Colors.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Messianic Teachings</Text>
      <Text style={styles.sectionSubheading}>Jesus in His Jewish context</Text>
      <Text style={styles.sectionBody}>
        Short teachings on Yeshua as Israel's Messiah, the Torah, and the Hebrew Scriptures.
      </Text>
      <View style={styles.secondaryList}>
        {MESSIANIC_TEACHINGS.map((lib) => (
          <TouchableOpacity
            key={lib.label}
            style={styles.secondaryRow}
            onPress={() => openLink(lib.url)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${lib.label}`}
          >
            <Ionicons name={lib.icon} size={18} color={Colors.gold} />
            <Text style={styles.secondaryRowText}>{lib.label}</Text>
            <Ionicons name="open-outline" size={16} color={Colors.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.disclaimer}>
        Each library is its own free ministry site, not hosted by Jesus Interactive. Links open
        official sources. Jesus Interactive does not host or monetize their content.
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  primaryButton: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: { color: Colors.royal, fontWeight: '800', fontSize: 15 },
  secondaryList: { width: '100%', marginTop: 24 },
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginTop: 28,
    marginBottom: 10,
  },
  sectionSubheading: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ivory,
    marginTop: -4,
    marginBottom: 4,
  },
  sectionBody: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginBottom: 10,
  },
});
