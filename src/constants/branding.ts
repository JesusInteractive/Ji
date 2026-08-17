// App name, subtitle options, and store listing copy. Keep this the
// single source of truth so app.json, the App Store/Play listing, and
// any in-app "About this app" text never drift out of sync.

export const APP_NAME = 'Jesus Interactive';

// Subtitle candidates for the App Store (30-char iOS subtitle limit) and
// Play Store short description (80-char limit) -- pick one per platform,
// or A/B test.
export const SUBTITLE_OPTIONS = [
  'Talk with Jesus',
  'A Place to Meet Him',
];

// Store description. Two short paragraphs, written to read as reverent
// and sophisticated rather than gimmicky, and to be honest about what the
// app is (an AI simulation for reflection) up front -- both because it's
// the right thing to do and because app store review guidelines
// (Apple 4.3, Google's AI-generated content policy) expect AI personas to
// be clearly disclosed.
export const STORE_DESCRIPTION = [
  'Jesus Interactive is a quiet place to bring your questions, your gratitude, and your heaviest days -- and talk them through in the voice of Jesus, grounded in Scripture. Ask about faith, doubt, suffering, relationships, or anything on your mind, place a prayer on a Prayer Wall modeled after the Western Wall in Jerusalem, read the Bible, or simply sit with the daily verse. It is built to be reverent and warm, never gimmicky.',
  'This is an AI companion, not a replacement for your own prayer life, Scripture reading, or church community -- it says so, gently, along the way. Free to start, with optional plans for deeper conversation history and priority access, plus a token system so you can gift access to someone who can\'t afford it. Jesus Interactive is made by Jesus & Me, Inc.',
].join('\n\n');

export const STORE_DESCRIPTION_SHORT =
  'Talk through anything with an AI companion in the voice of Jesus, grounded in Scripture. Prayer Wall, Bible, daily verse, and more.';
