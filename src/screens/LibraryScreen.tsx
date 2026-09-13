// "My Library" -- the user's own personal shelf: saved sermon links,
// bookmarked verses (favorites), and journal notes tied to Scripture or a
// sermon. Deliberately named "My Library", not "Library", to stay
// distinct from the two existing published/curated screens already
// called some form of "library" in this app (Study Library and
// Multi-Language Bible Tools, both under StudyToolsStack.tsx) -- this one
// reads only the user's own local data, never a public catalog.
import React, { useMemo, useRef, useState } from 'react';
import { Alert, FlatList, ImageBackground, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import DraggableScrollbar from '../components/DraggableScrollbar';
import { HIGHLIGHT_COLOR_HEX } from '../components/HighlighterToolbar';
import type { FavoriteItem, JournalEntry, SavedSermon } from '../types';

type LibraryFilter = 'all' | 'sermons' | 'verses' | 'notes';

type LibraryItem =
  | { kind: 'sermon'; id: string; sermon: SavedSermon }
  | { kind: 'verse'; id: string; favorite: FavoriteItem }
  | { kind: 'note'; id: string; entry: JournalEntry };

export default function LibraryScreen() {
  const { savedSermons, addSavedSermon, removeSavedSermon, favorites, removeFavorite, journalEntries, highlights } = useApp();
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [query, setQuery] = useState('');
  const [addSermonOpen, setAddSermonOpen] = useState(false);
  const [newSermonTitle, setNewSermonTitle] = useState('');
  const [newSermonUrl, setNewSermonUrl] = useState('');

  const saveNewSermon = () => {
    const title = newSermonTitle.trim();
    const url = newSermonUrl.trim();
    if (!title || !url) {
      Alert.alert('Missing info', 'Add both a title and a URL.');
      return;
    }
    addSavedSermon({ id: `${Date.now()}`, title, url, createdAt: new Date().toISOString() });
    setNewSermonTitle('');
    setNewSermonUrl('');
    setAddSermonOpen(false);
  };

  const scrollRef = useRef<FlatList>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollbarDragging, setScrollbarDragging] = useState(false);

  const items: LibraryItem[] = useMemo(() => {
    const sermonItems: LibraryItem[] = savedSermons.map((sermon) => ({ kind: 'sermon', id: sermon.id, sermon }));
    const verseItems: LibraryItem[] = favorites
      .filter((f) => f.type === 'verse')
      .map((favorite) => ({ kind: 'verse', id: favorite.id, favorite }));
    const noteItems: LibraryItem[] = journalEntries
      .filter((e) => e.linkedVerseReference || e.linkedSermon)
      .map((entry) => ({ kind: 'note', id: entry.id, entry }));

    let all: LibraryItem[] = [...sermonItems, ...verseItems, ...noteItems];
    if (filter !== 'all') {
      const kind = filter === 'sermons' ? 'sermon' : filter === 'verses' ? 'verse' : 'note';
      all = all.filter((item) => item.kind === kind);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      all = all.filter((item) => {
        if (item.kind === 'sermon') return item.sermon.title.toLowerCase().includes(q);
        if (item.kind === 'verse') return (item.favorite.reference ?? '').toLowerCase().includes(q) || item.favorite.text.toLowerCase().includes(q);
        return item.entry.title.toLowerCase().includes(q) || item.entry.body.toLowerCase().includes(q);
      });
    }
    return all;
  }, [savedSermons, favorites, journalEntries, filter, query]);

  return (
    <ImageBackground source={require('../../assets/textures/parchment.jpg')} style={styles.container} resizeMode="cover">
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search your library"
          placeholderTextColor={Colors.muted}
          autoCorrect={false}
        />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'sermons', 'verses', 'notes'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : f === 'sermons' ? 'Sermons' : f === 'verses' ? 'Verses' : 'Notes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.addSermonRow} onPress={() => setAddSermonOpen(true)}>
        <Ionicons name="add-circle-outline" size={16} color={Colors.royal} />
        <Text style={styles.addSermonRowText}>Add a sermon</Text>
      </TouchableOpacity>

      <FlatList
        ref={scrollRef}
        data={items}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        contentContainerStyle={styles.list}
        onContentSizeChange={(_w, height) => setContentHeight(height)}
        onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
        onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        scrollEnabled={!scrollbarDragging}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nothing saved yet -- bookmark a verse, save a sermon, or link Scripture to a journal entry and it'll show up here.
          </Text>
        }
        renderItem={({ item }) => {
          if (item.kind === 'sermon') {
            return (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="mic-outline" size={16} color={Colors.gold} />
                  <Text style={styles.cardLabel}>Sermon</Text>
                </View>
                <Text style={styles.cardTitle}>{item.sermon.title}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => removeSavedSermon(item.sermon.id)} accessibilityRole="button" accessibilityLabel="Remove saved sermon">
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }
          if (item.kind === 'verse') {
            return (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="bookmark-outline" size={16} color={Colors.gold} />
                  <Text style={styles.cardLabel}>Verse</Text>
                </View>
                {item.favorite.reference && <Text style={styles.cardTitle}>{item.favorite.reference}</Text>}
                <Text style={styles.cardBody}>{item.favorite.text}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => removeFavorite(item.favorite.id)} accessibilityRole="button" accessibilityLabel="Remove saved verse">
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }
          const preview = item.entry.body.length > 140 ? `${item.entry.body.slice(0, 140)}…` : item.entry.body;
          // Preview always shows paragraph 0's highlight color if the
          // entry has one -- the preview text itself is a truncation of
          // the first paragraph, so this is the one highlight a preview
          // can honestly represent without pulling in the full
          // paragraph-split read view just for a list row.
          const previewHighlight = highlights.find(
            (h) => h.target.kind === 'journalParagraph' && h.target.journalEntryId === item.entry.id && h.target.paragraphIndex === 0
          );
          return (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="create-outline" size={16} color={Colors.gold} />
                <Text style={styles.cardLabel}>Note</Text>
              </View>
              <Text style={styles.cardTitle}>{item.entry.title}</Text>
              {item.entry.linkedVerseReference && <Text style={styles.cardMeta}>{item.entry.linkedVerseReference}</Text>}
              {item.entry.linkedSermon && <Text style={styles.cardMeta}>{item.entry.linkedSermon.title}</Text>}
              <Text
                style={[
                  styles.cardBody,
                  previewHighlight && { backgroundColor: HIGHLIGHT_COLOR_HEX[previewHighlight.color], borderRadius: 4 },
                ]}
              >
                {preview}
              </Text>
            </View>
          );
        }}
      />
      <DraggableScrollbar
        contentHeight={contentHeight}
        viewportHeight={viewportHeight}
        scrollOffset={scrollOffset}
        onScrollTo={(offset) => {
          scrollRef.current?.scrollToOffset({ offset, animated: false });
          setScrollOffset(offset);
        }}
        onDragStart={() => setScrollbarDragging(true)}
        onDragEnd={() => setScrollbarDragging(false)}
      />

      <Modal visible={addSermonOpen} transparent animationType="fade" onRequestClose={() => setAddSermonOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAddSermonOpen(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalSheetTitle}>Add a sermon</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              placeholderTextColor="#A0AEC0"
              value={newSermonTitle}
              onChangeText={setNewSermonTitle}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="URL"
              placeholderTextColor="#A0AEC0"
              value={newSermonUrl}
              onChangeText={setNewSermonUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setAddSermonOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveNewSermon}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 12 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.ink },
  filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 6 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: Colors.royal },
  filterChipText: { fontSize: 12.5, color: '#4A5568', fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4 },
  empty: { textAlign: 'center', color: '#A0AEC0', marginTop: 40, fontSize: 13.5, paddingHorizontal: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  cardLabel: { fontSize: 11, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5, textTransform: 'uppercase' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  cardMeta: { fontSize: 12.5, color: Colors.gold, fontWeight: '600', marginTop: 2 },
  cardBody: { fontSize: 14, lineHeight: 20, color: Colors.ink, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  addSermonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 16, marginBottom: 10,
  },
  addSermonRowText: { fontSize: 13, fontWeight: '700', color: Colors.royal },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18,
    paddingTop: 16, paddingBottom: 32, paddingHorizontal: 20,
  },
  modalSheetTitle: { fontSize: 16, fontWeight: '800', color: Colors.royal, marginBottom: 14 },
  modalInput: {
    fontSize: 14.5, color: Colors.ink, backgroundColor: '#F4F6FA', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 22, backgroundColor: '#E2E8F0' },
  modalCancelText: { fontWeight: '700', color: '#4A5568' },
  modalSaveBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 22, backgroundColor: Colors.royal },
  modalSaveText: { fontWeight: '700', color: '#fff' },
});
