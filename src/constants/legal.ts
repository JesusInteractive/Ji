// Legal copy shown during onboarding (the single-scroll Agreements
// screen) and linked from Settings.
//
// The text itself lives in backend/legal-documents.json -- one file shared
// with the backend's public /disclosure, /terms, and /privacy pages (the
// URLs the App Store and Google Play listings point to), so what users
// agree to in the app can never drift from what the store listings show.
// It had drifted: until September 2026 the in-app Privacy Policy still
// described email/password accounts this app has never had, while the
// public page described the real device-ID setup.
//
// Changing a document: edit the JSON and bump that document's
// `lastUpdated`. AppContext compares each user's recorded consent version
// against `lastUpdated`, so a bump asks existing users to review and
// accept the new text before they continue (see needsLegalReconsent).
//
// Jesus Interactive Inc. is the contracting party named throughout. The
// Apple Developer Program / Google Play Console *enrollment* is a separate,
// account-level thing: if it's still registered to an individual, the
// store's public "Seller" line may keep showing that name until the
// enrollment itself is migrated with Apple/Google.
//
// AI providers are named per feature -- Grok (xAI) for Ask Jesus and the
// Gospel Translator, Claude (Anthropic) for Daily Devotions and the Sermon
// & Bible Study Writer, ElevenLabs for voice. backend/server.js's
// top-of-file comment is the authoritative per-route list to check against.
import documents from '../../backend/legal-documents.json';
import type { LegalDocParams } from '../navigation/SettingsStack';

type LegalDocument = LegalDocParams & { lastUpdated: string };

export const AI_DISCLOSURE: LegalDocument = documents.aiDisclosure;

// Kept under the USER_AGREEMENT name (rather than TERMS_OF_SERVICE) so
// AppContext's consent records and Settings didn't need to change which
// constant they import.
export const USER_AGREEMENT: LegalDocument = documents.termsOfService;

export const PRIVACY_POLICY: LegalDocument & { effectiveDate: string } = documents.privacyPolicy;
