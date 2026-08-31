// Groups the existing Bible API's translation catalog (services/bibleApi.ts,
// bible.helloao.org -- 1,000+ languages, verified live) by language, so
// GlobalLibraryScreen can show "Bibles in your language" instead of one
// flat list of 1,256 translations. No separate API/backend needed -- this
// is purely a client-side grouping of data getTranslations() already
// fetches and caches.

import { getTranslations, type BibleTranslation } from './bibleApi';
import { APP_LANG_TO_BIBLE_API_LANG } from '../constants/bibleLanguageMap';
import { LANGUAGES } from '../i18n/languages';

export interface BibleLanguageGroup {
  code: string; // this API's language code (ISO 639-3), e.g. 'swh'
  languageName: string; // native name as the API reports it
  languageEnglishName: string;
  translations: BibleTranslation[];
}

let cachedGroups: BibleLanguageGroup[] | null = null;

export async function getBibleLanguageGroups(): Promise<BibleLanguageGroup[]> {
  if (cachedGroups) return cachedGroups;
  const translations = await getTranslations();
  const byCode = new Map<string, BibleLanguageGroup>();
  for (const t of translations) {
    const code = t.language || 'eng';
    if (!byCode.has(code)) {
      byCode.set(code, {
        code,
        languageName: t.languageName || code,
        languageEnglishName: t.languageEnglishName || code,
        translations: [],
      });
    }
    byCode.get(code)!.translations.push(t);
  }
  cachedGroups = Array.from(byCode.values()).sort((a, b) => b.translations.length - a.translations.length);
  return cachedGroups;
}

// The group matching the app's currently-selected UI language, if this
// API has any Bible translation in it -- undefined otherwise (not every
// one of the app's 117 picker languages has a match here; see
// bibleLanguageMap.ts's own comment on why).
export async function getBibleGroupForAppLanguage(appLanguageCode: string): Promise<BibleLanguageGroup | undefined> {
  const bibleCode = APP_LANG_TO_BIBLE_API_LANG[appLanguageCode];
  if (!bibleCode) return undefined;
  const groups = await getBibleLanguageGroups();
  return groups.find((g) => g.code === bibleCode);
}

// Human-readable label for a Bible-API language group, preferring this
// app's own LANGUAGES list (which has better native-script names curated
// for the picker) when there's a match, falling back to whatever the
// Bible API itself reported.
export function labelForBibleGroup(group: BibleLanguageGroup): { label: string; nativeLabel: string } {
  const appEntry = Object.entries(APP_LANG_TO_BIBLE_API_LANG).find(([, v]) => v === group.code)?.[0];
  const languageOption = appEntry ? LANGUAGES.find((l) => l.code === appEntry) : undefined;
  if (languageOption) return { label: languageOption.label, nativeLabel: languageOption.nativeLabel };
  return { label: group.languageEnglishName, nativeLabel: group.languageName };
}
