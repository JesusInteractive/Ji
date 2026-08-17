# Jesus Interactive (TypeScript rebuild)

A production-track Expo + React Native + TypeScript rebuild of Jesus
Interactive: an AI-guided conversational companion in the voice of Jesus,
grounded in Scripture, with a Prayer Wall, guided prayer, Scripture
search (Bible + Torah), journaling, favorites, a full About/prophecy
section, multi-language onboarding, and a token/gift-code system.

This is a new, separate project folder from your original `JesusInteractive`
(JavaScript) app so nothing here collides with that one. See "How this
relates to your other project" below.

## Quick start

```bash
cd JesusInteractiveTS
npm install
npx expo start
```

Press `i` (iOS simulator), `a` (Android emulator), or scan the QR code with
Expo Go.

## Troubleshooting: EMFILE / "too many open files" (Watchman)

`package.json` includes `"watchman": false` as requested, but that key has
no effect on its own -- Metro/Expo don't read package.json for it. Two real
fixes, pick one:

**Option A -- the usual fix (recommended):** install Watchman properly.
Ironically, most EMFILE errors on macOS happen because Watchman is
*missing*, so Node's fallback file-watcher opens far more file descriptors
than the default macOS limit (256) allows.
```bash
brew install watchman
watchman watch-del-all
npx expo start -c   # -c clears the Metro cache
```

**Option B -- if you truly want zero Watchman dependency:** Metro only uses
Watchman if the `watchman` binary is on your PATH. Remove it, and Metro
automatically falls back to its own crawler, plus raise your file
descriptor limit so that fallback crawler doesn't hit the same wall:
```bash
brew uninstall watchman
ulimit -n 10240
npx expo start -c
```
(Put the `ulimit` line in your shell profile if you don't want to retype it
every session.)

## Project structure

```
JesusInteractiveTS/
├── index.ts                        # Entry point (registerRootComponent)
├── app.json, package.json, tsconfig.json, babel.config.js
├── assets/                         # icon/splash/adaptive-icon/favicon (from your logo)
└── src/
    ├── AppRoot.tsx                 # Providers + NavigationContainer
    ├── types/                      # Shared TS types (ChatMessage, Plan, Prophecy, JesusMood, ...)
    ├── theme/colors.ts              # Royal blue / gold / cream brand palette
    ├── i18n/                       # 6 launch languages: en, es, fr, pt, ar (RTL), hi
    │   ├── locales/*.ts
    │   ├── languages.ts
    │   └── index.tsx               # I18nProvider / useI18n()
    ├── constants/
    │   ├── persona.ts              # Full Jesus system prompt -- server-side only in prod
    │   ├── legal.ts                # AI disclosure, User Agreement/Indemnity, privacy/terms summaries
    │   ├── pricing.ts              # 4 subscription tiers + token packs
    │   ├── about.ts, lineage.ts, prophecies.ts   # About tab content
    │   └── sampleConversations.ts  # Reference Q&A pairs matching persona rules
    ├── context/AppContext.tsx      # Onboarding state, plan, tokens, messages, journal, favorites, prayers
    ├── services/
    │   ├── api.ts                  # Production backend client (never embeds API keys)
    │   ├── demoReplyEngine.ts      # Offline keyword-based Jesus replies (swap for api.ts in prod)
    │   ├── bibleApi.ts             # Free Use Bible API client, 30-day cache, Torah filter
    │   ├── security.ts             # Encryption/no-backdoor architecture notes + local key helper
    │   ├── analytics.ts            # Anonymized-only analytics gate
    │   ├── notifications.ts        # Daily verse push (expo-notifications)
    │   ├── cache.ts                # Response caching + client throttle; documents server rate-limit design
    │   └── tokenGifting.ts         # Gift code generation/redemption (demo; needs backend ledger)
    ├── components/
    │   ├── JesusAvatar.tsx         # Mood-driven avatar: tearful / laughing / grieved / fading out
    │   ├── GlorySplash.tsx         # Heavenly door + glory cloud entrance animation
    │   ├── WesternWallBackground.tsx  # SVG meleke-limestone Kotel wall (Herodian margins, staggered joints, crevices)
    │   ├── PrayerNote.tsx          # Folded-paper note tucked into a wall crevice, tap to read
    │   ├── TipBanner.tsx           # One-time dismissible onboarding tip
    │   ├── ChatBubble.tsx, PlanCard.tsx, LanguagePicker.tsx
    │   └── PrayerStone.tsx         # Unused leftover from the first Prayer Wall pass -- superseded by WesternWallBackground + PrayerNote
    ├── navigation/
    │   ├── RootNavigator.tsx       # Onboarding stack vs Main tabs
    │   ├── MainTabs.tsx            # Home / Chat / Prayer Wall / Bible / Journal / Settings
    │   ├── ChatStack.tsx           # Chat -> About / Favorites / Guided Prayer
    │   └── SettingsStack.tsx       # Settings -> Buy & Gift
    └── screens/
        ├── onboarding/             # LanguageSelect -> Disclaimer -> UserAgreement -> Entrance -> Pricing
        ├── HomeScreen.tsx          # First tab; quick links into Chat / Prayer Wall / Bible / Journal
        ├── ChatScreen.tsx, PrayerWallScreen.tsx, GuidedPrayerScreen.tsx
        ├── ScriptureSearchScreen.tsx, JournalScreen.tsx, FavoritesScreen.tsx
        ├── AboutScreen.tsx, SettingsScreen.tsx, TokenGiftScreen.tsx
```

## What's real vs. what's a documented stub

Everything above runs today, offline, with no backend -- the chat uses
`demoReplyEngine.ts`, a keyword-matched offline stand-in for the real
model. Before shipping, wire these up:

- **Chat**: swap `demoReplyEngine` for `services/api.ts` → your backend →
  the model API, with `persona.ts` injected server-side only.
  `backend/` is a minimal, runnable reference for exactly that -- Express
  + Anthropic's Messages API, `ANTHROPIC_API_KEY` from its own `.env`
  (never the app's), a `TODO` placeholder for the persona text (copy it
  from `persona.ts` by hand -- same manual-mirroring approach
  `demoReplyEngine.ts` already uses, since this is plain JS with no
  build step to import a `.ts` file). It's a separate Node project with
  its own `package.json` -- `cd backend && npm install && cp .env.example
  .env` (fill in your key) `&& npm start`. Mood detection isn't
  implemented (always returns `'neutral'`), and its auth check only
  requires *a* Bearer header, not a real validated one -- there's still
  no auth system anywhere in this app (see `AppContext.tsx`).
- **Payments/tokens**: `subscribeToPlan`, `purchaseTokenPack`,
  `createGiftCode` in `api.ts` are stubs; wire to StoreKit/Play Billing
  (or RevenueCat) + your own ledger. Never trust client-reported plan/
  token state for entitlement.
- **Push notifications**: `notifications.ts` gets a real Expo push token;
  you still need a backend to store it and trigger the actual daily send.
- **Voice / lip-sync**: `services/tts.ts` is a stub -- no TTS provider is
  wired up (`synthesizeSpeech` calls a backend endpoint that doesn't
  exist yet, same bearer-token pattern as `api.ts`). `ChatScreen.tsx`
  already calls it after every Jesus reply and wires the result to a
  persistent header `JesusAvatar` via its
  `speaking`/`amplitude`/`startSpeaking()`/`stopSpeaking()` API -- until a
  real backend/provider exists this just fails safely (`console.error`,
  avatar stays idle), it doesn't break sending messages. See
  `JesusAvatar.tsx`'s own top-of-file comment for the full hybrid
  lip-sync/expression-blending architecture and what's still symbolic
  without real video assets, and `tools/backend-examples/ttsRoute.example.js`
  for a reference backend route (Express + ElevenLabs).
  - ElevenLabs dashboard: https://elevenlabs.io/app
  - ElevenLabs TTS API docs: https://elevenlabs.io/docs/api-reference/text-to-speech
  - ElevenLabs voice library: https://elevenlabs.io/app/voice-library
- **Security / "no backdoors"**: `services/security.ts` lays out an
  honest architecture -- full end-to-end encryption is realistic for
  Journal and private Prayer Wall notes (never sent to the model), but is
  in real tension with an AI chat product where the backend must see
  plaintext to call the model. Read the comments there before promising
  "full E2E encryption" in your marketing or Privacy Policy.
- **Analytics**: `analytics.ts` refuses to accept free-text properties
  and never attaches a persistent identifier -- point it at a real
  anonymous-mode analytics backend.
- **Legal copy**: `constants/legal.ts` (AI Disclosure, User Agreement &
  Indemnity, Privacy/Terms summaries) is DRAFT product copy, not legal
  advice. Have it reviewed by a licensed attorney before launch.

## Bible / Torah / Talmud

`services/bibleApi.ts` pulls from the free, no-key **Free Use Bible API**
(bible.helloao.org), defaulting to the Berean Standard Bible, cached 30
days in AsyncStorage. `ScriptureSearchScreen` filters to the Torah (first
five books) via `TORAH_BOOK_IDS`. This sandbox's network policy blocked
me from live-testing the API while building, so `normalizeChapter()` is
written from the documented response shape -- verify it on a real device
before shipping (same caveat as your original project's Bible
integration). **Talmud** text isn't covered by this API; Sefaria
(sefaria.org) has a free public API with Talmud text -- add a second
client alongside `bibleApi.ts` the same way when you're ready.

## Languages

Spec called for very broad language/dialect coverage (major African
languages, more Indian languages, etc.). This build ships 6 fully,
professionally-worded translations -- English, Spanish, French,
Portuguese, Arabic (RTL), Hindi -- rather than machine-translating dozens
more, so nothing reaches users in a language that reads as broken. The
i18n system (`src/i18n/`) is built so adding a language is just: add a
`locales/xx.ts` matching the English key shape, then list it in
`languages.ts`. Budget for professional/community translation review
before adding more, especially for a faith product where tone matters.

## Age Policy

- **Minimum age: 13+.**
- On first launch (or the language selection screen), the user must check
  a confirmation box before continuing:
  - ☐ "I confirm that I am 13 years of age or older"
- Not yet wired up in the onboarding flow (`screens/onboarding/`) or
  `constants/legal.ts` -- recorded here so the requirement doesn't get
  lost before the checkbox + gate are actually built.

## Safety, moderation, accessibility & offline

- **Crisis protocol**: `services/demoReplyEngine.ts` + `constants/crisisResources.ts`
  give a compassionate response plus a real call/text hotline (US 988 +
  Crisis Text Line, UK Samaritans, Canada Talk Suicide, Australia
  Lifeline), auto-picked from the device region (`expo-localization`)
  when possible, with a tappable "Find crisis help near you" button
  (`ChatBubble.tsx`) linking to the IASP international directory as a
  fallback for every other country. The app never tries to act as a
  therapist -- it comforts, then hands off to a real person, every time,
  regardless of Age-Appropriate Mode.
- **Age-Appropriate Mode** (Settings): now actually filters -- trafficking
  and graphic-suffering topics get a softened redirect toward a trusted
  adult instead of the full answer. Crisis handling is never softened by
  this flag.
- **Full account deletion**: Settings > "Delete my account and all data"
  now genuinely wipes every local store (messages, journal, favorites,
  prayer notes, tokens, plan, onboarding state) via
  `AppContext.wipeAllLocalData()`, not just chat history. Still needs the
  paired backend call (`api.ts` `deleteAccountAndAllData`) wired up for
  the server-side half.
- **Offline behavior**: Settings > "What works offline?" spells out what
  needs no connection (saved chats, journal, favorites, placed prayers,
  already-cached Bible chapters) vs. what needs internet (new chat
  replies once the backend is live, uncached Bible content, sync,
  purchases, push).
- **Accessibility**: icon-only buttons and the onboarding checkboxes carry
  `accessibilityLabel`/`accessibilityRole` for screen readers (VoiceOver/
  TalkBack); no `Text` in this app sets `allowFontScaling={false}`, so
  React Native's default behavior of following the device's OS-level
  "Larger Text" accessibility setting is intact everywhere. A full
  contrast audit is still worth doing before launch.
- **Onboarding tooltips**: a single dismissible tip (remembered
  permanently once closed) on first visit to Chat and the Prayer Wall --
  see `components/TipBanner.tsx`. Deliberately not a multi-step guided
  tour.
- **Periodic reminders**: `demoReplyEngine.ts`'s `maybeBridgeReminder()`
  alternates every 8 user messages between a "this app is a bridge, not
  the destination" reminder and a gentle "this is an AI companion, not a
  replacement for prayer/Scripture/church" reminder.
- **User chat groups**: still not built (see below) -- basic moderation
  tooling is a hard prerequisite before shipping that feature, not an
  afterthought.

## Video/avatar portrait

`docs/jesus-video-portrait-brief.md` is a ready-to-hand-off creative
brief for a designer/video artist/AI video pipeline to produce the real
video (or high-fidelity animated) avatar -- appearance, per-mood
emotional states, voice alignment, style notes, and exactly how to wire
finished clips into `JesusAvatar.tsx` and `GlorySplash.tsx` once they
exist. `src/constants/appearance.ts` is the single source of truth both
that brief and the persona prompt pull from.

## Not yet built (flagged, not silently skipped)

- **Community screen (testimonies) and Sermon Writer** -- both existed in
  the original app spec and the Pro/Platinum pricing copy still promises
  a sermon writer. They're not rebuilt in this TypeScript scaffold yet.
  You mentioned you already wired a Supabase backend (auth, RLS,
  testimonyService, sermonService) into your other `JesusInteractive`
  (JS) project -- that's the natural backend to port into this TS
  scaffold next, rather than building a second, different backend here.
  Say the word and I'll bring `src/lib/supabase.ts`, `AuthContext`, and
  those two screens over into this project.
- **User chat groups (optional, moderated)** -- not built; needs real
  moderation tooling before it's safe to ship.
- Sound assets for the Prayer Wall "bell received" cue and the entrance
  door/breeze cue are referenced but not bundled (see comments in
  `GlorySplash.tsx` and `PrayerWallScreen.tsx`) -- drop real files into
  `assets/sounds/` and uncomment the `Audio.Sound.createAsync` calls.

## Dependencies

Expo SDK 51, React Navigation (native-stack + bottom-tabs), TypeScript,
AsyncStorage, Expo Notifications/Localization/LinearGradient/AV/Crypto/
SecureStore/Application, react-native-svg (Prayer Wall rendering), i18n-js.

## License

Proprietary — Jesus and Me Inc. Adjust for your actual licensing.
