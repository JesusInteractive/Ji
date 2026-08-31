import type { GiftCertificate, Plan } from '../types';

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Introductory Offer',
    priceLabel: '$0',
    dailyQuestionLimit: 5,
    resetsDaily: false,
    features: ['5 questions, one time', 'Then choose a plan to keep going'],
  },
  {
    id: 'basic',
    name: 'Basic',
    priceLabel: '$5.99/month',
    dailyQuestionLimit: 20,
    resetsDaily: true,
    features: ['20 questions a day', 'Saved conversation history'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$9.99/month',
    dailyQuestionLimit: 50,
    resetsDaily: true,
    features: [
      '50 questions a day',
      'Priority responses',
      'Saved conversations across devices',
      'Bonus: sermon writer for pastors',
    ],
    badge: 'Most popular',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    priceLabel: '$19.99/month',
    dailyQuestionLimit: null,
    resetsDaily: true,
    features: [
      'Everything in Pro',
      'Unlimited questions',
      'Highest priority responses',
      'Maximum conversation memory',
      'Advanced sermon writer (longer, more detailed sermons)',
      'Exclusive features and early access',
      'Priority support',
    ],
    badge: 'Full access',
  },
];

// Plain-language explainer of the whole monetization model, surfaced in
// PricingScreen and TokenGiftScreen so the mechanics are never a mystery.
export const MONETIZATION_EXPLAINER = {
  free: 'Start with 5 free questions, one time -- no trial, no credit card. Once they\'re used, choose a plan to keep talking with Jesus.',
  paid: 'Basic, Pro, and Platinum are monthly subscriptions that raise or remove the daily question limit, add saved conversation history across devices, priority responses, and (Pro & up) the sermon writer for pastors.',
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
