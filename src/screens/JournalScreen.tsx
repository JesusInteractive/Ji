import React, { useState } from 'react';
import { Alert, FlatList, Modal, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { useApp } from '../context/AppContext';

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
  const [folder, setFolder] = useState<Folder>('entries');
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSave = () => {
    if (!title.trim() && !body.trim()) return;
    const now = new Date().toISOString();
    addJournalEntry({
      id: `${Date.now()}`,
      title: title.trim() || 'Untitled entry',
      body: body.trim(),
      createdAt: now,
      updatedAt: now,
    });
    setTitle('');
    setBody('');
    setModalVisible(false);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete entry', 'This can\'t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeJournalEntry(id) },
    ]);
  };

  const handleShare = async (text: string, reference?: string) => {
    try {
      await Share.share({
        message: reference ? `"${text}" — ${reference}\n\nShared from Jesus Interactive` : `${text}\n\nShared from Jesus Interactive`,
      });
    } catch {
      // User cancelled or share failed silently -- non-critical.
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        {folder === 'entries' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
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
          <Text style={[styles.folderTabText, folder === 'entries' && styles.folderTabTextActive]}>My Entries</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.folderTab, folder === 'jesus' && styles.folderTabActive]}
          onPress={() => setFolder('jesus')}
        >
          <Ionicons name="bookmark-outline" size={16} color={folder === 'jesus' ? Colors.white : Colors.royal} />
          <Text style={[styles.folderTabText, folder === 'jesus' && styles.folderTabTextActive]}>From Jesus</Text>
        </TouchableOpacity>
      </View>

      {folder === 'entries' ? (
        <FlatList
          data={journalEntries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No journal entries yet. Tap + to write one.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onLongPress={() => confirmDelete(item.id)}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody} numberOfLines={3}>{item.body}</Text>
              <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(f) => f.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nothing saved yet. Long-press a verse in Scripture, or tap the bookmark on a chat reply.
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
        />
      )}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modal}>
          <TextInput style={styles.titleInput} placeholder="Title" value={title} onChangeText={setTitle} />
          <View style={styles.bodyWrap}>
            <View style={styles.lines} pointerEvents="none">
              {RULE_LINES.map((i) => (
                <View key={i} style={styles.ruleLine} />
              ))}
            </View>
            <TextInput
              style={styles.bodyInput}
              placeholder="Write freely..."
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
            />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.royal },
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
  reference: { fontSize: 12, fontWeight: '700', color: Colors.gold, marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  iconBtn: { padding: 4 },
  modal: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  titleInput: { fontSize: 18, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 10, marginBottom: 14, color: Colors.ink },
  bodyWrap: { flex: 1 },
  lines: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  ruleLine: { height: RULE_LINE_HEIGHT, borderBottomWidth: 1, borderBottomColor: '#E9EDF3' },
  bodyInput: { flex: 1, fontSize: 15, lineHeight: RULE_LINE_HEIGHT, color: Colors.ink, backgroundColor: 'transparent' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 22, backgroundColor: '#E2E8F0' },
  cancelText: { fontWeight: '700', color: '#4A5568' },
  saveBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 22, backgroundColor: Colors.royal },
  saveText: { fontWeight: '700', color: '#fff' },
});
