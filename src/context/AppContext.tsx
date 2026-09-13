import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ChatMessage,
  FavoriteItem,
  Highlight,
  JournalEntry,
  PlanId,
  PrayerNote,
  SavedSermon,
  TestimonyNote,
} from '../types';
import { encryptLocalText, decryptLocalText } from '../services/security';
import { sendDeviceHeartbeat } from '../services/testimonyApi';
import { getDeviceId } from '../services/deviceId';
import { initPurchases } from '../services/purchases';
import { logEvent } from '../services/analytics';
import { AI_DISCLOSURE, USER_AGREEMENT, PRIVACY_POLICY } from '../constants/legal';

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
  messages: 'ji_messages_v2',
  journal: 'ji_journal_v2',
  favorites: 'ji_favorites_v2',
  prayers: 'ji_prayers_v2',
  testimonies: 'ji_testimonies_v1',
  wordSearchCompleted: 'ji_word_search_completed_v1',
  profile: 'ji_profile_v1',
  // Own key rather than folded into `profile` above -- who to notify in
  // an emergency is reasoned-about (and wiped/exported) independently of
  // the display name/photo.
  emergencyContacts: 'ji_emergency_contacts_v1',
  planExpiresAt: 'ji_plan_expires_at_v1',
  // Server-anchored 5-day trial start (see the boot effect below) --
  // cached here only so the app has an immediate value before the first
  // heartbeat resolves; the server's users.created_at always overwrites
  // this once it responds, so clearing local storage alone can't reset
  // the trial clock (a full reinstall still can, via a fresh deviceId).
  trialStartedAt: 'ji_trial_started_at_v1',
  // One-shot/once-per-day guards for the trial analytics events below --
  // never read for anything except "have we already logged this."
  trialStartedLogged: 'ji_trial_started_logged_v1',
  trialDayReturnedLoggedDate: 'ji_trial_day_returned_logged_date_v1',
  trialExpiredLogged: 'ji_trial_expired_logged_v1',
  // Plain (unencrypted) like `favorites` above -- a highlight carries no
  // private free text, just a verse/paragraph coordinate and a color.
  highlights: 'ji_highlights_v1',
  savedSermons: 'ji_saved_sermons_v1',
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
  hasAcceptedPrivacy: boolean;
  acceptPrivacy: () => void;
  // Accepts all three documents at once, for the single-scroll Agreements
  // screen: one state update and one storage write, so the three consent
  // records can't overwrite each other the way three back-to-back
  // accept* calls would (each persists from the same stale consentRecords).
  acceptAllAgreements: () => void;
  // True when the recorded consent for any document is missing or for an
  // older version (its lastUpdated changed since). RootNavigator shows the
  // Agreements screen again before Main while this is true.
  needsLegalReconsent: boolean;
  // Audit trail for the three consent checkboxes above -- when each was
  // accepted and which doc version (the legal doc's own `lastUpdated`
  // string) was shown at the time, so a future doc revision can tell
  // whether a given user consented to the current text or a stale one.
  // Purely additive: onboardingComplete/gating logic still runs off the
  // plain booleans above, this is just the record of what was agreed to.
  consentRecords: Partial<Record<'disclosure' | 'agreement' | 'privacy', { acceptedAt: string; docVersion: string }>>;
  hasSeenEntrance: boolean;
  markEntranceSeen: () => void;
  hasSelectedPlan: boolean;
  plan: PlanId;
  // expiresAt (ISO string) marks a time-limited grant -- used by gift
  // certificates, which activate a plan for a fixed number of months
  // with no auto-renewal (see TokenGiftScreen.tsx). Omit/pass null for
  // an ongoing RevenueCat subscription, which has no local expiration --
  // its lifecycle is managed by the store, not by this date.
  selectPlan: (planId: PlanId, expiresAt?: string | null) => void;
  // Null for the free tier and for real subscriptions. Set only while a
  // gift-certificate-granted plan is active; checked once on launch (see
  // the restore effect below) and reverted to Free if it's passed.
  planExpiresAt: string | null;
  onboardingComplete: boolean;

  // 5-day trial (see useFeatureAccess.ts, which is what every gated
  // screen actually reads) -- trialStartedAt is server-anchored (see
  // STORAGE_KEYS.trialStartedAt's own comment), null only in the brief
  // window before the first heartbeat/cache read resolves.
  trialStartedAt: string | null;
  daysSinceFirstOpen: number;
  isInTrial: boolean;
  // A real paid plan (or an active gift-certificate grant) OR still
  // within the 5-day trial -- the one thing every feature-gated screen
  // actually checks (via useFeatureAccess.ts). No ad-unlock branch: the
  // only way back in after day 5 is a subscription.
  hasFullAccess: boolean;

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

  // Highlighter marks -- Bible verses and Journal paragraphs. Centralized
  // here (not screen-local) since both the Bible screen and My Library
  // need to read across the same array. See types/index.ts's Highlight.
  highlights: Highlight[];
  addHighlight: (h: Highlight) => void;
  removeHighlight: (id: string) => void;
  setHighlightColor: (id: string, color: Highlight['color']) => void;

  // My Library's bookmarked outbound sermon links (SermonAudio, etc.)
  savedSermons: SavedSermon[];
  addSavedSermon: (s: SavedSermon) => void;
  removeSavedSermon: (id: string) => void;

  // Prayer wall (local-first; see PrayerWallScreen for the privacy model)
  prayerNotes: PrayerNote[];
  addPrayerNote: (n: PrayerNote) => void;
  testimonyNotes: TestimonyNote[];
  addTestimonyNote: (n: TestimonyNote) => void;

  // Bible Word Search -- puzzle seeds (see services/wordSearchPuzzle.ts)
  // the user has fully completed, purely for the subtle "completed"
  // indicator on BibleWordSearchScreen; no scores or streaks (per spec).
  completedWordSearchPuzzles: number[];
  addCompletedWordSearchPuzzle: (seed: number) => void;

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

  // Emergency Panic Button contacts -- also purely local/device-only,
  // same caveat as the profile fields above. Both required before the
  // SOS button (ProfileScreen.tsx) activates.
  familyContactName: string;
  setFamilyContactName: (name: string) => void;
  familyContactPhone: string;
  setFamilyContactPhone: (phone: string) => void;
  ministryContactName: string;
  setMinistryContactName: (name: string) => void;
  ministryContactPhone: string;
  setMinistryContactPhone: (phone: string) => void;

  ready: boolean;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [hasAcceptedDisclosure, setHasAcceptedDisclosure] = useState(false);
  const [hasAcceptedAgreement, setHasAcceptedAgreement] = useState(false);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);
  const [consentRecords, setConsentRecords] = useState<AppContextValue['consentRecords']>({});
  const [hasSeenEntrance, setHasSeenEntrance] = useState(false);
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [planExpiresAt, setPlanExpiresAtState] = useState<string | null>(null);
  const [trialStartedAt, setTrialStartedAt] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [savedSermons, setSavedSermons] = useState<SavedSermon[]>([]);
  const [prayerNotes, setPrayerNotes] = useState<PrayerNote[]>([]);
  const [testimonyNotes, setTestimonyNotes] = useState<TestimonyNote[]>([]);
  const [completedWordSearchPuzzles, setCompletedWordSearchPuzzles] = useState<number[]>([]);
  const [ageAppropriateMode, setAgeAppropriateMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(true);
  const [textZoom, setTextZoom] = useState(1);
  const [displayName, setDisplayNameState] = useState('');
  const [profilePhotoUri, setProfilePhotoUriState] = useState<string | null>(null);
  const [familyContactName, setFamilyContactNameState] = useState('');
  const [familyContactPhone, setFamilyContactPhoneState] = useState('');
  const [ministryContactName, setMinistryContactNameState] = useState('');
  const [ministryContactPhone, setMinistryContactPhoneState] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      // Captured here (rather than read back from state, which wouldn't
      // be committed yet inside this same effect) so the post-load
      // heartbeat below reports whatever plan was actually restored,
      // not always 'free'.
      let heartbeatPlan: PlanId = 'free';
      let heartbeatExpiresAt: string | null = null;
      try {
        const [onboardingRaw, planRaw, messagesRaw, journalRaw, favRaw, prayersRaw, testimoniesRaw, profileRaw, wordSearchCompletedRaw, planExpiresAtRaw, cachedTrialStartedAt, emergencyContactsRaw, highlightsRaw, savedSermonsRaw] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.onboarding),
            AsyncStorage.getItem(STORAGE_KEYS.plan),
            AsyncStorage.getItem(STORAGE_KEYS.messages),
            AsyncStorage.getItem(STORAGE_KEYS.journal),
            AsyncStorage.getItem(STORAGE_KEYS.favorites),
            AsyncStorage.getItem(STORAGE_KEYS.prayers),
            AsyncStorage.getItem(STORAGE_KEYS.testimonies),
            AsyncStorage.getItem(STORAGE_KEYS.profile),
            AsyncStorage.getItem(STORAGE_KEYS.wordSearchCompleted),
            AsyncStorage.getItem(STORAGE_KEYS.planExpiresAt),
            AsyncStorage.getItem(STORAGE_KEYS.trialStartedAt),
            AsyncStorage.getItem(STORAGE_KEYS.emergencyContacts),
            AsyncStorage.getItem(STORAGE_KEYS.highlights),
            AsyncStorage.getItem(STORAGE_KEYS.savedSermons),
          ]);
        if (cachedTrialStartedAt) setTrialStartedAt(cachedTrialStartedAt);

        if (onboardingRaw) {
          const parsed = JSON.parse(onboardingRaw);
          setHasSelectedLanguage(!!parsed.hasSelectedLanguage);
          setHasAcceptedDisclosure(!!parsed.hasAcceptedDisclosure);
          setHasAcceptedAgreement(!!parsed.hasAcceptedAgreement);
          setHasAcceptedPrivacy(!!parsed.hasAcceptedPrivacy);
          setConsentRecords(parsed.consentRecords ?? {});
          setHasSeenEntrance(!!parsed.hasSeenEntrance);
        }
        if (planRaw) {
          // A gift-certificate-granted plan (see selectPlan's expiresAt
          // param) carries an expiration -- a real subscription doesn't.
          // Check it once here, on launch, same spirit as the daily-quota
          // date check just below: if the grant ran out while the app was
          // closed, revert to Free now rather than leaving the expired
          // paid plan silently active until someone notices.
          let restoredPlanId = planRaw as PlanId;
          let restoredExpiresAt = planExpiresAtRaw;
          if (restoredExpiresAt && new Date(restoredExpiresAt).getTime() <= Date.now()) {
            restoredPlanId = 'free';
            restoredExpiresAt = null;
            AsyncStorage.setItem(STORAGE_KEYS.plan, 'free').catch(() => {});
            AsyncStorage.removeItem(STORAGE_KEYS.planExpiresAt).catch(() => {});
          }
          setPlan(restoredPlanId);
          setPlanExpiresAtState(restoredExpiresAt);
          heartbeatPlan = restoredPlanId;
          heartbeatExpiresAt = restoredExpiresAt;
        }
        if (messagesRaw) setMessages(JSON.parse(messagesRaw));
        const journal = await readEncryptedJson<JournalEntry[]>(journalRaw);
        if (journal) setJournalEntries(journal);
        if (favRaw) setFavorites(JSON.parse(favRaw));
        if (highlightsRaw) setHighlights(JSON.parse(highlightsRaw));
        if (savedSermonsRaw) setSavedSermons(JSON.parse(savedSermonsRaw));
        if (profileRaw) {
          const parsed = JSON.parse(profileRaw);
          setDisplayNameState(parsed.displayName ?? '');
          setProfilePhotoUriState(parsed.profilePhotoUri ?? null);
        }
        if (emergencyContactsRaw) {
          const parsed = JSON.parse(emergencyContactsRaw);
          setFamilyContactNameState(parsed.familyContactName ?? '');
          setFamilyContactPhoneState(parsed.familyContactPhone ?? '');
          setMinistryContactNameState(parsed.ministryContactName ?? '');
          setMinistryContactPhoneState(parsed.ministryContactPhone ?? '');
        }
        const prayers = await readEncryptedJson<PrayerNote[]>(prayersRaw);
        if (prayers) setPrayerNotes(prayers);
        const testimonies = await readEncryptedJson<TestimonyNote[]>(testimoniesRaw);
        if (testimonies) setTestimonyNotes(testimonies);
        if (wordSearchCompletedRaw) setCompletedWordSearchPuzzles(JSON.parse(wordSearchCompletedRaw));
      } finally {
        setReady(true);
        // Fire-and-forget: sendDeviceHeartbeat swallows its own errors,
        // and this shouldn't delay setReady/first paint.
        (async () => {
          const deviceId = await getDeviceId();
          // Wires this app's RevenueCat identity to its own deviceId --
          // previously never called anywhere (purchases.ts's
          // initPurchases existed but nothing invoked it), so no
          // purchase/restore/webhook-attribution could actually work.
          initPurchases(deviceId).catch(() => {});
          const heartbeatResult = await sendDeviceHeartbeat(heartbeatPlan, heartbeatExpiresAt);
          if (heartbeatResult?.createdAt) {
            // Server's value always wins over whatever's cached locally --
            // see STORAGE_KEYS.trialStartedAt's own comment.
            setTrialStartedAt(heartbeatResult.createdAt);
            AsyncStorage.setItem(STORAGE_KEYS.trialStartedAt, heartbeatResult.createdAt).catch(() => {});
          } else {
            // Heartbeat failed (offline first launch, etc.) -- if this
            // device has never gotten a server-anchored value at all,
            // cache "now" once so it still gets a real anchor instead of
            // being stuck at permanent day-zero every launch until the
            // network comes back.
            setTrialStartedAt((current) => {
              if (current) return current;
              const now = new Date().toISOString();
              AsyncStorage.setItem(STORAGE_KEYS.trialStartedAt, now).catch(() => {});
              return now;
            });
          }
        })();
      }
    })();
  }, []);

  // Derived trial state -- daysSinceFirstOpen is 0 on day 1 (the day
  // trialStartedAt was set), so isInTrial covers days 0-4, five full
  // calendar days, before the paywall locks everything down.
  const daysSinceFirstOpen = trialStartedAt
    ? Math.floor((Date.now() - new Date(trialStartedAt).getTime()) / 86_400_000)
    : 0;
  const isInTrial = daysSinceFirstOpen < 5;
  const isPaidPlan = plan === 'basic' || plan === 'pro' || plan === 'platinum';
  const hasFullAccess = isPaidPlan || isInTrial;

  // Trial analytics -- each fires at most once (trial_started) or once
  // per calendar day (trial_day_returned) or once ever at the moment it
  // becomes true (trial_expired), guarded by their own AsyncStorage
  // flags so remounts/re-renders never spam duplicate rows. Best-effort:
  // logEvent() itself already swallows all errors.
  useEffect(() => {
    if (!ready || !trialStartedAt) return;
    (async () => {
      const already = await AsyncStorage.getItem(STORAGE_KEYS.trialStartedLogged);
      if (already) return;
      await logEvent('trial_started', { trialStartedAt });
      AsyncStorage.setItem(STORAGE_KEYS.trialStartedLogged, '1').catch(() => {});
    })();
  }, [ready, trialStartedAt]);

  useEffect(() => {
    if (!ready || !trialStartedAt || !isInTrial) return;
    const day = Math.min(Math.max(daysSinceFirstOpen + 1, 1), 5);
    (async () => {
      const today = todayKey();
      const lastLogged = await AsyncStorage.getItem(STORAGE_KEYS.trialDayReturnedLoggedDate);
      if (lastLogged === today) return;
      await logEvent('trial_day_returned', { day });
      AsyncStorage.setItem(STORAGE_KEYS.trialDayReturnedLoggedDate, today).catch(() => {});
    })();
  }, [ready, trialStartedAt, isInTrial, daysSinceFirstOpen]);

  useEffect(() => {
    if (!ready || !trialStartedAt || isInTrial) return;
    (async () => {
      const already = await AsyncStorage.getItem(STORAGE_KEYS.trialExpiredLogged);
      if (already) return;
      await logEvent('trial_expired', {});
      AsyncStorage.setItem(STORAGE_KEYS.trialExpiredLogged, '1').catch(() => {});
    })();
  }, [ready, trialStartedAt, isInTrial]);

  const persistOnboarding = useCallback(
    (
      patch: Partial<{
        hasSelectedLanguage: boolean;
        hasAcceptedDisclosure: boolean;
        hasAcceptedAgreement: boolean;
        hasAcceptedPrivacy: boolean;
        consentRecords: AppContextValue['consentRecords'];
        hasSeenEntrance: boolean;
      }>
    ) => {
      AsyncStorage.setItem(
        STORAGE_KEYS.onboarding,
        JSON.stringify({
          hasSelectedLanguage,
          hasAcceptedDisclosure,
          hasAcceptedAgreement,
          hasAcceptedPrivacy,
          consentRecords,
          hasSeenEntrance,
          ...patch,
        })
      ).catch(() => {});
    },
    [hasSelectedLanguage, hasAcceptedDisclosure, hasAcceptedAgreement, hasAcceptedPrivacy, consentRecords, hasSeenEntrance]
  );

  const markLanguageSelected = useCallback(() => {
    setHasSelectedLanguage(true);
    persistOnboarding({ hasSelectedLanguage: true });
  }, [persistOnboarding]);

  // Each accept* function below records both the plain boolean gate
  // (unchanged, still what onboardingComplete/RootNavigator branch on)
  // and a consentRecords entry with when + which doc version was shown --
  // an audit trail, not a gating mechanism. docVersion reads each legal
  // doc's own `lastUpdated` string, so a future text revision naturally
  // produces a new version stamp without any extra bookkeeping here.
  const acceptDisclosure = useCallback(() => {
    setHasAcceptedDisclosure(true);
    const record = { acceptedAt: new Date().toISOString(), docVersion: AI_DISCLOSURE.lastUpdated };
    setConsentRecords((prev) => ({ ...prev, disclosure: record }));
    persistOnboarding({ hasAcceptedDisclosure: true, consentRecords: { ...consentRecords, disclosure: record } });
  }, [persistOnboarding, consentRecords]);

  const acceptAgreement = useCallback(() => {
    setHasAcceptedAgreement(true);
    const record = { acceptedAt: new Date().toISOString(), docVersion: USER_AGREEMENT.lastUpdated };
    setConsentRecords((prev) => ({ ...prev, agreement: record }));
    persistOnboarding({ hasAcceptedAgreement: true, consentRecords: { ...consentRecords, agreement: record } });
  }, [persistOnboarding, consentRecords]);

  const acceptPrivacy = useCallback(() => {
    setHasAcceptedPrivacy(true);
    const record = { acceptedAt: new Date().toISOString(), docVersion: PRIVACY_POLICY.lastUpdated };
    setConsentRecords((prev) => ({ ...prev, privacy: record }));
    persistOnboarding({ hasAcceptedPrivacy: true, consentRecords: { ...consentRecords, privacy: record } });
  }, [persistOnboarding, consentRecords]);

  const acceptAllAgreements = useCallback(() => {
    const acceptedAt = new Date().toISOString();
    const records = {
      disclosure: { acceptedAt, docVersion: AI_DISCLOSURE.lastUpdated },
      agreement: { acceptedAt, docVersion: USER_AGREEMENT.lastUpdated },
      privacy: { acceptedAt, docVersion: PRIVACY_POLICY.lastUpdated },
    };
    setHasAcceptedDisclosure(true);
    setHasAcceptedAgreement(true);
    setHasAcceptedPrivacy(true);
    setConsentRecords(records);
    persistOnboarding({ hasAcceptedDisclosure: true, hasAcceptedAgreement: true, hasAcceptedPrivacy: true, consentRecords: records });
  }, [persistOnboarding]);

  const markEntranceSeen = useCallback(() => {
    setHasSeenEntrance(true);
    persistOnboarding({ hasSeenEntrance: true });
  }, [persistOnboarding]);

  const selectPlan = useCallback((planId: PlanId, expiresAt: string | null = null) => {
    setPlan(planId);
    setPlanExpiresAtState(expiresAt);
    AsyncStorage.setItem(STORAGE_KEYS.plan, planId).catch(() => {});
    if (expiresAt) {
      AsyncStorage.setItem(STORAGE_KEYS.planExpiresAt, expiresAt).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.planExpiresAt).catch(() => {});
    }
    // Records the actual moment the plan changed (upgrade, downgrade,
    // gift redemption, expiry reverting to free) -- see
    // backend/server.js's /v1/device/heartbeat comment for why this is
    // event-driven rather than just polled from launch.
    sendDeviceHeartbeat(planId, expiresAt);
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

  const addHighlight = useCallback((h: Highlight) => {
    setHighlights((prev) => {
      const next = [h, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.highlights, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removeHighlight = useCallback((id: string) => {
    setHighlights((prev) => {
      const next = prev.filter((h) => h.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.highlights, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setHighlightColor = useCallback((id: string, color: Highlight['color']) => {
    setHighlights((prev) => {
      const next = prev.map((h) => (h.id === id ? { ...h, color } : h));
      AsyncStorage.setItem(STORAGE_KEYS.highlights, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const addSavedSermon = useCallback((s: SavedSermon) => {
    setSavedSermons((prev) => {
      const next = [s, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.savedSermons, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removeSavedSermon = useCallback((id: string) => {
    setSavedSermons((prev) => {
      const next = prev.filter((s) => s.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.savedSermons, JSON.stringify(next)).catch(() => {});
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

  const addTestimonyNote = useCallback((n: TestimonyNote) => {
    setTestimonyNotes((prev) => {
      const next = [n, ...prev];
      writeEncryptedJson(STORAGE_KEYS.testimonies, next).catch(() => {});
      return next;
    });
  }, []);

  const addCompletedWordSearchPuzzle = useCallback((seed: number) => {
    setCompletedWordSearchPuzzles((prev) => {
      if (prev.includes(seed)) return prev;
      const next = [...prev, seed];
      AsyncStorage.setItem(STORAGE_KEYS.wordSearchCompleted, JSON.stringify(next)).catch(() => {});
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

  // Own key/patch-merge helper, same shape as persistProfile above, kept
  // separate (see STORAGE_KEYS.emergencyContacts's own comment).
  const persistEmergencyContacts = useCallback(
    (patch: Partial<{
      familyContactName: string;
      familyContactPhone: string;
      ministryContactName: string;
      ministryContactPhone: string;
    }>) => {
      AsyncStorage.setItem(
        STORAGE_KEYS.emergencyContacts,
        JSON.stringify({ familyContactName, familyContactPhone, ministryContactName, ministryContactPhone, ...patch })
      ).catch(() => {});
    },
    [familyContactName, familyContactPhone, ministryContactName, ministryContactPhone]
  );

  const setFamilyContactName = useCallback(
    (name: string) => {
      setFamilyContactNameState(name);
      persistEmergencyContacts({ familyContactName: name });
    },
    [persistEmergencyContacts]
  );

  const setFamilyContactPhone = useCallback(
    (phone: string) => {
      setFamilyContactPhoneState(phone);
      persistEmergencyContacts({ familyContactPhone: phone });
    },
    [persistEmergencyContacts]
  );

  const setMinistryContactName = useCallback(
    (name: string) => {
      setMinistryContactNameState(name);
      persistEmergencyContacts({ ministryContactName: name });
    },
    [persistEmergencyContacts]
  );

  const setMinistryContactPhone = useCallback(
    (phone: string) => {
      setMinistryContactPhoneState(phone);
      persistEmergencyContacts({ ministryContactPhone: phone });
    },
    [persistEmergencyContacts]
  );

  const wipeAllLocalData = useCallback(async () => {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    setHasSelectedLanguage(false);
    setHasAcceptedDisclosure(false);
    setHasAcceptedAgreement(false);
    setHasAcceptedPrivacy(false);
    setConsentRecords({});
    setHasSeenEntrance(false);
    setPlan(null);
    setPlanExpiresAtState(null);
    // Deliberately NOT a trial reset -- the next heartbeat re-fetches
    // this same device's server-anchored users.created_at (deviceId
    // itself isn't regenerated by this wipe), so the trial clock picks
    // up exactly where it was, not a fresh 5 days.
    setTrialStartedAt(null);
    setMessages([]);
    setJournalEntries([]);
    setFavorites([]);
    setHighlights([]);
    setSavedSermons([]);
    setPrayerNotes([]);
    setTestimonyNotes([]);
    setCompletedWordSearchPuzzles([]);
    setDisplayNameState('');
    setProfilePhotoUriState(null);
    setFamilyContactNameState('');
    setFamilyContactPhoneState('');
    setMinistryContactNameState('');
    setMinistryContactPhoneState('');
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      hasSelectedLanguage,
      markLanguageSelected,
      hasAcceptedDisclosure,
      acceptDisclosure,
      hasAcceptedAgreement,
      acceptAgreement,
      hasAcceptedPrivacy,
      acceptPrivacy,
      acceptAllAgreements,
      consentRecords,
      needsLegalReconsent:
        consentRecords.disclosure?.docVersion !== AI_DISCLOSURE.lastUpdated ||
        consentRecords.agreement?.docVersion !== USER_AGREEMENT.lastUpdated ||
        consentRecords.privacy?.docVersion !== PRIVACY_POLICY.lastUpdated,
      hasSeenEntrance,
      markEntranceSeen,
      hasSelectedPlan: plan !== null,
      plan: plan ?? 'free',
      selectPlan,
      planExpiresAt,
      onboardingComplete:
        hasSelectedLanguage && hasAcceptedDisclosure && hasAcceptedAgreement && hasAcceptedPrivacy && hasSeenEntrance,
      trialStartedAt,
      daysSinceFirstOpen,
      isInTrial,
      hasFullAccess,
      messages,
      addMessage,
      clearMessages,
      journalEntries,
      addJournalEntry,
      removeJournalEntry,
      favorites,
      addFavorite,
      removeFavorite,
      highlights,
      addHighlight,
      removeHighlight,
      setHighlightColor,
      savedSermons,
      addSavedSermon,
      removeSavedSermon,
      prayerNotes,
      addPrayerNote,
      testimonyNotes,
      addTestimonyNote,
      completedWordSearchPuzzles,
      addCompletedWordSearchPuzzle,
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
      familyContactName,
      setFamilyContactName,
      familyContactPhone,
      setFamilyContactPhone,
      ministryContactName,
      setMinistryContactName,
      ministryContactPhone,
      setMinistryContactPhone,
      ready,
    }),
    [
      hasSelectedLanguage, markLanguageSelected, hasAcceptedDisclosure, acceptDisclosure,
      hasAcceptedAgreement, acceptAgreement, hasAcceptedPrivacy, acceptPrivacy, acceptAllAgreements, consentRecords,
      hasSeenEntrance, markEntranceSeen, plan, selectPlan,
      planExpiresAt, trialStartedAt, daysSinceFirstOpen, isInTrial, hasFullAccess,
      messages, addMessage, clearMessages,
      journalEntries, addJournalEntry, removeJournalEntry, favorites, addFavorite, removeFavorite,
      highlights, addHighlight, removeHighlight, setHighlightColor,
      savedSermons, addSavedSermon, removeSavedSermon,
      prayerNotes, addPrayerNote, testimonyNotes, addTestimonyNote,
      completedWordSearchPuzzles, addCompletedWordSearchPuzzle,
      wipeAllLocalData, ageAppropriateMode, offlineMode,
      voiceRepliesEnabled,
      textZoom, setTextZoom,
      displayName, setDisplayName, profilePhotoUri, setProfilePhotoUri, ready,
      familyContactName, setFamilyContactName, familyContactPhone, setFamilyContactPhone,
      ministryContactName, setMinistryContactName, ministryContactPhone, setMinistryContactPhone,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
