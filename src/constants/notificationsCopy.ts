// Example daily verse / reflection push notifications. Written to feel
// gentle and encouraging rather than a demanding "you have 1 new
// message" style ping -- these are invitations, not urgency hooks.
// Wire into notifications.ts; a real backend can pick a different one
// (or generate fresh copy) every day, since the client can't reliably
// vary scheduled-notification content day to day on its own.

export interface VerseNotification {
  title: string;
  body: string;
}

export const DAILY_VERSE_NOTIFICATIONS: VerseNotification[] = [
  {
    title: 'Your verse for today',
    body: '"Ask, and it shall be given you; seek, and ye shall find" (Matthew 7:7). Whenever you\'re ready.',
  },
  {
    title: 'A moment, whenever you have one',
    body: '"Be still, and know that I am God" (Psalm 46:10). No rush -- I\'ll be here.',
  },
  {
    title: 'Good morning',
    body: '"This is the day which the Lord hath made; we will rejoice and be glad in it" (Psalm 118:24).',
  },
  {
    title: 'Just checking in',
    body: '"Cast all your anxiety on him because he cares for you" (1 Peter 5:7). However today is going, that still stands.',
  },
  {
    title: 'A verse to carry with you',
    body: '"I can do all things through Christ which strengtheneth me" (Philippians 4:13).',
  },
  {
    title: 'Today\'s reflection',
    body: '"The Lord is near to the brokenhearted" (Psalm 34:18) -- close, whether today is heavy or light.',
  },
  {
    title: 'Whenever you\'re ready',
    body: '"Come unto me, all ye that labour and are heavy laden, and I will give you rest" (Matthew 11:28).',
  },
];

export function pickDailyVerseNotification(seed?: number): VerseNotification {
  const i = seed != null ? Math.abs(seed) % DAILY_VERSE_NOTIFICATIONS.length : Math.floor(Math.random() * DAILY_VERSE_NOTIFICATIONS.length);
  return DAILY_VERSE_NOTIFICATIONS[i];
}
