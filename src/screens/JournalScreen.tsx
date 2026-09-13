import React, { useRef, useState } from 'react';
import { Alert, FlatList, ImageBackground, Modal, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import DraggableScrollbar from '../components/DraggableScrollbar';
import { useI18n } from '../i18n';
import type { MainTabParamList } from '../navigation/MainTabs';

// Journaling of conversations (spec section 7). Entries are stored
// locally today (AppContext -> AsyncStorage); a real build should also
// sync them server-side, encrypted, for cross-device access -- see
// services/security.ts's notes on what's realistic to E2E encrypt.

// Decorative steno-pad ruling behind the body input. Spacing is a fixed
// approximation of bodyInput's line-height, not baseline-locked, so it's
// cosmetic only -- it won't stay pixel-aligned under larger Dynamic Type.
const RULE_LINE_HEIGHT = 26;
const RULE_LINES = Array.from({ length: 30 }, (_, i) => i);

type Folder = 'entries' | 'jesus';

// Two folders in one screen, not two separate tabs -- Favorites (saved
// chat replies/verses) used to live only on its own screen reachable
// from Chat's header icon, which meant a lot of people would never
// find their saved Jesus answers again unless they remembered that
// icon existed. Journal is the place people actually think to look for
// "things I saved to come back to," so this surfaces the same
// favorites data as a second folder here instead of building a
// separate, parallel save mechanism.
export default function JournalScreen() {
  const { journalEntries, addJournalEntry, removeJournalEntry, favorites, removeFavorite } = useApp();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { t } = useI18n();
  const [folder, setFolder] = useState<Folder>('entries');
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  // Optional attach-to-entry fields -- surfaced in My Library's Notes
  // filter (LibraryScreen.tsx), which only picks up entries carrying one
  // of these two fields. Verse comes from an existing favorited verse
  // (no free-text reference typing, so it can't drift from what's
  // actually favorited); sermon is a plain title+URL pair since we don't
  // scrape outbound sermon pages for metadata -- same reasoning as
  // SavedSermon's own user-entered title.
  const [linkedVerseReference, setLinkedVerseReference] = useState<string | undefined>(undefined);
  const [linkedSermonTitle, setLinkedSermonTitle] = useState('');
  const [linkedSermonUrl, setLinkedSermonUrl] = useState('');
  const [versePickerOpen, setVersePickerOpen] = useState(false);
  const savedVerses = favorites.filter((f) => f.type === 'verse');

  // One scrollbar per folder's own FlatList -- only one is ever mounted
  // at a time (the other folder's list isn't rendered), so there's no
  // risk of them fighting over the same state.
  const entriesListRef = useRef<FlatList>(null);
  const [entriesScrollOffset, setEntriesScrollOffset] = useState(0);
  const [entriesContentHeight, setEntriesContentHeight] = useState(0);
  const [entriesViewportHeight, setEntriesViewportHeight] = useState(0);
  // Disabled while dragging the custom scrollbar thumb -- see DraggableScrollbar.tsx's onDragStart/onDragEnd comment.
  const [entriesScrollbarDragging, setEntriesScrollbarDragging] = useState(false);

  const jesusListRef = useRef<FlatList>(null);
  const [jesusScrollOffset, setJesusScrollOffset] = useState(0);
  const [jesusContentHeight, setJesusContentHeight] = useState(0);
  const [jesusViewportHeight, setJesusViewportHeight] = useState(0);
  // Disabled while dragging the custom scrollbar thumb -- see DraggableScrollbar.tsx's onDragStart/onDragEnd comment.
  const [jesusScrollbarDragging, setJesusScrollbarDragging] = useState(false);

  const handleSave = () => {
    if (!title.trim() && !body.trim()) return;
    const now = new Date().toISOString();
    const linkedSermon =
      linkedSermonTitle.trim() && linkedSermonUrl.trim()
        ? { title: linkedSermonTitle.trim(), url: linkedSermonUrl.trim() }
        : undefined;
    addJournalEntry({
      id: `${Date.now()}`,
      title: title.trim() || t.journal.untitledEntry,
      body: body.trim(),
      linkedVerseReference,
      linkedSermon,
      createdAt: now,
      updatedAt: now,
    });
    setTitle('');
    setBody('');
    setLinkedVerseReference(undefined);
    setLinkedSermonTitle('');
    setLinkedSermonUrl('');
    setModalVisible(false);
  };

  const confirmDelete = (id: string) => {
    Alert.alert(t.journal.deleteEntryTitle, t.journal.deleteEntryMessage, [
      { text: t.journal.alertCancel, style: 'cancel' },
      { text: t.journal.alertDelete, style: 'destructive', onPress: () => removeJournalEntry(id) },
    ]);
  };

  const handleShare = async (text: string, reference?: string) => {
    try {
      await Share.share({
        message: reference ? `"${text}" — ${reference}\n\n${t.journal.shareSuffix}` : `${text}\n\n${t.journal.shareSuffix}`,
      });
    } catch {
      // User cancelled or share failed silently -- non-critical.
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <ImageBackground source={require('../../assets/textures/parchment.jpg')} style={styles.container} resizeMode="cover">
      <View style={styles.header}>
        <View style={styles.penRow}>
          <MaterialCommunityIcons name="feather" size={22} color="#B8933E" style={styles.penIconTilted} />
          <MaterialCommunityIcons name="bottle-tonic-outline" size={26} color="#B8933E" />
        </View>
        <View style={styles.titleBar}>
          <Text style={styles.title}>{t.journal.title}</Text>
        </View>
        {folder === 'entries' && (
          <TouchableOpacity style={[styles.addBtn, styles.addBtnFloating]} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={22} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.folderRow}>
        <TouchableOpacity
          style={[styles.folderTab, folder === 'entries' && styles.folderTabActive]}
          onPress={() => setFolder('entries')}
        >
          <Ionicons name="create-outline" size={16} color={folder === 'entries' ? Colors.white : Colors.royal} />
          <Text style={[styles.folderTabText, folder === 'entries' && styles.folderTabTextActive]}>{t.journal.myEntriesTab}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.folderTab, folder === 'jesus' && styles.folderTabActive]}
          onPress={() => setFolder('jesus')}
        >
          <Ionicons name="bookmark-outline" size={16} color={folder === 'jesus' ? Colors.white : Colors.royal} />
          <Text style={[styles.folderTabText, folder === 'jesus' && styles.folderTabTextActive]}>{t.journal.fromJesusTab}</Text>
        </TouchableOpacity>
      </View>

      {folder === 'entries' ? (
        <View style={{ flex: 1 }}>
          <FlatList
            ref={entriesListRef}
            data={journalEntries}
            keyExtractor={(e) => e.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>{t.journal.entriesEmptyState}</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onLongPress={() => confirmDelete(item.id)}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.linkedVerseReference && (
                  <Text style={styles.linkedMeta}>
                    <Ionicons name="bookmark" size={11} color={Colors.gold} /> {item.linkedVerseReference}
                  </Text>
                )}
                {item.linkedSermon && (
                  <Text style={styles.linkedMeta}>
                    <Ionicons name="mic" size={11} color={Colors.gold} /> {item.linkedSermon.title}
                  </Text>
                )}
                <Text style={styles.cardBody} numberOfLines={3}>{item.body}</Text>
                <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </TouchableOpacity>
            )}
            onLayout={({ nativeEvent }) => setEntriesViewportHeight(nativeEvent.layout.height)}
            onContentSizeChange={(_width, height) => setEntriesContentHeight(height)}
            onScroll={({ nativeEvent }) => setEntriesScrollOffset(nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
            scrollEnabled={!entriesScrollbarDragging}
          />
          <DraggableScrollbar
            contentHeight={entriesContentHeight}
            viewportHeight={entriesViewportHeight}
            scrollOffset={entriesScrollOffset}
            onScrollTo={(offset) => {
              entriesListRef.current?.scrollToOffset({ offset, animated: false });
              setEntriesScrollOffset(offset);
            }}
            onDragStart={() => setEntriesScrollbarDragging(true)}
            onDragEnd={() => setEntriesScrollbarDragging(false)}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            ref={jesusListRef}
            data={favorites}
            keyExtractor={(f) => f.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {t.journal.jesusEmptyState}
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                {item.reference && <Text style={styles.reference}>{item.reference}</Text>}
                <Text style={styles.cardBody}>{item.text}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleShare(item.text, item.reference)}>
                    <Ionicons name="share-outline" size={18} color={Colors.royal} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => removeFavorite(item.id)}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            onLayout={({ nativeEvent }) => setJesusViewportHeight(nativeEvent.layout.height)}
            onContentSizeChange={(_width, height) => setJesusContentHeight(height)}
            onScroll={({ nativeEvent }) => setJesusScrollOffset(nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
            scrollEnabled={!jesusScrollbarDragging}
          />
          <DraggableScrollbar
            contentHeight={jesusContentHeight}
            viewportHeight={jesusViewportHeight}
            scrollOffset={jesusScrollOffset}
            onScrollTo={(offset) => {
              jesusListRef.current?.scrollToOffset({ offset, animated: false });
              setJesusScrollOffset(offset);
            }}
            onDragStart={() => setJesusScrollbarDragging(true)}
            onDragEnd={() => setJesusScrollbarDragging(false)}
          />
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <ImageBackground source={require('../../assets/textures/parchment.jpg')} style={styles.modal} resizeMode="cover">
          <TextInput style={styles.titleInput} placeholder={t.journal.titlePlaceholder} value={title} onChangeText={setTitle} />
          <View style={styles.bodyWrap}>
            <View style={styles.lines} pointerEvents="none">
              {RULE_LINES.map((i) => (
                <View key={i} style={styles.ruleLine} />
              ))}
            </View>
            <TextInput
              style={styles.bodyInput}
              placeholder={t.journal.bodyPlaceholder}
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.attachSection}>
            <TouchableOpacity style={styles.attachRow} onPress={() => setVersePickerOpen(true)}>
              <Ionicons name="bookmark-outline" size={16} color={Colors.royal} />
              <Text style={styles.attachRowText}>
                {linkedVerseReference ? linkedVerseReference : 'Attach a saved verse'}
              </Text>
              {linkedVerseReference ? (
                <TouchableOpacity onPress={() => setLinkedVerseReference(undefined)} accessibilityLabel="Remove attached verse">
                  <Ionicons name="close-circle" size={18} color="#A0AEC0" />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-forward" size={16} color="#A0AEC0" />
              )}
            </TouchableOpacity>

            <View style={styles.sermonAttachRow}>
              <Ionicons name="mic-outline" size={16} color={Colors.royal} />
              <View style={styles.sermonAttachInputs}>
                <TextInput
                  style={styles.sermonAttachInput}
                  placeholder="Sermon title (optional)"
                  placeholderTextColor="#A0AEC0"
                  value={linkedSermonTitle}
                  onChangeText={setLinkedSermonTitle}
                />
                <TextInput
                  style={styles.sermonAttachInput}
                  placeholder="Sermon URL (optional)"
                  placeholderTextColor="#A0AEC0"
                  value={linkedSermonUrl}
                  onChangeText={setLinkedSermonUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>{t.journal.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>{t.journal.save}</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </Modal>

      <Modal
        visible={versePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setVersePickerOpen(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVersePickerOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalSheetTitle}>Attach a saved verse</Text>
            {savedVerses.length === 0 ? (
              <Text style={styles.empty}>Favorite a verse on the Bible screen first, then it'll show up here.</Text>
            ) : (
              <FlatList
                data={savedVerses}
                keyExtractor={(f) => f.id}
                style={{ maxHeight: 360 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.verseOptionRow}
                    onPress={() => {
                      setLinkedVerseReference(item.reference ?? item.text);
                      setVersePickerOpen(false);
                    }}
                  >
                    {item.reference && <Text style={styles.reference}>{item.reference}</Text>}
                    <Text style={styles.cardBody} numberOfLines={2}>{item.text}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, borderWidth: 5, borderColor: Colors.royal },
  container: { flex: 1 },
  // "+" is absolutely positioned (addBtnFloating below) rather than a
  // flex sibling, so it floats above the full-width title bar instead
  // of pushing it off-center.
  header: { alignItems: 'center', paddingTop: 16, paddingBottom: 12, position: 'relative' },
  addBtnFloating: { position: 'absolute', right: 16, top: 16 },
  penRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  // The feather sits slightly angled, as if just set down after writing.
  penIconTilted: { transform: [{ rotate: '-30deg' }] },
  // Full-bleed, edge to edge -- was a small centered pill before.
  titleBar: {
    backgroundColor: '#B8933E',
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.white },
  addBtn: { backgroundColor: Colors.royal, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  folderRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  folderTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  folderTabActive: { backgroundColor: Colors.royal, borderColor: Colors.royal },
  folderTabText: { fontSize: 13.5, fontWeight: '700', color: Colors.royal },
  folderTabTextActive: { color: Colors.white },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#A0AEC0', marginTop: 40, fontSize: 13.5, paddingHorizontal: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.royal, marginBottom: 4 },
  cardBody: { fontSize: 13.5, color: '#4A5568', lineHeight: 19 },
  cardDate: { fontSize: 11, color: '#A0AEC0', marginTop: 8 },
  linkedMeta: { fontSize: 12, fontWeight: '600', color: Colors.gold, marginBottom: 3 },
  reference: { fontSize: 12, fontWeight: '700', color: Colors.gold, marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  iconBtn: { padding: 4 },
  modal: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#EFE7D6' },
  titleInput: { fontSize: 18, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 10, marginBottom: 14, color: Colors.royal },
  bodyWrap: { flex: 1 },
  lines: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  ruleLine: { height: RULE_LINE_HEIGHT, borderBottomWidth: 1, borderBottomColor: '#E9EDF3' },
  bodyInput: { flex: 1, fontSize: 15, lineHeight: RULE_LINE_HEIGHT, color: Colors.royal, backgroundColor: 'transparent' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 22, backgroundColor: '#E2E8F0' },
  cancelText: { fontWeight: '700', color: '#4A5568' },
  saveBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 22, backgroundColor: Colors.royal },
  saveText: { fontWeight: '700', color: '#fff' },
  attachSection: { gap: 8, marginTop: 14 },
  attachRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
  },
  attachRowText: { flex: 1, fontSize: 13.5, color: Colors.royal, fontWeight: '600' },
  sermonAttachRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
  },
  sermonAttachInputs: { flex: 1, gap: 8 },
  sermonAttachInput: { fontSize: 13.5, color: Colors.royal, paddingVertical: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18,
    paddingTop: 16, paddingBottom: 32, paddingHorizontal: 20,
  },
  modalSheetTitle: { fontSize: 16, fontWeight: '800', color: Colors.royal, marginBottom: 10 },
  verseOptionRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
});
