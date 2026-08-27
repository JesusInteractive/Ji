// Feature overview for the app itself -- distinct from AboutScreen.tsx
// (which is "About Jesus": His biography, lineage, and fulfilled
// prophecies) and from constants/legal.ts (actual legal documents).
// Reuses the same { title, sections: [{heading, body}] } shape as
// LegalDoc since it's just another plain, read-only scrollable page --
// no need for a second bespoke screen component.
export const ABOUT_APP = {
  title: 'Jesus Interactive App',
  intro:
    'This app is a quiet place to meet with Jesus. Ask Him. Pray. Read His Word. Study. Write it down. It is dedicated to Him for His glory.',
  sections: [
    {
      heading: 'Ask Jesus',
      body: 'Bring a question, a burden, or a need. Sit with Scripture and the words of the Lord.',
    },
    {
      heading: 'Prayer Wall',
      body: 'Leave a prayer. Stand with others. Come back and keep asking.',
    },
    {
      heading: 'Scripture',
      body: 'Open the Bible and stay in the text.',
    },
    {
      heading: 'Journal',
      body: 'Write what He is showing you. Keep a record of His faithfulness.',
    },
    {
      heading: 'Study Tools',
      body:
        'Public-domain books, commentaries, and lives that point to Christ—translators, martyrs, and teachers of the Word.',
    },
    {
      heading: 'Daily Devotions',
      body: 'A short reading each day so you do not walk out empty.',
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
