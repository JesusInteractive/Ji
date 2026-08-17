import type { Plan, TokenPack } from '../types';

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    dailyQuestionLimit: 5,
    features: ['5 questions a day', 'Daily verse'],
  },
  {
    id: 'basic',
    name: 'Basic',
    priceLabel: '$4.99/month',
    dailyQuestionLimit: 50,
    features: ['50 questions a day', 'Saved conversation history'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$9.99/month',
    dailyQuestionLimit: 300,
    features: [
      '300 questions a day',
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
  free: 'Free gets you 5 questions a day and the daily verse, forever -- no trial, no credit card.',
  paid: 'Paid plans (Basic/Pro/Platinum) raise or remove the daily question limit, add saved conversation history across devices, priority responses, and (Pro & up) the sermon writer for pastors.',
  tokens:
    'Don\'t want a subscription? Buy a token pack instead -- each token unlocks one extra question beyond your daily limit, no expiration.',
  gifting:
    'Gifting: buy a token pack and generate a one-time redeemable code (Settings or Buy & Gift) for someone who can\'t afford a plan themselves. They enter the code and get the tokens on their account -- no payment info needed on their end.',
};

// One-time purchases for people who don't want a subscription, and the
// mechanism by which a subscriber can gift access to someone who can't
// afford a plan (spec section 2 & 7: "token/gift code system").
export const TOKEN_PACKS: TokenPack[] = [
  { id: 'pack_20', tokens: 20, priceLabel: '$2.99', description: '20 questions, no expiration' },
  { id: 'pack_60', tokens: 60, priceLabel: '$6.99', description: '60 questions, no expiration' },
  { id: 'pack_150', tokens: 150, priceLabel: '$14.99', description: '150 questions, no expiration' },
];

// A token or a gift code redemption is spent 1-for-1 against a single
// question when the recipient is on the Free plan (or has no active
// subscription). See src/services/tokenGifting.ts for the redemption flow;
// actual balance/ledger enforcement must happen server-side.
