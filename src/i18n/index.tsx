import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import en from './locales/en';
import es from './locales/es';
import fr from './locales/fr';
import pt from './locales/pt';
import ar from './locales/ar';
import hi from './locales/hi';
import type { TranslationShape } from './locales/en';
import type { LanguageCode } from '../types';
import { DEFAULT_LANGUAGE, LANGUAGES } from './languages';

const CATALOG: Record<LanguageCode, TranslationShape> = { en, es, fr, pt, ar, hi };
const STORAGE_KEY = 'ji_language';

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
  if (tag && (Object.keys(CATALOG) as LanguageCode[]).includes(tag as LanguageCode)) {
    return tag as LanguageCode;
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
        if (stored && (Object.keys(CATALOG) as string[]).includes(stored)) {
          setLanguageState(stored as LanguageCode);
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
      t: CATALOG[language],
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
