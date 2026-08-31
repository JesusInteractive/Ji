import React from 'react';
import { FlatList, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';

// Favorites/bookmarks + "share a verse or moment" (spec section 7).
export default function FavoritesScreen() {
  const { favorites, removeFavorite } = useApp();
  const { t } = useI18n();

  const handleShare = async (text: string, reference?: string) => {
    try {
      await Share.share({
        message: reference ? `"${text}" — ${reference}\n\n${t.favorites.shareSuffix}` : `${text}\n\n${t.favorites.shareSuffix}`,
      });
    } catch {
      // User cancelled or share failed silently -- non-critical.
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.favorites.title}</Text>
      <FlatList
        data={favorites}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {t.favorites.emptyState}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.reference && <Text style={styles.reference}>{item.reference}</Text>}
            <Text style={styles.text}>{item.text}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.royal, padding: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#A0AEC0', marginTop: 40, fontSize: 13.5, paddingHorizontal: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  reference: { fontSize: 12, fontWeight: '700', color: Colors.gold, marginBottom: 4 },
  text: { fontSize: 14.5, lineHeight: 21, color: Colors.ink },
  actions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  iconBtn: { padding: 4 },
});
