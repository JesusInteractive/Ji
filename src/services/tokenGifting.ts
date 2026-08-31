// Gift certificate system (spec sections 2 & 7): users can buy a real
// plan for themselves or gift one to someone who can't afford it. Real
// purchase + ledger state MUST live server-side (client state here is
// optimistic UI only, never the source of truth for what's redeemed).

import type { GiftCode, PlanId } from '../types';

export function generateGiftCodeLocally(): string {
  // Client-side preview only, for UI purposes before the real purchase
  // completes. The AUTHORITATIVE code is generated and signed server-
  // side at purchase time, tied to a payment receipt, so it can't be
  // forged or redeemed twice.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export interface RedeemResult {
  success: boolean;
  planId?: PlanId;
  durationMonths?: number;
  error?: string;
}

// Stub: in production this calls POST /gift-codes/redeem on your backend,
// which validates the code against the ledger, marks it redeemed
// atomically (to prevent a race where two devices redeem the same code),
// and returns which plan + duration it grants.
export async function redeemGiftCode(code: string): Promise<RedeemResult> {
  if (!/^([A-Z0-9]{4}-){2}[A-Z0-9]{4}$/.test(code)) {
    return { success: false, error: 'That code doesn\'t look right. Double-check and try again.' };
  }
  // DEMO ONLY -- no real backend call in this offline scaffold.
  return { success: true, planId: 'basic', durationMonths: 1 };
}

export function describeGiftCode(gift: GiftCode): string {
  return gift.redeemedAt
    ? `Redeemed ${new Date(gift.redeemedAt).toLocaleDateString()}`
    : `${gift.durationMonths} month${gift.durationMonths === 1 ? '' : 's'} of ${gift.planId}, not yet redeemed`;
}
