// Canonical English strings. Every other locale file must implement this
// exact key shape -- see src/i18n/index.ts for the type this derives.
const en = {
  common: {
    continue: 'Continue',
    back: 'Back',
    accept: 'I Accept',
    decline: 'Decline',
    cancel: 'Cancel',
    save: 'Save',
    retry: 'Retry',
    loading: 'Loading…',
    send: 'Send',
    close: 'Close',
  },
  language: {
    title: 'Choose your language',
    subtitle: 'You can change this anytime in Settings.',
  },
  disclaimer: {
    title: 'Before you begin',
    body:
      'Jesus Interactive uses artificial intelligence to simulate a conversation ' +
      'in the voice of Jesus Christ, grounded in Scripture. It is a tool for ' +
      'personal reflection and spiritual encouragement -- it is not Jesus ' +
      'Himself, not a licensed counselor, not a medical or legal professional, ' +
      'and not a replacement for prayer, Scripture, church community, pastoral ' +
      'care, or professional mental health support. In a crisis, please contact ' +
      'a local emergency number or crisis line right away.',
    checkbox: 'I understand this is an AI simulation and not Jesus Himself.',
  },
  agreement: {
    title: 'User Agreement & Indemnity',
    checkbox: 'I have read and agree to the User Agreement, Privacy Policy, and Indemnity terms.',
  },
  entrance: {
    verseReference: 'Matthew 7:7',
    verseText: 'Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.',
    cta: 'Enter',
  },
  pricing: {
    title: 'Choose your plan',
    subtitle: 'You can change or cancel anytime.',
    tokenTitle: 'Or gift access',
    tokenSubtitle: 'Buy tokens for yourself or gift them to someone who can’t afford a plan.',
  },
  home: {
    title: 'Welcome',
    subtitle: 'Where would you like to go?',
  },
  tabs: {
    home: 'Home',
    chat: 'Ask Jesus',
    prayerWall: 'Prayer Wall',
    bible: 'Scripture',
    journal: 'Journal',
    about: 'About',
    settings: 'Settings',
    studyTools: 'Study Tools',
    profile: 'Profile',
  },
  chat: {
    inputPlaceholder: 'Ask a question or prayer',
    limitReached: 'You’ve reached today’s question limit. Come back tomorrow, or upgrade your plan.',
    whatDoYouThink: 'What do you think?',
  },
  prayerWall: {
    title: 'The Wall',
    subtitle: 'Place a prayer between the stones.',
    inputPlaceholder: 'Write your prayer…',
    anonymous: 'Post anonymously',
    shared: 'Share on the public wall',
    placed: 'Your prayer has been placed.',
  },
  about: {
    title: 'About Jesus',
    biography: 'Biography',
    lineage: 'Lineage (Book of Matthew)',
    prophecies: 'Fulfilled Prophecies',
  },
  settings: {
    account: 'Account',
    plan: 'Current plan',
    tokens: 'Token balance',
    giftTokens: 'Gift tokens to someone',
    preferences: 'Preferences',
    notifications: 'Push notifications for daily verse',
    dailyVerse: 'Daily verse reminder',
    ageAppropriate: 'Age-appropriate content mode',
    offlineMode: 'Offline mode (cached content only)',
    language: 'Language',
    privacyData: 'Privacy & data',
    downloadData: 'Download my data',
    deleteAccount: 'Delete my account and all data',
    support: 'Community & support',
    reportContent: 'Report inappropriate content',
    contactSupport: 'Contact support',
    about: 'About',
    version: 'App version',
    privacyPolicy: 'Privacy policy',
    terms: 'Terms of service',
    disclosureLink: 'AI disclosure',
  },
};

export default en;
export type TranslationShape = typeof en;
