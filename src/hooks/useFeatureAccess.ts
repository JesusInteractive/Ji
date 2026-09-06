// The one thing every paywall-gated screen actually checks (see
// PaywallLockScreen.tsx for the shared lock UI, and each gated screen's
// own one-line adoption: `const { hasAccess } = useFeatureAccess(); if
// (!hasAccess) return <PaywallLockScreen ... />;`, placed after ALL of
// that screen's own hooks -- rules-of-hooks means the gate can only be
// an early RETURN, never a conditional hook call).
//
// AppContext.tsx's hasFullAccess (plan is a real paid tier, or still
// within the 5-day trial) is the fast, synchronous source used on every
// render. This hook adds one thing on top: if the device looks
// free/trial-expired locally, it does a single RevenueCat reconciliation
// check (checkProEntitlement()) to catch a subscription that was
// restored/reconnected on another device -- kept out of AppContext
// itself so AppContext doesn't need to know RevenueCat exists at all,
// matching purchases.ts's existing zero-dependency-on-AppContext shape.
import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { checkProEntitlement } from '../services/purchases';

export interface FeatureAccess {
  hasAccess: boolean;
  loading: boolean;
  daysLeftInTrial: number;
}

export function useFeatureAccess(): FeatureAccess {
  const { hasFullAccess, isInTrial, daysSinceFirstOpen, plan } = useApp();
  const [reconciledSubscriber, setReconciledSubscriber] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasFullAccess) return; // already known-good locally, no need to ask RevenueCat
    let cancelled = false;
    setLoading(true);
    checkProEntitlement()
      .then((isSubscriber) => {
        if (!cancelled) setReconciledSubscriber(isSubscriber);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Re-check whenever the locally-known state changes plan/trial status --
    // e.g. right after the trial flips to expired.
  }, [hasFullAccess, plan, isInTrial]);

  return {
    hasAccess: hasFullAccess || reconciledSubscriber,
    loading,
    daysLeftInTrial: Math.max(5 - daysSinceFirstOpen, 0),
  };
}
