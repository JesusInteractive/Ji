# App Store & Google Play privacy declarations

Reference doc for filling in Apple's App Privacy (Nutrition Label) form in App Store Connect and Google Play's Data Safety form in Play Console. Not read by the app itself -- copy these values in by hand. Source of truth for what's actually collected/sent is `backend/legal-documents.json` (the one legal file both the app and the backend's public `/privacy` page read) plus `backend/server.js`'s `MANAGE_DATA` page -- keep this file in sync if those change.

## Third-party data processors (name every one, per feature)

| Feature | Data sent | Processor |
|---|---|---|
| Ask Jesus (chat) | Message text, limited conversation history | **xAI** (Grok) |
| Gospel Translator | Spoken/typed text being translated | **xAI** (Grok) |
| Daily Devotions Generator | Prompt/topic text | **Anthropic** (Claude) |
| Sermon & Bible Study Writer | Prompt/topic text | **Anthropic** (Claude) |
| Voice input/output (STT/TTS) | Audio, synthesized speech text | **ElevenLabs** |
| Emergency SOS | Contact phone numbers, alert text, one-time GPS location | **Twilio** (SMS delivery only, triggered solely by the user tapping SOS) |
| All backend requests | Device identifier, usage/session data | **Vercel** (hosting/routes), **Neon** (Postgres database) |
| Subscription status | Device identifier, purchase/entitlement events | **RevenueCat** (subscription management), **Apple** (App Store) / **Google** (Play Billing) -- payment details never reach Jesus Interactive's own servers |

## Apple App Store Connect -- App Privacy (Nutrition Label)

Declare these data types as **collected**:
- **Contact Info** -> Name: linked to user (display name, optional; used for personalization -- "Welcome, {name}")
- **User Content** -> Customer Support / Other User Content: chat messages, sermon drafts, journal/prayer content sent to AI features -- linked to user (device ID)
- **Identifiers** -> Device ID: linked to user (this app has no login/account system -- see `src/constants/legal.ts`/backend `PRIVACY_POLICY`'s "no email/password login" note)
- **Usage Data** -> Product Interaction: linked to user (screens viewed, features used)
- **Location** -> Precise Location: linked to user, but **only** captured at the instant the user taps Emergency SOS -- not background/continuous. Declare as collected, purpose "App Functionality," and note the one-time/user-initiated nature in the description field if Apple's form allows free text.

Purposes: **App Functionality**, **Personalization**. Not for tracking, not for third-party advertising, no data broker sale.

Do **not** declare: Health & Fitness, Financial Info (Apple/Google handle payment directly), Browsing History, Search History, Contacts (the app never reads the device's own contacts list -- Emergency SOS contacts are typed in manually and stored locally on-device only, transmitted to Jesus Interactive's backend only at the moment of an actual SOS alert).

## Google Play Console -- Data Safety form

Same categories as above, mapped to Play's taxonomy:
- **App activity** -> App interactions: collected, shared with xAI/Anthropic only as needed to generate a response (not sold, not used for advertising)
- **Messages** -> In-app messages: collected (chat/AI conversation content)
- **Personal info** -> Name: collected, optional, user-provided
- **Location** -> Approximate or precise location: collected, **only** on explicit Emergency SOS use -- not collected in the background
- **Device or other IDs**: collected (device identifier, no account system)

Mark data as **encrypted in transit** (HTTPS/TLS only -- confirmed via `backend/server.js`'s `NSAllowsArbitraryLoads: false` / no cleartext override on Android). Mark **user can request data deletion**: yes -- in-app account/data deletion exists (Settings -> Delete my account and all data), matching `ACCOUNT_DELETION`/`MANAGE_DATA` in `backend/server.js`.

Privacy policy URL: whatever public HTML URL `backend/server.js`'s `/privacy` route resolves to in production (must be a live HTML page, not a PDF, per Play's requirement) -- confirm the production domain before submitting.

## AI-generated content labeling

Both stores' policies (and this app's own `AI_DISCLOSURE`) require AI output to be visibly marked as AI-generated. Confirm before submission that:
- Every Ask Jesus response, and every Devotions/Sermon Writer output, carries a visible "AI-generated" indicator in the UI (per `AI_DISCLOSURE` section 6's existing commitment -- verify the actual screens still do this, this doc doesn't re-verify UI state).
- A report/flag control exists inside Ask Jesus for a user to flag a bad AI response (per `AI_DISCLOSURE` section 7's existing commitment).

## What this file does NOT cover

Actually submitting these values into App Store Connect / Play Console is a manual step in each console -- this file is the copy-pasteable reference, not an automated submission. Re-check this file against the live `PRIVACY_POLICY`/`AI_DISCLOSURE` text any time those change, since drift between the in-app disclosure and the store-level declaration is exactly the kind of mismatch Apple Guideline 5.1.2(i) flags.
