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
    'Jesus Interactive is a premium Global AI Bible Companion -- Multi-Language Bible Tools in 117 languages, a Sermon & Bible Study Writer, Ask Jesus, prayer, study, and worship in one app.\n\n' +
    'Read Bibles by language. Open Christian books and testimonies. Generate a full sermon or Bible study on any topic or passage. Ask Jesus questions, keep a Journal, post on the Prayer Wall, and start the day with Daily Devotions and a daily promise.\n\n' +
    'Built for people who want the full toolkit in one place: Scripture, study, sermon prep, prayer, and worship. No clutter. Dedicated to Jesus for His glory.',
  sectionsHeading: 'App Features',
  sections: [
    {
      heading: 'Ask Jesus',
      body: 'A Scripture-rooted companion for your questions, burdens, and needs -- not a substitute for the Bible, prayer, or your local church. Always test what you read against Scripture.',
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
      heading: 'Bible Word Search',
      body: 'Find hidden biblical names, places, and words in a letter grid.',
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
      body: 'Platinum members can hear AI Jesus read select Study Tools titles aloud, in their language.',
    },
    {
      heading: '24/7 Praise and Worship',
      body: 'Worship radio from licensed Christian radio stations -- tap a station to listen. Availability outside the United States isn\'t guaranteed yet.',
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
