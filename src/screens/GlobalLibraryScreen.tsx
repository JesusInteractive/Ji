import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import Colors from '../theme/colors';
import { useI18n, interpolate } from '../i18n';
import type { StudyToolsStackParamList } from '../navigation/StudyToolsStack';
import type { MainTabParamList } from '../navigation/MainTabs';
import {
  getBibleLanguageGroups,
  getBibleGroupForAppLanguage,
  labelForBibleGroup,
  type BibleLanguageGroup,
} from '../services/bibleLibrary';
import { searchChristianLibrary, type ChristianLibraryItem } from '../services/christianLibrary';
import { LANGUAGES } from '../i18n/languages';

type Props = CompositeScreenProps<
  NativeStackScreenProps<StudyToolsStackParamList, 'GlobalLibrary'>,
  BottomTabScreenProps<MainTabParamList>
>;

// Study Tools' own "dedicated section at the top of the store" (per spec):
// Bibles grouped by language (bible.helloao.org, already used by
// ScriptureSearchScreen -- 1,000+ languages, verified live) plus a live
// Christian books/testimonies search (Internet Archive, verified live).
// Neither source is hosted or bundled here -- Bibles open in this app's
// own reading UI (ScriptureSearchScreen, via the Bible tab), books open
// to their Internet Archive details/reader page.
export default function GlobalLibraryScreen({ navigation }: Props) {
  const { t, language } = useI18n();

  const [allGroups, setAllGroups] = useState<BibleLanguageGroup[]>([]);
  const [yourGroup, setYourGroup] = useState<BibleLanguageGroup | undefined>(undefined);
  const [loadingBibles, setLoadingBibles] = useState(true);
  const [bibleError, setBibleError] = useState<string | null>(null);
  const [expandedLangCode, setExpandedLangCode] = useState<string | null>(null);

  const [books, setBooks] = useState<ChristianLibraryItem[] | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);

  const languageOption = LANGUAGES.find((l) => l.code === language);
  const languageEnglishName = languageOption?.label ?? 'English';

  const loadBibles = useCallback(async () => {
    setLoadingBibles(true);
    setBibleError(null);
    try {
      const [groups, mine] = await Promise.all([getBibleLanguageGroups(), getBibleGroupForAppLanguage(language)]);
      setAllGroups(groups);
      setYourGroup(mine);
    } catch {
      setBibleError(t.globalLibrary.loadError);
    } finally {
      setLoadingBibles(false);
    }
  }, [language, t.globalLibrary.loadError]);

  const loadBooks = useCallback(async () => {
    setLoadingBooks(true);
    try {
      const results = await searchChristianLibrary(languageEnglishName);
      setBooks(results);
    } catch {
      setBooks([]);
    } finally {
      setLoadingBooks(false);
    }
  }, [languageEnglishName]);

  useEffect(() => {
    loadBibles();
  }, [loadBibles]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const openTranslation = (translationId: string) => {
    navigation.navigate('Bible', { translationId });
  };

  const openBook = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(t.studyTools.linkErrorTitle, t.studyTools.linkErrorMessage);
    });
  };

  const pluralize = (count: number) => interpolate(t.globalLibrary.translationCount, { count, plural: count === 1 ? '' : 's' });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.globalLibrary.title}</Text>
      <Text style={styles.intro}>{t.globalLibrary.intro}</Text>

      <Text style={styles.sectionTitle}>{t.globalLibrary.bibleSectionTitle}</Text>

      {loadingBibles ? (
        <ActivityIndicator color={Colors.royal} style={styles.spinner} />
      ) : bibleError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{bibleError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadBibles}>
            <Text style={styles.retryBtnText}>{t.globalLibrary.retryButton}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {yourGroup ? (
            <View style={styles.yourLangCard}>
              <Text style={styles.yourLangTitle}>
                {interpolate(t.globalLibrary.yourLanguageBibles, { language: languageOption?.nativeLabel ?? languageEnglishName })}
              </Text>
              {yourGroup.translations.map((tr) => (
                <TouchableOpacity key={tr.id} style={styles.translationRow} onPress={() => openTranslation(tr.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.translationName}>{tr.name}</Text>
                    <Text style={styles.translationId}>{tr.id}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.royal} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noMatchText}>
              {interpolate(t.globalLibrary.noMatchForYourLanguage, { language: languageOption?.nativeLabel ?? languageEnglishName })}
            </Text>
          )}

          <Text style={styles.subheading}>{t.globalLibrary.languageSectionHeader}</Text>
          {allGroups.map((group) => {
            const label = labelForBibleGroup(group);
            const expanded = expandedLangCode === group.code;
            return (
              <View key={group.code}>
                <TouchableOpacity
                  style={styles.langRow}
                  onPress={() => setExpandedLangCode(expanded ? null : group.code)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.langNative}>{label.nativeLabel}</Text>
                    <Text style={styles.langEnglish}>{label.label} -- {pluralize(group.translations.length)}</Text>
                  </View>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.muted} />
                </TouchableOpacity>
                {expanded && (
                  <View style={styles.expandedList}>
                    {group.translations.map((tr) => (
                      <TouchableOpacity key={tr.id} style={styles.translationRow} onPress={() => openTranslation(tr.id)}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.translationName}>{tr.name}</Text>
                          <Text style={styles.translationId}>{tr.id}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.royal} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}

      <Text style={styles.sectionTitle}>{t.globalLibrary.booksSectionTitle}</Text>
      <Text style={styles.helpText}>{t.globalLibrary.booksIntro}</Text>

      {loadingBooks ? (
        <View style={styles.booksLoadingRow}>
          <ActivityIndicator color={Colors.royal} />
          <Text style={styles.booksLoadingText}>{t.globalLibrary.booksLoading}</Text>
        </View>
      ) : !books || books.length === 0 ? (
        <Text style={styles.noMatchText}>{interpolate(t.globalLibrary.booksEmpty, { language: languageEnglishName })}</Text>
      ) : (
        books.map((book) => (
          <TouchableOpacity key={book.identifier} style={styles.bookRow} onPress={() => openBook(book.detailsUrl)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              {!!book.creator && <Text style={styles.bookCreator}>{book.creator}</Text>}
            </View>
            <Text style={styles.openLabel}>{t.globalLibrary.openBook}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFE7D6', borderWidth: 5, borderColor: Colors.royal },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.royal },
  intro: { fontSize: 13, color: Colors.royal, opacity: 0.75, lineHeight: 18, marginTop: 6, marginBottom: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.royal, marginTop: 20, marginBottom: 8 },
  subheading: { fontSize: 13, fontWeight: '700', color: Colors.royal, opacity: 0.7, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  helpText: { fontSize: 12.5, color: Colors.royal, opacity: 0.7, lineHeight: 18, marginBottom: 10 },
  spinner: { marginVertical: 20 },
  errorBox: { alignItems: 'center', paddingVertical: 16 },
  errorText: { color: Colors.royal, fontSize: 13, textAlign: 'center', marginBottom: 10 },
  retryBtn: { backgroundColor: Colors.royal, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 20 },
  retryBtnText: { color: '#fff', fontWeight: '700' },
  yourLangCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(11,42,109,0.12)' },
  yourLangTitle: { fontSize: 14.5, fontWeight: '800', color: Colors.royal, marginBottom: 8 },
  noMatchText: { fontSize: 12.5, color: Colors.royal, opacity: 0.65, lineHeight: 18, marginBottom: 8 },
  langRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(11,42,109,0.08)' },
  langNative: { fontSize: 14, fontWeight: '700', color: Colors.royal },
  langEnglish: { fontSize: 11.5, color: Colors.royal, opacity: 0.6, marginTop: 2 },
  expandedList: { paddingLeft: 10, marginBottom: 6 },
  translationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(11,42,109,0.06)' },
  translationName: { fontSize: 13.5, fontWeight: '600', color: Colors.royal },
  translationId: { fontSize: 11, color: Colors.royal, opacity: 0.55, marginTop: 1 },
  booksLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  booksLoadingText: { color: Colors.royal, fontSize: 12.5, opacity: 0.7 },
  bookRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(11,42,109,0.08)' },
  bookTitle: { fontSize: 13.5, fontWeight: '700', color: Colors.royal },
  bookCreator: { fontSize: 11.5, color: Colors.royal, opacity: 0.6, marginTop: 2 },
  openLabel: { fontSize: 12, fontWeight: '700', color: Colors.gold },
});
