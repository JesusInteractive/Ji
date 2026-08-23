import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../theme/colors';
import {
  getBooks,
  getChapter,
  getTranslations,
  TORAH_BOOK_IDS,
  type BibleBook,
  type BibleChapter,
  type BibleTranslation,
} from '../services/bibleApi';
import { useApp } from '../context/AppContext';
import MagnifyButton from '../components/MagnifyButton';
import DraggableScrollbar from '../components/DraggableScrollbar';

const DEFAULT_TRANSLATION_ID = 'BSB';

type Filter = 'all' | 'torah';

// "Bible, Torah, Talmud quick access" (spec section 3/7). Torah = the
// first five books, filterable below. Talmud text isn't covered by the
// Bible API this screen uses -- see the note in services/bibleApi.ts for
// how to add a Sefaria-backed Talmud tab alongside this one.
export default function ScriptureSearchScreen() {
  const { addFavorite, textZoom } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [chapterNum, setChapterNum] = useState(1);
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState<string | null>(null);

  const [translations, setTranslations] = useState<BibleTranslation[]>([]);
  const [translation, setTranslation] = useState(DEFAULT_TRANSLATION_ID);
  const [translationPickerOpen, setTranslationPickerOpen] = useState(false);

  const verseListRef = useRef<FlatList>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  // State (not refs) so DraggableScrollbar's thumb actually re-renders as
  // these change. See StudyToolsScreen's identical comment on why
  // onLayout/onContentSizeChange are needed alongside onScroll -- a long
  // chapter is scrollable from the very first frame, before any onScroll
  // event has ever fired.
  const [verseScrollOffset, setVerseScrollOffset] = useState(0);
  const [verseContentHeight, setVerseContentHeight] = useState(0);
  const [verseViewportHeight, setVerseViewportHeight] = useState(0);
  const recomputeInitialVisibility = (newContentHeight: number, newViewportHeight: number) => {
    if (newContentHeight && newViewportHeight) {
      setShowScrollToBottom(newContentHeight - newViewportHeight > 200);
    }
  };

  // Same pattern again for the top-level book list (66 books -- always
  // scrollable from the first frame).
  const bookListRef = useRef<FlatList>(null);
  const [showBookScrollToBottom, setShowBookScrollToBottom] = useState(false);
  const [bookScrollOffset, setBookScrollOffset] = useState(0);
  const [bookContentHeight, setBookContentHeight] = useState(0);
  const [bookViewportHeight, setBookViewportHeight] = useState(0);
  const recomputeBookListVisibility = (newContentHeight: number, newViewportHeight: number) => {
    if (newContentHeight && newViewportHeight) {
      setShowBookScrollToBottom(newContentHeight - newViewportHeight > 200);
    }
  };

  useEffect(() => {
    getTranslations().then(setTranslations).catch(() => {});
  }, []);

  const load = useCallback(async (translationId: string) => {
    setLoading(true);
    setError(null);
    try {
      setBooks(await getBooks(translationId));
    } catch {
      setError("Couldn't load Scripture. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(translation);
  }, [load, translation]);

  const loadChapter = useCallback(async (book: BibleBook, num: number, translationId: string) => {
    setChapterLoading(true);
    setChapterError(null);
    try {
      setChapter(await getChapter(book.id, num, translationId));
      verseListRef.current?.scrollToOffset({ offset: 0, animated: false });
      setShowScrollToBottom(false);
      setVerseScrollOffset(0);
    } catch {
      setChapterError("Couldn't load this chapter.");
    } finally {
      setChapterLoading(false);
    }
  }, []);

  const openBook = (book: BibleBook) => {
    setSelectedBook(book);
    setChapterNum(1);
    loadChapter(book, 1, translation);
  };

  const selectTranslation = (id: string) => {
    setTranslation(id);
    setTranslationPickerOpen(false);
    if (selectedBook) loadChapter(selectedBook, chapterNum, id);
  };

  const filtered = books
    .filter((b) => (filter === 'torah' ? TORAH_BOOK_IDS.includes(b.id) : true))
    .filter((b) => b.name.toLowerCase().includes(query.toLowerCase()));

  const translationModal = (
    <Modal
      visible={translationPickerOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setTranslationPickerOpen(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setTranslationPickerOpen(false)}
      >
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Translation</Text>
          <FlatList
            data={translations}
            keyExtractor={(t) => t.id}
            style={{ maxHeight: 360 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.translationRow} onPress={() => selectTranslation(item.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.translationRowName}>{item.name}</Text>
                  <Text style={styles.translationRowId}>{item.id}</Text>
                </View>
                {item.id === translation && <Ionicons name="checkmark" size={18} color={Colors.royal} />}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (selectedBook) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, transform: [{ scale: textZoom }] }}>
        <View style={styles.backRow}>
          <TouchableOpacity style={styles.backRowLeft} onPress={() => setSelectedBook(null)}>
            <Ionicons name="arrow-back" size={22} color={Colors.gold} />
            <Text style={styles.backText}>Back to books</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.translationChip} onPress={() => setTranslationPickerOpen(true)}>
            <Text style={styles.translationChipText}>{translation}</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.royal} />
          </TouchableOpacity>
        </View>

        <View style={styles.chapterHeader}>
          <TouchableOpacity
            disabled={chapterNum <= 1}
            onPress={() => { const n = chapterNum - 1; setChapterNum(n); loadChapter(selectedBook, n, translation); }}
          >
            <Ionicons name="chevron-back-circle" size={28} color={chapterNum <= 1 ? '#CBD5E0' : Colors.royal} />
          </TouchableOpacity>
          <View style={styles.chapterTitleWrap}>
            <Text style={styles.bookTitle}>{selectedBook.name}</Text>
            <Text style={styles.bookMeta}>Chapter {chapterNum}</Text>
          </View>
          <TouchableOpacity
            disabled={selectedBook.chapters ? chapterNum >= selectedBook.chapters : false}
            onPress={() => { const n = chapterNum + 1; setChapterNum(n); loadChapter(selectedBook, n, translation); }}
          >
            <Ionicons name="chevron-forward-circle" size={28} color={Colors.royal} />
          </TouchableOpacity>
        </View>

        {chapterLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.royal} />
        ) : chapterError ? (
          <Text style={styles.error}>{chapterError}</Text>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              ref={verseListRef}
              data={chapter?.verses ?? []}
              keyExtractor={(v) => String(v.number)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.verseRow}
                  onLongPress={() =>
                    addFavorite({
                      id: `${Date.now()}`,
                      type: 'verse',
                      reference: `${selectedBook.name} ${chapterNum}:${item.number}`,
                      text: item.text,
                      createdAt: new Date().toISOString(),
                    })
                  }
                >
                  <Text style={styles.verseNum}>{item.number}</Text>
                  <Text style={styles.verseText}>{item.text}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.list}
              onLayout={({ nativeEvent }) => {
                setVerseViewportHeight(nativeEvent.layout.height);
                recomputeInitialVisibility(verseContentHeight, nativeEvent.layout.height);
              }}
              onContentSizeChange={(_width, height) => {
                setVerseContentHeight(height);
                recomputeInitialVisibility(height, verseViewportHeight);
              }}
              onScroll={({ nativeEvent }) => {
                const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
                const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
                setShowScrollToBottom(distanceFromBottom > 200);
                setVerseScrollOffset(contentOffset.y);
              }}
              scrollEventThrottle={16}
            />
            <DraggableScrollbar
              contentHeight={verseContentHeight}
              viewportHeight={verseViewportHeight}
              scrollOffset={verseScrollOffset}
              onScrollTo={(offset) => {
                verseListRef.current?.scrollToOffset({ offset, animated: false });
                setVerseScrollOffset(offset);
              }}
            />
            {showScrollToBottom && (
              <TouchableOpacity
                style={styles.scrollToBottomBtn}
                onPress={() => verseListRef.current?.scrollToEnd({ animated: true })}
                accessibilityLabel="Scroll to bottom of chapter"
              >
                <Ionicons name="arrow-down" size={20} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        )}
        {translationModal}
        </View>
        <MagnifyButton style={{ bottom: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#718096" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search books..."
          placeholderTextColor="#A0AEC0"
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'torah' && styles.filterChipActive]}
          onPress={() => setFilter('torah')}
        >
          <Text style={[styles.filterChipText, filter === 'torah' && styles.filterChipTextActive]}>Torah</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, styles.translationFilterChip]}
          onPress={() => setTranslationPickerOpen(true)}
        >
          <Text style={styles.filterChipText}>{translation}</Text>
          <Ionicons name="chevron-down" size={12} color="#4A5568" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.royal} />
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(translation)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            ref={bookListRef}
            data={filtered}
            keyExtractor={(b) => b.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.bookRow} onPress={() => openBook(item)}>
                <View style={styles.bookIcon}>
                  <Ionicons name="book-outline" size={22} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookName}>{item.name}</Text>
                  <Text style={styles.bookMeta}>{item.testament} · {item.chapters} chapters</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#A0AEC0" />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
            onLayout={({ nativeEvent }) => {
              setBookViewportHeight(nativeEvent.layout.height);
              recomputeBookListVisibility(bookContentHeight, nativeEvent.layout.height);
            }}
            onContentSizeChange={(_width, height) => {
              setBookContentHeight(height);
              recomputeBookListVisibility(height, bookViewportHeight);
            }}
            onScroll={({ nativeEvent }) => {
              const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
              const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
              setShowBookScrollToBottom(distanceFromBottom > 200);
              setBookScrollOffset(contentOffset.y);
            }}
            scrollEventThrottle={16}
          />
          <DraggableScrollbar
            contentHeight={bookContentHeight}
            viewportHeight={bookViewportHeight}
            scrollOffset={bookScrollOffset}
            onScrollTo={(offset) => {
              bookListRef.current?.scrollToOffset({ offset, animated: false });
              setBookScrollOffset(offset);
            }}
          />
          {showBookScrollToBottom && (
            <TouchableOpacity
              style={styles.scrollToBottomBtn}
              onPress={() => bookListRef.current?.scrollToEnd({ animated: true })}
              accessibilityLabel="Scroll to bottom of book list"
            >
              <Ionicons name="arrow-down" size={20} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      )}
      {translationModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16,
    borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 8,
  },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: Colors.ink },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: Colors.royal },
  filterChipText: { fontSize: 12.5, color: '#4A5568', fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  translationFilterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  centerBox: { alignItems: 'center', marginTop: 40 },
  error: { color: '#718096', fontSize: 14, textAlign: 'center', marginTop: 20 },
  retryBtn: { marginTop: 12, backgroundColor: Colors.royal, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  bookRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 10,
  },
  bookIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EBF8FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  bookName: { fontSize: 15, fontWeight: '600', color: Colors.royal },
  bookMeta: { fontSize: 12.5, color: '#718096', marginTop: 2 },
  backRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontSize: 15, color: Colors.gold, fontWeight: '600' },
  translationChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EBF8FF',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6,
  },
  translationChipText: { fontSize: 12.5, fontWeight: '700', color: Colors.royal },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18,
    paddingTop: 16, paddingBottom: 32, paddingHorizontal: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.royal, marginBottom: 10 },
  translationRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  translationRowName: { fontSize: 14.5, fontWeight: '600', color: Colors.ink },
  translationRowId: { fontSize: 12, color: '#718096', marginTop: 2 },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
  chapterTitleWrap: { alignItems: 'center', flex: 1 },
  bookTitle: { fontSize: 18, fontWeight: '800', color: Colors.royal },
  verseRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10, gap: 8 },
  verseNum: { fontSize: 11, fontWeight: '700', color: Colors.gold, width: 20, marginTop: 2 },
  verseText: { flex: 1, fontSize: 14.5, lineHeight: 21, color: Colors.ink },
  scrollToBottomBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.royal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
