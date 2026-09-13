// Feature overview for the app itself -- distinct from AboutScreen.tsx
// (which is "About Jesus": His biography, lineage, and fulfilled
// prophecies) and from constants/legal.ts (actual legal documents).
// Reuses the same { title, sections: [{heading, body}] } shape as
// LegalDoc since it's just another plain, read-only scrollable page --
// no need for a second bespoke screen component.
//
// intro/sections copy is adapted from the App Store Connect description
// text -- "Ask Jesus" is kept as the feature name throughout (not the
// App Store copy's "Jesus Chat") since that's this screen's own actual
// in-app label (tab bar, Home tile); using a different name here would
// contradict what the reader is looking at. The App Store text's
// "WHAT'S INCLUDED IN 2.0" / "What's New" release-note framing and its
// subscription-conditional paragraph are deliberately left out -- those
// are App Store Connect fields, not evergreen in-app content. Guided
// Prayer and Testimony Stream are kept even though the store copy
// doesn't mention them (this page is the complete reference, not the
// trimmed marketing version). The `sections` list is the actual current
// feature set -- kept in sync by hand whenever a screen is added/renamed
// (checked against src/screens/*.tsx directly rather than assumed).
export const ABOUT_APP = {
  title: 'Jesus Interactive App',
  intro:
    'Jesus Interactive is your companion in the Word -- Ask Jesus, an interactive biblical atlas, Bible games, sermons, prayer, study, and worship in one app.\n\n' +
    'Read Bibles by language. Open Christian books and testimonies. Generate a full sermon or Bible study on any topic or passage. Ask Jesus questions, translate the gospel for someone in their own language, keep a Journal, post on the Prayer Wall, and start the day with Daily Devotions and a daily promise.\n\n' +
    'Scripture, sermons, the Games Hub, Prayer Wall, and The Passion Relics are free to everyone. Jesus Interactive Plus unlocks unlimited Ask Jesus, the full Journeys Through the Bible atlas, and the Gospel Translator. Dedicated to Jesus for His glory.',
  sectionsHeading: 'App Features',
  sections: [
    {
      heading: 'Ask Jesus',
      body: 'A Scripture-rooted companion for your questions, burdens, and needs -- not a substitute for the Bible, prayer, or your local church. Always test what you read against Scripture.',
    },
    {
      heading: 'Journeys Through the Bible',
      body: 'An interactive biblical atlas -- real satellite map, biblical sites, prophets, and journeys through the Holy Land, each with scripture and sourced background.',
    },
    {
      heading: 'The Passion Relics',
      body: 'The Shroud of Turin, crown of thorns, and other traditional relics of the crucifixion -- scripture, tradition, and an honest science file, clearly labeled as to which is which.',
    },
    {
      heading: 'Gospel Translator',
      body: 'Live, two-way speech translation for sharing the gospel with someone in their own language.',
    },
    {
      heading: 'Jesus Interactive Games Hub',
      body: 'Ten free Bible word and trivia games -- crossword, word search, trivia, memory match, and more -- generated from Scripture, no ads or paywall.',
    },
    {
      heading: 'Guided Prayer',
      body: 'A slower, structured way to pray through a moment with Jesus, reached from the chat.',
    },
    {
      heading: 'Prayer Wall',
      body: 'Leave a prayer at the wall. Stand with others. Come back and keep asking.',
    },
    {
      heading: 'Testimony Stream',
      body: 'A live, public feed of what God has done -- always shared, no privacy toggle. React with a tap.',
    },
    {
      heading: 'Scripture',
      body: 'Open the Bible and stay in the text.',
    },
    {
      heading: 'Journal',
      body: 'Write what He is showing you. Keep a private record of His faithfulness.',
    },
    {
      heading: 'Study Tools Library (243 Books)',
      body:
        'Public-domain books, commentaries, and lives that point to Christ -- translators, martyrs, and teachers of the Word.',
    },
    {
      heading: 'Multi-Language Bible Tools (117 Languages)',
      body: 'Choose a Bible in your language. Explore Christian books and testimonies. Built for a global church.',
    },
    {
      heading: 'Sermon & Bible Study Writer',
      body: 'Enter a topic or passage and generate a full sermon or Bible study. For pastors, teachers, and students of the Word -- edit it, pray over it, and make it your own.',
    },
    {
      heading: 'Daily Devotions & Daily Promise',
      body: 'A short reading and a promise from Scripture each day so you do not walk out empty.',
    },
    {
      heading: 'Audio Jesus',
      body: 'Subscribers can hear AI Jesus read select Study Tools titles aloud, in their language.',
    },
    {
      heading: '24/7 Praise and Worship',
      body: 'Worship radio from licensed Christian radio stations. Launching soon -- not live yet.',
    },
    {
      heading: 'Watching on a Bigger Screen',
      body:
        "iPhone/iPad: open Control Center, tap Screen Mirroring, and choose your TV or Apple TV (to mirror to a Mac, turn on AirPlay Receiver in System Settings > General > AirDrop & Handoff). Android: open Quick Settings, tap Cast (or Smart View on Samsung), and choose your TV or Chromecast. No AirPlay/Cast on the TV, or want a Windows PC instead? An HDMI cable with the right adapter always works.",
    },
  ],
  closing:
    'This is not a church, a pastor, or a substitute for the gathered people of God. It is a companion for the hours in between—so you can hear Him, answer Him, and go in peace.',
};

// The small tile on the Welcome (Home) screen -- kept separate from the
// full page's title/intro above since the card needs its own much
// shorter title + one-line teaser.
export const ABOUT_APP_CARD = {
  title: 'About This App',
  subtitle: 'A quiet place to meet with Jesus.',
};
