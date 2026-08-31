// RevenueCat integration -- wires PLANS/GIFT_CERTIFICATES
// (constants/pricing.ts) to real Apple/Google subscription & IAP billing
// via RevenueCat, which sits in front of StoreKit and Play Billing so
// this file doesn't need two separate native integrations.
//
// STATUS: PricingScreen.tsx and TokenGiftScreen.tsx already call into
// this file (purchasePlan/purchaseGiftCertificate/presentProPaywall).
// Pricing was restructured to three monthly-only tiers (Basic/Pro/
// Platinum -- Platinum's old yearly/lifetime durations are gone) plus
// gift certificates (1/3/12-month Basic codes) replacing the old
// per-question token packs. App Store Connect, Play Console, and
// RevenueCat (Products + the "default" Offering's packages, one per
// plan/cert, each holding both platforms' products) are all set up to
// match the ids below, and both EXPO_PUBLIC_REVENUECAT_IOS_KEY/
// _ANDROID_KEY in .env are real production public SDK keys.
//
// STILL NEEDED:
//   - `eas build` a real dev client (not `expo start`/Expo Go, and not
//     the iOS Simulator -- see isExpoGo below, and StoreKit purchases
//     don't work in Simulator either) to actually test a purchase, using
//     a sandbox tester Apple ID. Real purchases cost real money.
//
// WHY isExpoGo EXISTS: react-native-purchases is a native module --
// Expo Go has no way to include third-party native code, the same
// limitation that made expo-av crash this app at import time earlier
// ("Cannot find native module 'ExponentAV'"). initPurchases() below
// detects Expo Go via expo-constants and no-ops instead of calling into
// the native SDK, so this file stays safe to import from screens that
// still get exercised in Expo Go day-to-day.
//
// PAYWALL/CUSTOMER CENTER: react-native-purchases-ui gives you
// RevenueCat's prebuilt, dashboard-configurable paywall and customer
// center screens instead of hand-rolling purchase buttons -- see
// presentProPaywall()/presentCustomerCenter() below. Both no-op the
// same way as everything else here when running in Expo Go.

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { PlanId } from '../types';

const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

// Gates the Platinum tier's single monthly product in RevenueCat's
// dashboard config -- kept as a single named export so
// checkProEntitlement()/presentProPaywall() and the RevenueCat dashboard
// config always agree on the exact string. Used by SermonWriterScreen.tsx
// to gate the sermon writer feature; ChatScreen's daily-quota paywall
// routes to the in-app Pricing screen instead (see RootNavigator.tsx),
// since that can correctly purchase whichever tier the user actually
// picks rather than guessing from a single entitlement.
export const PRO_ENTITLEMENT_ID = 'Jesus Interactive Pro';

// Expo Go can't load native modules at all -- see this file's top
// comment. `executionEnvironment === 'storeClient'` is the modern
// (SDK 51+) way to detect it; falls back to treating unknown/undefined
// environments as "not Expo Go" so a real build never accidentally
// short-circuits.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Maps this app's plan/pack ids to the real product identifiers created
// in App Store Connect / Play Console / RevenueCat. iOS and Android use
// completely different naming schemes for the same plan (App Store
// Connect enforces a reverse-DNS style; Play Console products created
// here ended up short snake_case, sometimes as "product:basePlan" pairs),
// so this has to be platform-aware -- a single shared id list (the old
// version of this file) can only ever match one platform's store.
const REVENUECAT_PRODUCT_IDS_IOS: Record<PlanId, string | null> = {
  free: null, // no product -- free tier has nothing to purchase
  basic: 'com.jesusinteractive.app.basic.monthly',
  pro: 'com.jesusinteractive.app.pro.monthly',
  platinum: 'com.jesusinteractive.app.platinum.monthly',
};

const REVENUECAT_PRODUCT_IDS_ANDROID: Record<PlanId, string | null> = {
  free: null,
  basic: 'basic_monthly:monthly',
  pro: 'monthly:pro-monthly', // confirmed live in Play Console -- "monthly:pro" is a stale/unused base plan
  platinum: 'platinum_monthly:platinum',
};

export const REVENUECAT_PRODUCT_IDS: Record<PlanId, string | null> =
  Platform.OS === 'ios' ? REVENUECAT_PRODUCT_IDS_IOS : REVENUECAT_PRODUCT_IDS_ANDROID;

const REVENUECAT_GIFT_CERTIFICATE_IDS_IOS: Record<string, string> = {
  gift_basic_1mo: 'com.jesusinteractive.app.gift.basic.1month',
  gift_basic_3mo: 'com.jesusinteractive.app.gift.basic.3month',
  gift_basic_12mo: 'com.jesusinteractive.app.gift.basic.12month',
};

const REVENUECAT_GIFT_CERTIFICATE_IDS_ANDROID: Record<string, string> = {
  gift_basic_1mo: 'gift_basic_1mo',
  gift_basic_3mo: 'gift_basic_3mo',
  gift_basic_12mo: 'gift_basic_12mo',
};

export const REVENUECAT_GIFT_CERTIFICATE_IDS: Record<string, string> =
  Platform.OS === 'ios' ? REVENUECAT_GIFT_CERTIFICATE_IDS_IOS : REVENUECAT_GIFT_CERTIFICATE_IDS_ANDROID;

let initialized = false;

// Call once, early in the app (e.g. RootNavigator's top-level effect),
// once you're ready to actually test purchases in a real build. Safe to
// call in Expo Go -- it just no-ops there.
export async function initPurchases(appUserId?: string): Promise<void> {
  if (isExpoGo || initialized) return;
  try {
    const { default: Purchases, LOG_LEVEL } = await import('react-native-purchases');
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
    if (!apiKey) {
      console.warn('RevenueCat: no API key configured (EXPO_PUBLIC_REVENUECAT_IOS_KEY / _ANDROID_KEY)');
      return;
    }
    // Verbose while these are still test_ keys (see .env's own comment)
    // -- turn down to WARN once real keys/products are confirmed working.
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    await Purchases.configure({ apiKey, appUserID: appUserId });
    initialized = true;
  } catch (e) {
    // Missing native module (e.g. still Expo Go despite the check
    // above, or a build that didn't include this package) should never
    // crash the app -- purchases just won't be available.
    console.error('RevenueCat init failed:', e);
  }
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
  userCancelled?: boolean;
}

// Purchases a plan's subscription product. Caller is responsible for
// calling selectPlan() (AppContext) once this resolves successfully --
// kept separate so this file has no dependency on app state/context.
export async function purchasePlan(planId: PlanId): Promise<PurchaseResult> {
  if (isExpoGo) {
    return { success: false, error: 'Purchases require a real build (EAS dev client), not Expo Go.' };
  }
  const productId = REVENUECAT_PRODUCT_IDS[planId];
  if (!productId) {
    return { success: false, error: `No product configured for plan "${planId}".` };
  }
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find((p) => p.product.identifier === productId);
    if (!pkg) {
      return { success: false, error: 'That plan isn\'t available for purchase right now.' };
    }
    await Purchases.purchasePackage(pkg);
    return { success: true };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, userCancelled: true };
    console.error('Purchase failed:', e);
    return { success: false, error: e?.message ?? 'Purchase failed. Please try again.' };
  }
}

export async function purchaseGiftCertificate(certId: string): Promise<PurchaseResult> {
  if (isExpoGo) {
    return { success: false, error: 'Purchases require a real build (EAS dev client), not Expo Go.' };
  }
  const productId = REVENUECAT_GIFT_CERTIFICATE_IDS[certId];
  if (!productId) {
    return { success: false, error: `No product configured for gift certificate "${certId}".` };
  }
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find((p) => p.product.identifier === productId);
    if (!pkg) {
      return { success: false, error: 'That gift certificate isn\'t available for purchase right now.' };
    }
    await Purchases.purchasePackage(pkg);
    return { success: true };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, userCancelled: true };
    console.error('Purchase failed:', e);
    return { success: false, error: e?.message ?? 'Purchase failed. Please try again.' };
  }
}

// Reinstates a previous purchase on a new device/reinstall -- required
// by both Apple's and Google's store guidelines for any app with
// subscriptions.
export async function restorePurchases(): Promise<PurchaseResult> {
  if (isExpoGo) {
    return { success: false, error: 'Purchases require a real build (EAS dev client), not Expo Go.' };
  }
  try {
    const Purchases = (await import('react-native-purchases')).default;
    await Purchases.restorePurchases();
    return { success: true };
  } catch (e: any) {
    console.error('Restore failed:', e);
    return { success: false, error: e?.message ?? 'Restore failed. Please try again.' };
  }
}

// Raw customer info, if you need more than the boolean entitlement
// check below (e.g. expiration date, whether it's a trial, which store
// it was purchased through).
export async function getCustomerInfo() {
  if (isExpoGo) return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    return await Purchases.getCustomerInfo();
  } catch (e) {
    console.error('getCustomerInfo failed:', e);
    return null;
  }
}

// The actual gate to check before unlocking anything Platinum/Pro --
// true regardless of which of the three durations (monthly/yearly/
// lifetime) the user bought, since all three grant PRO_ENTITLEMENT_ID.
// Also true if the founder code (services/founderAccess.ts) was used to
// set plan='platinum' locally -- that path never touches RevenueCat at
// all, so call sites that care about "is this a REAL paying customer"
// vs. "is this comped" need to check AppContext's plan state too, not
// just this.
export async function checkProEntitlement(): Promise<boolean> {
  const info = await getCustomerInfo();
  if (!info) return false;
  return info.entitlements.active[PRO_ENTITLEMENT_ID] != null;
}

export type PaywallOutcome = 'purchased' | 'restored' | 'cancelled' | 'error' | 'not_presented';

// Presents RevenueCat's prebuilt paywall (configured visually in the
// RevenueCat dashboard, not in this codebase) for the Pro entitlement.
// presentPaywallIfNeeded skips showing anything if the user already has
// the entitlement -- the right choice for "gate this screen" use cases;
// swap to Purchases.presentPaywall() (unconditional) if you want an
// explicit "Upgrade" button to always show it.
export async function presentProPaywall(): Promise<PaywallOutcome> {
  if (isExpoGo) return 'not_presented';
  try {
    const { default: RevenueCatUI, PAYWALL_RESULT } = await import('react-native-purchases-ui');
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
    });
    switch (result) {
      case PAYWALL_RESULT.PURCHASED:
        return 'purchased';
      case PAYWALL_RESULT.RESTORED:
        return 'restored';
      case PAYWALL_RESULT.CANCELLED:
        return 'cancelled';
      case PAYWALL_RESULT.NOT_PRESENTED:
        return 'not_presented';
      default:
        return 'error';
    }
  } catch (e) {
    console.error('Paywall presentation failed:', e);
    return 'error';
  }
}

// RevenueCat's prebuilt subscription-management UI (cancel, change
// plan, request refund, contact support) -- also dashboard-configured.
// Good fit for Settings > Manage plan once this is wired into a real
// build, so you don't have to hand-build cancellation/refund flows
// yourself. Returns whether it actually presented -- callers need this
// to know whether to show their own Expo Go / not-configured fallback,
// rather than risk showing a fallback message right after a real
// Customer Center session closes.
export async function presentCustomerCenter(): Promise<boolean> {
  if (isExpoGo) return false;
  try {
    const RevenueCatUI = (await import('react-native-purchases-ui')).default;
    await RevenueCatUI.presentCustomerCenter();
    return true;
  } catch (e) {
    console.error('Customer Center presentation failed:', e);
    return false;
  }
}
