import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, ImageBackground, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import type { StudyToolsStackParamList } from '../navigation/StudyToolsStack';
import { CATEGORIES } from './StudyToolsScreen';
import { READ_ALOUD_SHELVES, READ_ALOUD_TITLES } from '../constants/studyLibraryAudio';
import DraggableScrollbar from '../components/DraggableScrollbar';
import CloseToHomeButton from '../components/CloseToHomeButton';
import OpenVolume from '../components/studyLibrary/OpenVolume';
import { BOOKEND_WIDTH, BookSpine, Bookend, FlatStack, STACK_WIDTH } from '../components/studyLibrary/ShelfPieces';
import { SERIF, spineLook, type Rect, type ShelfBook, type SpineLook } from '../components/studyLibrary/libraryLook';

type Props = NativeStackScreenProps<StudyToolsStackParamList, 'StudyLibraryShelves'>;

// The library itself: a dark wood bookcase standing in the same lamp-lit
// room as the entrance (StudyLibraryEntranceScreen's still, blurred
// behind the shelves), every book in the catalog on it as a spine. The
// books Jesus can read aloud come first, on themed shelves, with a gold
// foil band and a small speaker mark; everything else is shelved by
// category. Pick one and it comes off the shelf and opens in place
// (components/studyLibrary/OpenVolume.tsx) -- no separate player screen.
//
// Shelves are packed full: a small section shares a shelf with the next
// one, each in its own bay behind a wooden divider, under its own brass
// plate. A long section runs on across as many shelves as it needs.

const IVORY = '#EDE0CC';
const UPRIGHT = 12;
const INNER = 10;
const DIVIDER = 8;
const BAYS_PER_ROW = 3;
const BOOK_GAP = 2;
const BOOK_ZONE = 140;
const LABEL_SPACE = 28;
const PLANK = 14;
const ROW_HEIGHT = LABEL_SPACE + BOOK_ZONE + PLANK;
const CROWN = 18;
const WALNUT = require('../../assets/textures/walnut.jpg');
const GUTENBERG_ID = /gutenberg\.org\/ebooks\/(\d+)/;

interface Section {
  label: string;
  books: ShelfBook[];
}

type BayItem =
  | { kind: 'book'; book: ShelfBook; look: SpineLook }
  | { kind: 'bookend'; key: string }
  | { kind: 'space'; key: string }
  | { kind: 'stack'; key: string };

interface Bay {
  key: string;
  // Only the bay where a section starts carries its plate.
  label?: string;
  items: BayItem[];
}

interface ShelfRowModel {
  key: string;
  bays: Bay[];
}

// Read Aloud titles with a themed shelf come off their category shelves
// and onto it, keeping the catalog description (when there is one) to
// show inside the opened book. Readable books without one (the Scholar's
// commentaries and references) stay in their category, marked readable.
function buildSections(fallbackShelf: string): Section[] {
  const readAloudById = new Map(READ_ALOUD_TITLES.map((title) => [title.gutenbergId, title]));
  const descriptions = new Map<number, string>();
  const placed = new Set<string>();
  const categories: Section[] = [];

  for (const category of CATEGORIES) {
    const books: ShelfBook[] = [];
    category.resources.forEach((resource, i) => {
      const gutenbergId = Number(resource.url.match(GUTENBERG_ID)?.[1]);
      const readAloud = gutenbergId ? readAloudById.get(gutenbergId) : undefined;
      if (readAloud) {
        placed.add(readAloud.id);
        if (!descriptions.has(gutenbergId)) descriptions.set(gutenbergId, resource.description);
        if (readAloud.shelf) return;
      }
      books.push({
        key: `${category.heading}|${i}`,
        title: resource.title,
        author: resource.author,
        era: resource.era,
        description: resource.description,
        url: resource.url,
        readAloud,
      });
    });
    if (books.length > 0) categories.push({ label: category.heading, books });
  }

  const shelves = new Map<string, ShelfBook[]>();
  for (const title of READ_ALOUD_TITLES) {
    const themed = !!title.shelf && READ_ALOUD_SHELVES.includes(title.shelf);
    if (!themed && placed.has(title.id)) continue;
    const shelf = themed ? title.shelf! : fallbackShelf;
    if (!shelves.has(shelf)) shelves.set(shelf, []);
    shelves.get(shelf)!.push({
      key: `read-aloud|${title.id}`,
      title: title.title,
      author: title.author,
      description: descriptions.get(title.gutenbergId),
      readAloud: title,
    });
  }
  const readAloud = [...READ_ALOUD_SHELVES, fallbackShelf]
    .filter((shelf) => shelves.has(shelf))
    .map((shelf) => ({ label: shelf, books: shelves.get(shelf)! }));
  return [...readAloud, ...categories];
}

function widthOf(items: BayItem[]) {
  return items.reduce((sum, item) => sum + (item.kind === 'book' ? item.look.width + BOOK_GAP : 0), 0);
}

function layoutRows(sections: Section[], shelfWidth: number): ShelfRowModel[] {
  const rows: ShelfRowModel[] = [];
  let row: ShelfRowModel = { key: 'row0', bays: [] };
  let used = 0;

  const finishRow = () => {
    if (row.bays.length === 0) return;
    // Whatever room is left goes to the last bay: a bookend holding its
    // books up, and a stack lying flat if there's space for one.
    const last = row.bays[row.bays.length - 1];
    const leftover = shelfWidth - used;
    if (leftover >= BOOKEND_WIDTH + 6) last.items.push({ kind: 'bookend', key: `${last.key}-bookend` });
    if (leftover >= BOOKEND_WIDTH + STACK_WIDTH + 24) {
      last.items.push({ kind: 'space', key: `${last.key}-space` });
      last.items.push({ kind: 'stack', key: `${last.key}-stack` });
    }
    rows.push(row);
    row = { key: `row${rows.length}`, bays: [] };
    used = 0;
  };

  for (const section of sections) {
    const items: BayItem[] = section.books.map((book) => ({ kind: 'book', book, look: spineLook(book) }));
    const divider = row.bays.length > 0 ? DIVIDER : 0;
    // The whole section fits beside what's already on this shelf.
    if (row.bays.length < BAYS_PER_ROW && used + divider + widthOf(items) <= shelfWidth) {
      row.bays.push({ key: `${row.key}-${section.label}`, label: section.label, items });
      used += divider + widthOf(items);
      continue;
    }
    // Otherwise it starts a fresh shelf and runs on as far as it needs.
    finishRow();
    let bay: Bay = { key: `${row.key}-${section.label}`, label: section.label, items: [] };
    for (const item of items) {
      const width = item.kind === 'book' ? item.look.width + BOOK_GAP : 0;
      if (bay.items.length > 0 && used + width > shelfWidth) {
        row.bays.push(bay);
        finishRow();
        bay = { key: `${row.key}-${section.label}`, items: [] };
      }
      bay.items.push(item);
      used += width;
    }
    row.bays.push(bay);
  }
  finishRow();
  return rows;
}

const ShelfRow = memo(function ShelfRow({
  row,
  hiddenKey,
  onPick,
}: {
  row: ShelfRowModel;
  hiddenKey?: string;
  onPick: (book: ShelfBook, origin: Rect) => void;
}) {
  return (
    <View style={styles.row}>
      <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']} style={styles.rowShadow} pointerEvents="none" />
      <View style={styles.bays}>
        {row.bays.map((bay, index) => {
          const isLast = index === row.bays.length - 1;
          return (
            <React.Fragment key={bay.key}>
              {index > 0 ? (
                <ImageBackground source={WALNUT} style={styles.divider} resizeMode="cover">
                  <View style={styles.dividerShade} />
                </ImageBackground>
              ) : null}
              <View style={isLast ? { flex: 1 } : { width: widthOf(bay.items) }}>
                {bay.label ? (
                  <View style={styles.plateWrap}>
                    <View style={styles.plate}>
                      <Text style={styles.plateText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {bay.label.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ) : null}
                <View style={styles.books}>
                  {bay.items.map((item) => {
                    switch (item.kind) {
                      case 'book':
                        return (
                          <BookSpine
                            key={item.book.key}
                            book={item.book}
                            look={item.look}
                            hidden={item.book.key === hiddenKey}
                            onPick={onPick}
                          />
                        );
                      case 'bookend':
                        return <Bookend key={item.key} />;
                      case 'space':
                        return <View key={item.key} style={{ flex: 1 }} />;
                      case 'stack':
                        return <FlatStack key={item.key} seed={item.key} />;
                    }
                  })}
                </View>
              </View>
            </React.Fragment>
          );
        })}
      </View>
      <ImageBackground source={WALNUT} style={styles.plank} resizeMode="cover">
        <View style={styles.plankLip} />
      </ImageBackground>
      <ImageBackground source={WALNUT} style={[styles.upright, { left: 0 }]} resizeMode="cover">
        <View style={styles.uprightLit} />
      </ImageBackground>
      <ImageBackground source={WALNUT} style={[styles.upright, { right: 0 }]} resizeMode="cover">
        <View style={styles.uprightShade} />
      </ImageBackground>
    </View>
  );
});

export default function StudyLibraryShelvesScreen({ navigation }: Props) {
  const { t } = useI18n();
  const s = t.studyLibrary;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const listRef = useRef<FlatList<ShelfRowModel>>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  // Disabled while dragging the custom scrollbar thumb -- see DraggableScrollbar.tsx's onDragStart/onDragEnd comment.
  const [scrollbarDragging, setScrollbarDragging] = useState(false);
  const [picked, setPicked] = useState<{ book: ShelfBook; origin: Rect } | null>(null);

  const sections = useMemo(() => buildSections(s.readAloudCaseTitle), [s.readAloudCaseTitle]);
  const rows = useMemo(() => layoutRows(sections, width - 2 * (UPRIGHT + INNER)), [sections, width]);
  const rowOfBook = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) for (const bay of row.bays) for (const item of bay.items) if (item.kind === 'book') map.set(item.book.key, row.key);
    return map;
  }, [rows]);

  // Only one book off the shelf at a time.
  const onPick = useCallback((book: ShelfBook, origin: Rect) => {
    setPicked((current) => current ?? { book, origin });
  }, []);
  const onClosed = useCallback(() => setPicked(null), []);
  const pickedRow = picked ? rowOfBook.get(picked.book.key) : undefined;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/study-library-entrance.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        blurRadius={5}
      />
      <View style={[StyleSheet.absoluteFill, styles.roomDim]} />

      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.topButton}
        >
          <Ionicons name="chevron-back" size={26} color={IVORY} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.libraryTitle}>{s.libraryTitle}</Text>
          <Text style={styles.pickABook}>{s.pickABook}</Text>
        </View>
        <View style={styles.topButton}>
          <CloseToHomeButton color={IVORY} />
        </View>
      </View>
      {/* Which voice reads a book, before it's picked up. */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendMark}>
            <Ionicons name="volume-medium" size={10} color="#D4B062" />
          </View>
          <Text style={styles.legendText} numberOfLines={1}>
            {s.legendJesus}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMark, styles.legendMarkPlain]}>
            <Ionicons name="volume-medium" size={10} color="#E6DCCB" />
          </View>
          <Text style={styles.legendText} numberOfLines={1}>
            {s.legendScholar}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(row) => row.key}
          renderItem={({ item }) => (
            <ShelfRow row={item} hiddenKey={item.key === pickedRow ? picked?.book.key : undefined} onPick={onPick} />
          )}
          extraData={pickedRow}
          getItemLayout={(_data, index) => ({ length: ROW_HEIGHT, offset: CROWN + ROW_HEIGHT * index, index })}
          ListHeaderComponent={
            <ImageBackground source={WALNUT} style={styles.crown} resizeMode="cover">
              <View style={styles.crownShade} />
            </ImageBackground>
          }
          ListFooterComponent={
            <View>
              <ImageBackground source={WALNUT} style={styles.plinth} resizeMode="cover">
                <View style={styles.crownShade} />
              </ImageBackground>
              <Text style={styles.disclosure}>{s.jesusVoiceDisclosure}</Text>
            </View>
          }
          initialNumToRender={6}
          windowSize={9}
          showsVerticalScrollIndicator={false}
          onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
          onContentSizeChange={(_w, height) => setContentHeight(height)}
          onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          scrollEnabled={!scrollbarDragging}
        />
        {/* Lamp light falling across the shelves from the left. */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,186,110,0.2)', 'rgba(255,186,110,0.06)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']}
          locations={[0, 0.25, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <DraggableScrollbar
          contentHeight={contentHeight}
          viewportHeight={viewportHeight}
          scrollOffset={scrollOffset}
          onScrollTo={(offset) => {
            listRef.current?.scrollToOffset({ offset, animated: false });
            setScrollOffset(offset);
          }}
          onDragStart={() => setScrollbarDragging(true)}
          onDragEnd={() => setScrollbarDragging(false)}
          thumbColor="#D4B062"
        />
      </View>

      <OpenVolume book={picked?.book ?? null} origin={picked?.origin ?? null} onClosed={onClosed} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0906' },
  roomDim: { backgroundColor: 'rgba(10,6,3,0.35)' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 6 },
  topButton: { width: 44, alignItems: 'center' },
  titleBlock: { flex: 1, alignItems: 'center' },
  libraryTitle: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: '700',
    color: '#E4C766',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  pickABook: { fontFamily: SERIF, fontStyle: 'italic', fontSize: 13, color: IVORY, opacity: 0.8, marginTop: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 10, gap: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  legendMarkPlain: { borderColor: '#E6DCCB' },
  legendMark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4B062',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: { color: IVORY, opacity: 0.75, fontSize: 11.5, flexShrink: 1, textAlign: 'center' },
  crown: { height: CROWN, overflow: 'hidden' },
  crownShade: { flex: 1, borderBottomWidth: 2, borderBottomColor: 'rgba(0,0,0,0.55)', borderTopWidth: 1, borderTopColor: 'rgba(255,210,150,0.25)' },
  plinth: { height: 26, overflow: 'hidden' },
  row: { height: ROW_HEIGHT, backgroundColor: 'rgba(20,12,6,0.6)', justifyContent: 'flex-end' },
  rowShadow: { position: 'absolute', top: 0, left: UPRIGHT, right: UPRIGHT, height: 40 },
  bays: { flex: 1, flexDirection: 'row', marginHorizontal: UPRIGHT + INNER },
  divider: { width: DIVIDER, marginTop: 2, overflow: 'hidden' },
  dividerShade: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,210,150,0.25)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.5)',
  },
  plateWrap: { position: 'absolute', top: 6, left: 2, right: 2, alignItems: 'center' },
  plate: {
    maxWidth: '100%',
    backgroundColor: '#B8944A',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#7A5E28',
    paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1.5,
  },
  plateText: { fontFamily: SERIF, fontSize: 9, fontWeight: '700', letterSpacing: 1, color: '#2A1B0C' },
  books: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: BOOK_GAP,
    height: BOOK_ZONE,
  },
  plank: { height: PLANK, marginHorizontal: UPRIGHT, overflow: 'hidden' },
  plankLip: { flex: 1, borderTopWidth: 1, borderTopColor: 'rgba(255,210,150,0.3)', borderBottomWidth: 2, borderBottomColor: 'rgba(0,0,0,0.5)' },
  upright: { position: 'absolute', top: 0, bottom: 0, width: UPRIGHT, overflow: 'hidden' },
  uprightLit: { flex: 1, backgroundColor: 'rgba(255,190,120,0.12)', borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.5)' },
  uprightShade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderLeftWidth: 1, borderLeftColor: 'rgba(255,210,150,0.2)' },
  disclosure: { color: IVORY, opacity: 0.5, fontSize: 10.5, lineHeight: 15, textAlign: 'center', paddingHorizontal: 28, paddingTop: 14, paddingBottom: 40 },
});
