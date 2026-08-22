// Shared type definitions for the Jesus Interactive app.

export type LanguageCode = 'en' | 'el' | 'he' | 'es' | 'fr' | 'pt' | 'ar' | 'hi';

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
  features: string[];
  badge?: string;
}

export interface TokenPack {
  id: string;
  tokens: number;
  priceLabel: string;
  description: string;
}

export interface GiftCode {
  code: string;
  tokens: number;
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

export interface PrayerNote {
  id: string;
  text: string;
  isAnonymous: boolean;
  createdAt: string;
  // Wall notes are ephemeral/local-first by default; see PrayerWallScreen
  // for the privacy model (nothing is public unless the user opts in).
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
