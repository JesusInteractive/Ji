import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LanguageCode } from '../types';
import { LANGUAGES } from '../i18n/languages';
import Colors from '../theme/colors';
import DraggableScrollbar from './DraggableScrollbar';
import { useArrowKeyScroll } from '../hooks/useArrowKeyScroll';

interface Props {
  selected: LanguageCode;
  onSelect: (code: LanguageCode) => void;
}

// 117 languages is too long a list to scan by eye or thumb-scroll through
// blindly -- search narrows it, and the draggable scrollbar (same
// component used elsewhere in the app) lets someone jump straight into
// the middle of what's left instead of only flicking from the top.
export default function LanguagePicker({ selected, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const listRef = useRef<FlatList>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  // Disabled while dragging the custom scrollbar thumb -- see DraggableScrollbar.tsx's onDragStart/onDragEnd comment.
  const [scrollbarDragging, setScrollbarDragging] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (item) => item.label.toLowerCase().includes(q) || item.nativeLabel.toLowerCase().includes(q)
    );
  }, [query]);

  const handleChangeQuery = (text: string) => {
    setQuery(text);
    setScrollOffset(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  useArrowKeyScroll({
    getOffset: useCallback(() => scrollOffset, [scrollOffset]),
    scrollTo: useCallback((y: number) => {
      listRef.current?.scrollToOffset({ offset: y, animated: true });
      setScrollOffset(y);
    }, []),
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search languages..."
          placeholderTextColor={Colors.muted}
          value={query}
          onChangeText={handleChangeQuery}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleChangeQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={Colors.muted} />
          </TouchableOpacity>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={filtered}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, selected === item.code && styles.rowSelected]}
              onPress={() => onSelect(item.code)}
            >
              <View>
                <Text style={styles.native}>{item.nativeLabel}</Text>
                <Text style={styles.label}>{item.label}</Text>
              </View>
              {selected === item.code && <Ionicons name="checkmark-circle" size={22} color={Colors.gold} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No languages match "{query}".</Text>}
          contentContainerStyle={styles.list}
          onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
          onContentSizeChange={(_width, height) => setContentHeight(height)}
          onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          scrollEnabled={!scrollbarDragging}
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
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.ivory, padding: 0 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rowSelected: { borderColor: Colors.gold },
  native: { fontSize: 16, fontWeight: '600', color: Colors.ivory },
  label: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  empty: { fontSize: 13.5, color: Colors.muted, textAlign: 'center', marginTop: 24, paddingHorizontal: 20 },
});
