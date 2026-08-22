import type { LanguageOption } from '../types';

// Fully-translated launch languages. The i18n system (index.ts) is built so
// adding a locale is just: add a locales/xx.ts file matching TranslationShape,
// then add it here. Product spec calls for broad coverage (major African
// languages, more Indian languages/dialects, etc.) -- ship those as
// community/professionally-reviewed translation passes post-launch rather
// than machine-translated placeholders, so nothing reaches users in a
// language that reads as broken or disrespectful of the source text.
export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'he', label: 'Hebrew', nativeLabel: 'עברית', rtl: true },
  { code: 'el', label: 'Greek', nativeLabel: 'Ελληνικά' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', rtl: true },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
];

export const DEFAULT_LANGUAGE = 'en' as const;
