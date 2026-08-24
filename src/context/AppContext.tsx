import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ChatMessage,
  FavoriteItem,
  JournalEntry,
  PlanId,
  PrayerNote,
} from '../types';
import { PLANS } from '../constants/pricing';
import { encryptLocalText, decryptLocalText } from '../services/security';

// Shared by MagnifyButton (Chat/Scripture/Study Tools) and Settings'
// "Larger text" row, so both read/write the same textZoom scale and stay
// in sync with each other rather than each hardcoding its own copy.
export const TEXT_ZOOM_LEVELS = [1, 1.2, 1.4, 1.6];

// Exported so src/services/dataExport.ts can build a real on-device data
// export from these same keys without duplicating (and risking drifting
// out of sync with) this list.
export const STORAGE_KEYS = {
  onboarding: 'ji_onboarding_v2',
  plan: 'ji_plan_v2',
  tokens: 'ji_tokens_v2',
  messages: 'ji_messages_v2',
  journal: 'ji_journal_v2',
  favorites: 'ji_favorites_v2',
  prayers: 'ji_prayers_v2',
  profile: 'ji_profile_v1',
  dailyQuota: 'ji_daily_quota_v1',
};

// Local calendar date (not UTC) as YYYY-MM-DD -- keys the persisted daily
// question quota below so it only resets once a real day has actually
// passed, not on every app restart. Local time for the same reason
// devotionalReadingPlan.ts's getDayOfYear uses local getFullYear/
// getMonth/getDate rather than UTC.
function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Journal entries and prayer notes are the two categories of genuinely
// private, never-sent-to-the-model content this app stores (see
// services/security.ts's module comment) -- these wrap that file's
// AES-256-GCM primitives around the JSON <-> AsyncStorage round-trip
// every add/remove callback below needs.
async function writeEncryptedJson(key: string, value: unknown): Promise<void> {
  const encrypted = await encryptLocalText(JSON.stringify(value));
  await AsyncStorage.setItem(key, encrypted);
}

async function readEncryptedJson<T>(raw: string | null): Promise<T | null> {
  if (!raw) return null;
  try {
    return JSON.parse(await decryptLocalText(raw)) as T;
  } catch {
    // Not our sealed-data format -- most likely plaintext JSON written
    // before this encryption was wired up (this app predates it; see
    // services/security.ts's history). Fall back to reading it as-is so
    // existing local data isn't lost; the next add/remove re-saves it
    // encrypted via writeEncryptedJson above.
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}

interface AppContextValue {
  // Onboarding
  hasSelectedLanguage: boolean;
  markLanguageSelected: () => void;
  hasAcceptedDisclosure: boolean;
  acceptDisclosure: () => void;
  hasAcceptedAgreement: boolean;
  acceptAgreement: () => void;
  hasSeenEntrance: boolean;
  markEntranceSeen: () => void;
  hasSelectedPlan: boolean;
  plan: PlanId;
  selectPlan: (planId: PlanId) => void;
  onboardingComplete: boolean;

  // Usage / tokens
  remainingQuestionsToday: number;
  setRemainingQuestionsToday: (n: number) => void;
  tokenBalance: number;
  addTokens: (n: number) => void;
  spendToken: () => boolean;

  // Chat
  messages: ChatMessage[];
  addMessage: (m: ChatMessage) => void;
  clearMessages: () => void;

  // Journal
  journalEntries: JournalEntry[];
  addJournalEntry: (e: JournalEntry) => void;
  removeJournalEntry: (id: string) => void;

  // Favorites
  favorites: FavoriteItem[];
  addFavorite: (f: FavoriteItem) => void;
  removeFavorite: (id: string) => void;

  // Prayer wall (local-first; see PrayerWallScreen for the privacy model)
  prayerNotes: PrayerNote[];
  addPrayerNote: (n: PrayerNote) => void;

  // Full local wipe: messages, journal, favorites, prayers, tokens, plan,
  // and onboarding state, resetting the app to first-launch. Used by
  // Settings > "Delete my account and all data" (spec requirement:
  // one-tap deletion that actually works). The backend deletion call
  // (services/api.ts deleteAccountAndAllData) must run alongside this in
  // production -- this only guarantees the ON-DEVICE half is complete.
  wipeAllLocalData: () => Promise<void>;

  // Preferences
  ageAppropriateMode: boolean;
  setAgeAppropriateMode: (v: boolean) => void;
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  // Voice can never arrive faster than text -- ElevenLabs needs the
  // final reply text before it can synthesize anything, so TTS is
  // always additional time on top of text generation, not parallel to
  // it. Turning this off skips that step entirely (no synthesize/
  // download/play), which is the actual way to get a faster-feeling
  // reply, not a "voice only" mode (that would still wait the same
  // total time, just hide the text that was already ready).
  voiceRepliesEnabled: boolean;
  setVoiceRepliesEnabled: (v: boolean) => void;

  // Accessibility zoom for reading-heavy screens (Scripture, Chat, Study
  // Tools) -- a visual scale multiplier applied via a transform on those
  // screens' content. Settable either per-screen via the floating
  // MagnifyButton, or app-wide via Settings' "Larger text" row -- both
  // read/write this same value (see TEXT_ZOOM_LEVELS above). 1 = normal.
  textZoom: number;
  setTextZoom: (v: number) => void;

  // Profile -- purely local (device storage), same "no real user/session
  // system yet" caveat as backendAuth.ts's shared-secret auth. The photo
  // and name shown here live only on this device, not on any server.
  displayName: string;
  setDisplayName: (name: string) => void;
  profilePhotoUri: string | null;
  setProfilePhotoUri: (uri: string | null) => void;

  ready: boolean;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [hasAcceptedDisclosure, setHasAcceptedDisclosure] = useState(false);
  const [hasAcceptedAgreement, setHasAcceptedAgreement] = useState(false);
  const [hasSeenEntrance, setHasSeenEntrance] = useState(false);
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [remainingQuestionsToday, setRemainingQuestionsToday] = useState(5);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [prayerNotes, setPrayerNotes] = useState<PrayerNote[]>([]);
  const [ageAppropriateMode, setAgeAppropriateMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(true);
  const [textZoom, setTextZoom] = useState(1);
  const [displayName, setDisplayNameState] = useState('');
  const [profilePhotoUri, setProfilePhotoUriState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [onboardingRaw, planRaw, tokensRaw, messagesRaw, journalRaw, favRaw, prayersRaw, profileRaw, dailyQuotaRaw] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.onboarding),
            AsyncStorage.getItem(STORAGE_KEYS.plan),
            AsyncStorage.getItem(STORAGE_KEYS.tokens),
            AsyncStorage.getItem(STORAGE_KEYS.messages),
            AsyncStorage.getItem(STORAGE_KEYS.journal),
            AsyncStorage.getItem(STORAGE_KEYS.favorites),
            AsyncStorage.getItem(STORAGE_KEYS.prayers),
            AsyncStorage.getItem(STORAGE_KEYS.profile),
            AsyncStorage.getItem(STORAGE_KEYS.dailyQuota),
          ]);

        if (onboardingRaw) {
          const parsed = JSON.parse(onboardingRaw);
          setHasSelectedLanguage(!!parsed.hasSelectedLanguage);
          setHasAcceptedDisclosure(!!parsed.hasAcceptedDisclosure);
          setHasAcceptedAgreement(!!parsed.hasAcceptedAgreement);
          setHasSeenEntrance(!!parsed.hasSeenEntrance);
        }
        if (planRaw) {
          setPlan(planRaw as PlanId);
          // Restoring `plan` alone left remainingQuestionsToday stuck at
          // its hardcoded initial value (5, the free-tier default) on
          // every app restart, regardless of which plan was actually
          // restored -- e.g. Platinum's unlimited access silently
          // reverted to "5 questions left" until selectPlan() was called
          // again in that session. Recompute it from the restored plan
          // the same way selectPlan() itself does.
          const restoredPlan = PLANS.find((p) => p.id === planRaw);
          const fullLimit = restoredPlan?.dailyQuestionLimit ?? Infinity;
          // That full-limit recompute alone reintroduced a different bug:
          // a free-tier user who used up today's questions could force-
          // quit and relaunch to get a fresh 5, unlimited times a day,
          // since nothing about *usage* was ever persisted, only the
          // plan's limit. ji_daily_quota_v1 persists {date, remaining} so
          // a same-day relaunch restores what was actually left, while a
          // new calendar day (date mismatch) still resets to the full
          // limit, same as before.
          let restoredRemaining = fullLimit;
          if (dailyQuotaRaw) {
            try {
              const parsedQuota = JSON.parse(dailyQuotaRaw) as { date: string; remaining: number };
              if (parsedQuota.date === todayKey()) {
                restoredRemaining = parsedQuota.remaining;
              }
            } catch {
              // Fall through to fullLimit if the cached quota is corrupt.
            }
          }
          setRemainingQuestionsToday(restoredRemaining);
          AsyncStorage.setItem(
            STORAGE_KEYS.dailyQuota,
            JSON.stringify({ date: todayKey(), remaining: restoredRemaining })
          ).catch(() => {});
        }
        if (tokensRaw) setTokenBalance(Number(tokensRaw) || 0);
        if (messagesRaw) setMessages(JSON.parse(messagesRaw));
        const journal = await readEncryptedJson<JournalEntry[]>(journalRaw);
        if (journal) setJournalEntries(journal);
        if (favRaw) setFavorites(JSON.parse(favRaw));
        if (profileRaw) {
          const parsed = JSON.parse(profileRaw);
          setDisplayNameState(parsed.displayName ?? '');
          setProfilePhotoUriState(parsed.profilePhotoUri ?? null);
        }
        const prayers = await readEncryptedJson<PrayerNote[]>(prayersRaw);
        if (prayers) setPrayerNotes(prayers);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persistOnboarding = useCallback(
    (patch: Partial<{ hasSelectedLanguage: boolean; hasAcceptedDisclosure: boolean; hasAcceptedAgreement: boolean; hasSeenEntrance: boolean }>) => {
      AsyncStorage.setItem(
        STORAGE_KEYS.onboarding,
        JSON.stringify({ hasSelectedLanguage, hasAcceptedDisclosure, hasAcceptedAgreement, hasSeenEntrance, ...patch })
      ).catch(() => {});
    },
    [hasSelectedLanguage, hasAcceptedDisclosure, hasAcceptedAgreement, hasSeenEntrance]
  );

  const markLanguageSelected = useCallback(() => {
    setHasSelectedLanguage(true);
    persistOnboarding({ hasSelectedLanguage: true });
  }, [persistOnboarding]);

  const acceptDisclosure = useCallback(() => {
    setHasAcceptedDisclosure(true);
    persistOnboarding({ hasAcceptedDisclosure: true });
  }, [persistOnboarding]);

  const acceptAgreement = useCallback(() => {
    setHasAcceptedAgreement(true);
    persistOnboarding({ hasAcceptedAgreement: true });
  }, [persistOnboarding]);

  const markEntranceSeen = useCallback(() => {
    setHasSeenEntrance(true);
    persistOnboarding({ hasSeenEntrance: true });
  }, [persistOnboarding]);

  const selectPlan = useCallback((planId: PlanId) => {
    setPlan(planId);
    AsyncStorage.setItem(STORAGE_KEYS.plan, planId).catch(() => {});
    const found = PLANS.find((p) => p.id === planId);
    const fullLimit = found?.dailyQuestionLimit ?? Infinity;
    setRemainingQuestionsToday(fullLimit);
    AsyncStorage.setItem(
      STORAGE_KEYS.dailyQuota,
      JSON.stringify({ date: todayKey(), remaining: fullLimit })
    ).catch(() => {});
  }, []);

  // The raw useState setter above isn't itself persisted -- ChatScreen
  // decrementing remainingQuestionsToday through it (each question asked)
  // would otherwise hit the exact same "resets on relaunch" bug this
  // whole ji_daily_quota_v1 mechanism exists to close. This is the one
  // actually exposed to consumers below.
  const updateRemainingQuestionsToday = useCallback((n: number) => {
    setRemainingQuestionsToday(n);
    AsyncStorage.setItem(
      STORAGE_KEYS.dailyQuota,
      JSON.stringify({ date: todayKey(), remaining: n })
    ).catch(() => {});
  }, []);

  const addTokens = useCallback((n: number) => {
    setTokenBalance((prev) => {
      const next = prev + n;
      AsyncStorage.setItem(STORAGE_KEYS.tokens, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const spendToken = useCallback((): boolean => {
    let didSpend = false;
    setTokenBalance((prev) => {
      if (prev <= 0) return prev;
      didSpend = true;
      const next = prev - 1;
      AsyncStorage.setItem(STORAGE_KEYS.tokens, String(next)).catch(() => {});
      return next;
    });
    return didSpend;
  }, []);

  const addMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => {
      const next = [...prev, m];
      AsyncStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    AsyncStorage.removeItem(STORAGE_KEYS.messages).catch(() => {});
  }, []);

  const addJournalEntry = useCallback((e: JournalEntry) => {
    setJournalEntries((prev) => {
      const next = [e, ...prev];
      writeEncryptedJson(STORAGE_KEYS.journal, next).catch(() => {});
      return next;
    });
  }, []);

  const removeJournalEntry = useCallback((id: string) => {
    setJournalEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      writeEncryptedJson(STORAGE_KEYS.journal, next).catch(() => {});
      return next;
    });
  }, []);

  const addFavorite = useCallback((f: FavoriteItem) => {
    setFavorites((prev) => {
      const next = [f, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const addPrayerNote = useCallback((n: PrayerNote) => {
    setPrayerNotes((prev) => {
      const next = [n, ...prev];
      writeEncryptedJson(STORAGE_KEYS.prayers, next).catch(() => {});
      return next;
    });
  }, []);

  // Profile is purely local (see AppContextValue's own comment) -- both
  // fields persisted together under one key.
  const persistProfile = useCallback(
    (patch: Partial<{ displayName: string; profilePhotoUri: string | null }>) => {
      AsyncStorage.setItem(
        STORAGE_KEYS.profile,
        JSON.stringify({ displayName, profilePhotoUri, ...patch })
      ).catch(() => {});
    },
    [displayName, profilePhotoUri]
  );

  const setDisplayName = useCallback(
    (name: string) => {
      setDisplayNameState(name);
      persistProfile({ displayName: name });
    },
    [persistProfile]
  );

  const setProfilePhotoUri = useCallback(
    (uri: string | null) => {
      setProfilePhotoUriState(uri);
      persistProfile({ profilePhotoUri: uri });
    },
    [persistProfile]
  );

  const wipeAllLocalData = useCallback(async () => {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    setHasSelectedLanguage(false);
    setHasAcceptedDisclosure(false);
    setHasAcceptedAgreement(false);
    setHasSeenEntrance(false);
    setPlan(null);
    setTokenBalance(0);
    setRemainingQuestionsToday(5);
    setMessages([]);
    setJournalEntries([]);
    setFavorites([]);
    setPrayerNotes([]);
    setDisplayNameState('');
    setProfilePhotoUriState(null);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      hasSelectedLanguage,
      markLanguageSelected,
      hasAcceptedDisclosure,
      acceptDisclosure,
      hasAcceptedAgreement,
      acceptAgreement,
      hasSeenEntrance,
      markEntranceSeen,
      hasSelectedPlan: plan !== null,
      plan: plan ?? 'free',
      selectPlan,
      onboardingComplete:
        hasSelectedLanguage && hasAcceptedDisclosure && hasAcceptedAgreement && hasSeenEntrance && plan !== null,
      remainingQuestionsToday,
      setRemainingQuestionsToday: updateRemainingQuestionsToday,
      tokenBalance,
      addTokens,
      spendToken,
      messages,
      addMessage,
      clearMessages,
      journalEntries,
      addJournalEntry,
      removeJournalEntry,
      favorites,
      addFavorite,
      removeFavorite,
      prayerNotes,
      addPrayerNote,
      wipeAllLocalData,
      ageAppropriateMode,
      setAgeAppropriateMode,
      offlineMode,
      setOfflineMode,
      voiceRepliesEnabled,
      setVoiceRepliesEnabled,
      textZoom,
      setTextZoom,
      displayName,
      setDisplayName,
      profilePhotoUri,
      setProfilePhotoUri,
      ready,
    }),
    [
      hasSelectedLanguage, markLanguageSelected, hasAcceptedDisclosure, acceptDisclosure,
      hasAcceptedAgreement, acceptAgreement, hasSeenEntrance, markEntranceSeen, plan, selectPlan,
      remainingQuestionsToday, tokenBalance, addTokens, spendToken, messages, addMessage, clearMessages,
      journalEntries, addJournalEntry, removeJournalEntry, favorites, addFavorite, removeFavorite,
      prayerNotes, addPrayerNote, wipeAllLocalData, ageAppropriateMode, offlineMode,
      voiceRepliesEnabled,
      textZoom, setTextZoom,
      displayName, setDisplayName, profilePhotoUri, setProfilePhotoUri, ready,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
