import type { GiftCertificate, Plan } from '../types';

export const PLANS: Plan[] = [
  // Not a selectable card -- PricingScreen filters this one out of the
  // picker entirely (see its own comment) since it doesn't represent a
  // real choice anymore. It only exists so "current plan" displays
  // (ProfileScreen/SettingsScreen's PLANS.find(...) ?? PLANS[0]) have
  // something sensible to show for a device that hasn't subscribed:
  // everyone gets 5 days of full access from first open (see
  // AppContext.tsx's trialStartedAt/isInTrial), then must pick a paid
  // plan below -- there's no "stay on free forever" tier anymore.
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    dailyQuestionLimit: null,
    resetsDaily: false,
    features: ['Full access during your 5-day trial'],
  },
  // Basic/Pro/Platinum unlock the identical feature set today -- there is
  // no tier-specific enforcement anywhere in the code (useFeatureAccess()
  // is one binary hasFullAccess flag, not tier-aware; dailyQuestionLimit/
  // resetsDaily below are unread by anything). Earlier copy claimed
  // per-tier question caps and a Pro+-only Sermon Writer that were never
  // real, so all three now say the same thing rather than promise a
  // difference that doesn't exist. Pro/Platinum are priced higher as a
  // way to support Jesus Interactive further, not for extra locked
  // features -- if real tier differentiation gets built later, this is
  // the place to describe it honestly.
  {
    id: 'basic',
    name: 'Basic',
    priceLabel: '$5.99/month',
    dailyQuestionLimit: null,
    resetsDaily: false,
    features: [
      'Unlimited Ask Jesus',
      'Gospel Translator',
      'Sermon & Bible Study Generator',
      'Guided Prayer, Daily Devotions, and Multi-Language Bible Tools',
      'AI Jesus reads select Study Library titles aloud',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$9.99/month',
    dailyQuestionLimit: null,
    resetsDaily: false,
    features: ['Everything in Basic', 'Supports Jesus Interactive at a higher level'],
    badge: 'Most popular',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    priceLabel: '$19.99/month',
    dailyQuestionLimit: null,
    resetsDaily: false,
    features: ['Everything in Basic', 'Supports Jesus Interactive at the highest level'],
    badge: 'Full access',
  },
];

// Plain-language explainer of the whole monetization model, surfaced in
// PricingScreen and TokenGiftScreen so the mechanics are never a mystery.
export const MONETIZATION_EXPLAINER = {
  free: 'Every install gets 5 days of full access, free, no credit card needed. After that, choose a plan to keep going. The Emergency SOS button (Profile) is always free on every plan, including after the trial ends -- it is never paywalled or limited.',
  paid: 'Basic, Pro, and Platinum are monthly subscriptions that all unlock the same full access: unlimited Ask Jesus, the Gospel Translator, the Sermon & Bible Study Generator, Guided Prayer, Daily Devotions, and Multi-Language Bible Tools. Pro and Platinum cost more as a way to support Jesus Interactive further, not for extra features.',
  tokens:
    'Don\'t want an ongoing subscription? Buy a gift certificate instead -- it activates a real plan on your account for a fixed number of months, no auto-renewal.',
  gifting:
    'Gifting: buy a gift certificate and generate a one-time redeemable code (Settings or Buy & Gift) for someone who can\'t afford a plan themselves. They enter the code and get the plan active on their account -- no payment info needed on their end.',
};

// One-time purchases for people who don't want a subscription, and the
// mechanism by which a subscriber can gift access to someone who can't
// afford a plan (spec section 2 & 7: "token/gift code system") --
// redeeming one activates Basic for the chosen duration rather than
// adding a token balance. Gift certificates only come in Basic (the
// accessible entry tier, matching the App Store Connect products
// actually created) -- the giver picks a duration, not a tier. Priced
// so longer durations save a little per month.
export const GIFT_CERTIFICATES: GiftCertificate[] = [
  { id: 'gift_basic_1mo', planId: 'basic', durationMonths: 1, priceLabel: '$5.99', description: '1 month of Basic' },
  { id: 'gift_basic_3mo', planId: 'basic', durationMonths: 3, priceLabel: '$14.99', description: '3 months of Basic' },
  { id: 'gift_basic_12mo', planId: 'basic', durationMonths: 12, priceLabel: '$59.99', description: '12 months of Basic' },
];

// A gift code redemption grants the recipient the code's plan for its
// duration when the recipient has no active subscription of their own.
// See src/services/tokenGifting.ts for the redemption flow; actual
// balance/ledger enforcement (including expiring the plan when the
// duration ends) must happen server-side.
