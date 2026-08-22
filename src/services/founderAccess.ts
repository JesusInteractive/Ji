// A single unlock code, just for you (the founder), to get free
// Platinum access without going through the (currently unwired) real
// payment flow. Checked client-side in TokenGiftScreen's redeem box,
// ahead of the regular token gift-code path -- entering it calls
// selectPlan('platinum') directly instead of adding tokens.
//
// SECURITY: EXPO_PUBLIC_ values are inlined into the client bundle in
// plain text, so this is NOT a real secret; anyone who decompiles the app
// can read it. That's an acceptable trade-off only because there's no real
// billing wired up yet (selecting Platinum from Pricing is already free
// for everyone right now -- see constants/pricing.ts). Once you wire a
// real payment processor (RevenueCat/StoreKit/Play Billing) to
// PricingScreen, revisit this: move the check server-side (e.g. the
// backend validates the code and returns a signed entitlement) so it
// can't be lifted out of the bundle and shared.
//
// Change EXPO_PUBLIC_FOUNDER_CODE in .env to whatever you want; this
// fallback only applies if that's unset.
export const FOUNDER_UNLOCK_CODE = (process.env.EXPO_PUBLIC_FOUNDER_CODE ?? 'JESUSFOUNDER').toUpperCase();

export function isFounderCode(code: string): boolean {
  return code.trim().toUpperCase() === FOUNDER_UNLOCK_CODE;
}

// Same trade-off as FOUNDER_UNLOCK_CODE above -- a second shared code so
// family members can get free Platinum access without handing out the
// founder code itself. Change EXPO_PUBLIC_FAMILY_CODE in .env to whatever
// you want; this fallback only applies if that's unset.
export const FAMILY_UNLOCK_CODE = (process.env.EXPO_PUBLIC_FAMILY_CODE ?? 'JESUSFAMILY').toUpperCase();

export function isFamilyCode(code: string): boolean {
  return code.trim().toUpperCase() === FAMILY_UNLOCK_CODE;
}
