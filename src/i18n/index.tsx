import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import CATALOG from './locales';
import type { TranslationShape } from './locales/en';
import type { LanguageCode } from '../types';
import { DEFAULT_LANGUAGE, LANGUAGES } from './languages';

// CATALOG (src/i18n/locales/index.ts, auto-generated) has a full
// locales/xx.ts translation file for every language in LANGUAGES --
// every one of the 117 languages in the picker is now fully translated,
// not just a handful. The Partial/fallback below is defensive (a locale
// file failing to load, or a future language added to LANGUAGES before
// its locale file exists) rather than the everyday case it used to be.
const STORAGE_KEY = 'ji_language';
const VALID_CODES = new Set(LANGUAGES.map((l) => l.code));

interface I18nContextValue {
  language: LanguageCode;
  t: TranslationShape;
  isRTL: boolean;
  setLanguage: (code: LanguageCode) => Promise<void>;
  ready: boolean;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function detectDeviceLanguage(): LanguageCode {
  const tag = Localization.getLocales?.()[0]?.languageCode;
  if (tag && VALID_CODES.has(tag)) {
    return tag;
  }
  return DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        // Checked against the full 100+ language list, not just CATALOG's
        // translated subset -- previously this fell back to the device
        // language (or English) on every restart for anyone who picked a
        // language without a full UI translation, silently discarding
        // their actual choice (which still matters for chat/voice/
        // devotions regardless of UI translation coverage).
        if (stored && VALID_CODES.has(stored)) {
          setLanguageState(stored);
        } else {
          setLanguageState(detectDeviceLanguage());
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setLanguage = useCallback(async (code: LanguageCode) => {
    setLanguageState(code);
    await AsyncStorage.setItem(STORAGE_KEY, code);
    const rtl = LANGUAGES.find((l) => l.code === code)?.rtl ?? false;
    // NOTE: I18nManager.forceRTL requires an app reload to fully apply
    // layout mirroring on native. We still set it so a restart picks it up;
    // the current session falls back to text-direction-only RTL via style.
    if (I18nManager.isRTL !== rtl) {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      // Falls back to English strings for any of the 100+ picker
      // languages that don't have a locales/xx.ts file yet -- see
      // CATALOG's comment above.
      t: CATALOG[language] ?? (CATALOG[DEFAULT_LANGUAGE] as TranslationShape),
      isRTL: LANGUAGES.find((l) => l.code === language)?.rtl ?? false,
      setLanguage,
      ready,
    }),
    [language, setLanguage, ready]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}

// Fills a translated template's {placeholder} tokens with real values --
// e.g. interpolate(t.tokenGift.currentPlan, { planName: 'Pro' }) ->
// "Current plan: Pro". Every locale file keeps placeholder names in curly
// braces untranslated (the translation pass is instructed to preserve
// them verbatim), so this works the same regardless of language.
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}
