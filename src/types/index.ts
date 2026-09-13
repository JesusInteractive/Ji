// Shared type definitions for the Jesus Interactive app.

// A plain ISO 639-1 code, not a narrow union -- the language PICKER
// (src/i18n/languages.ts's LANGUAGES) covers 100+ languages so Jesus's
// actual chat replies (not gated by translation work at all -- see
// backend/server.js) can come back in any of them, but only a handful
// have full UI translation files (src/i18n/locales/*.ts, keyed in
// CATALOG). A literal string union of 100+ codes would buy nothing here
// since CATALOG lookups already need a runtime fallback to English for
// codes it doesn't have a file for.
export type LanguageCode = string;

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  rtl?: boolean;
}

export type PlanId = 'free' | 'basic' | 'pro' | 'platinum';

export interface Plan {
  id: PlanId;
  name: string;
  priceLabel: string;
  dailyQuestionLimit: number | null; // null = unlimited
  // false for the free introductory offer: dailyQuestionLimit is a
  // one-time lifetime allowance that never refills on a new calendar
  // day, unlike the paid tiers' genuinely-daily limit. See
  // AppContext.tsx's quota restore effect.
  resetsDaily: boolean;
  features: string[];
  badge?: string;
}

// Gift certificates replace the old per-question token packs: a giver
// buys a code that activates a real plan (see GIFT_CERTIFICATES in
// constants/pricing.ts) on the recipient's account for a fixed duration,
// instead of just adding N extra questions.
export interface GiftCertificate {
  id: string;
  planId: Exclude<PlanId, 'free'>;
  durationMonths: 1 | 3 | 12;
  priceLabel: string;
  description: string;
}

export interface GiftCode {
  code: string;
  planId: Exclude<PlanId, 'free'>;
  durationMonths: number;
  createdByUserId: string;
  redeemedByUserId: string | null;
  createdAt: string;
  redeemedAt: string | null;
}

// The visible/emotive state of the Jesus avatar in chat. Drives which
// animation & audio cue plays. See src/components/JesusAvatar.tsx.
export type JesusMood =
  | 'neutral'
  | 'warm'
  | 'tearful'
  | 'laughing'
  | 'grieved' // reserved for trafficking / deep-suffering topics
  | 'fadingOut'; // reserved for abusive sessions or session end

export type MessageAuthor = 'user' | 'jesus';

export interface ChatMessage {
  id: string;
  author: MessageAuthor;
  text: string;
  mood?: JesusMood;
  createdAt: string;
  flagged?: boolean;
}

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  linkedMessageIds?: string[];
  // Optional attachments so a Notes entry can show up on My Library's
  // "tied to Scripture"/sermon shelves without a separate store -- see
  // LibraryScreen.tsx.
  linkedVerseReference?: string; // e.g. "Isaiah 53:5", same shape as FavoriteItem.reference
  linkedSermon?: { title: string; url: string };
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteItem {
  id: string;
  type: 'verse' | 'message';
  reference?: string; // e.g. "Isaiah 53:5"
  text: string;
  createdAt: string;
}

// A user's own bookmark of an outbound sermon link (SermonAudio, etc.) --
// title is user-entered since we never scrape/host the third-party page,
// only the link itself. See LibraryScreen.tsx / SermonsLandingScreen.tsx.
export interface SavedSermon {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

// The 5 highlighter pen colors -- see HighlighterToolbar.tsx.
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

// What a single highlight is anchored to. A Bible verse carries no
// book/chapter/translation of its own (see bibleApi.ts's BibleVerse), so
// the coordinate below is what "re-opening the same passage" matches
// against -- the same ad hoc reference-building ScriptureSearchScreen's
// addFavorite call already does. A journal highlight is anchored to a
// paragraph index within that entry's body (split on blank lines each
// time it's opened -- see JournalScreen.tsx), since journal text has no
// fixed verse-like unit of its own.
export type HighlightTarget =
  | { kind: 'verse'; translationId: string; bookId: string; chapter: number; verseNumber: number }
  | { kind: 'journalParagraph'; journalEntryId: string; paragraphIndex: number };

export interface Highlight {
  id: string;
  target: HighlightTarget;
  color: HighlightColor;
  createdAt: string;
}

export interface PrayerNote {
  id: string;
  text: string;
  isAnonymous: boolean;
  createdAt: string;
  // Wall notes are ephemeral/local-first by default; see PrayerWallScreen
  // for the privacy model (nothing is public unless the user opts in).
  sharedPublicly: boolean;
}

// Same shape and same local-first privacy model as PrayerNote (see its
// own comment) -- "sharedPublicly" is honest about intent for a future
// real public stream, but today nothing leaves the device; there's no
// backend to receive it yet.
export interface TestimonyNote {
  id: string;
  text: string;
  isAnonymous: boolean;
  createdAt: string;
  sharedPublicly: boolean;
}

export type ProphecyCategory =
  | 'Birth & Early Life'
  | 'Ministry & Character'
  | 'Betrayal, Suffering & Death'
  | 'Resurrection & Exaltation';

export interface Prophecy {
  id: string;
  topic: string;
  category: ProphecyCategory;
  otReference: string;
  otText: string;
  fulfillmentReference: string;
  fulfillmentSummary: string;
  // A short "why this matters" line beyond the bare fulfillment summary --
  // used for the handful of priority/spotlight prophecies (Isaiah 53,
  // Psalm 22, virgin birth, Bethlehem, etc.) that get fuller treatment in
  // the About screen.
  explanation?: string;
  spotlight?: boolean;
}

export interface AnalyticsEvent {
  name: string;
  // Never include free-text user content, message bodies, or any
  // direct/indirect identifier here. See src/services/analytics.ts.
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}
