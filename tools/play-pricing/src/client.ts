// Thin wrapper around the Android Publisher API v3's
// monetization.subscriptions / monetization.subscriptions.basePlans
// resources. Endpoints, resource field names, and required parameters
// below were verified directly against Google's live API reference
// (developers.google.com/android-publisher/api-ref/rest/v3) before
// writing this file, per the "do not invent Play API fields" ground
// rule -- the one exception is called out explicitly in migratePrices()
// below, where the nested RegionalPriceMigrationConfig object's exact
// sub-fields could not be fully confirmed in the time available; that
// function is written from the verified parent shape plus the most
// standard reading of Play's own docs, but flagged for a final check
// against the live Discovery document
// (https://androidpublisher.googleapis.com/$discovery/rest?version=v3)
// before its first real (non-dry-run) use.

import { google, androidpublisher_v3 } from 'googleapis';
import type { PriceTarget, Subscription } from './types';

const ANDROID_PUBLISHER_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

let cachedClient: androidpublisher_v3.Androidpublisher | null = null;

async function getClient(): Promise<androidpublisher_v3.Androidpublisher> {
  if (cachedClient) return cachedClient;
  // Reads GOOGLE_APPLICATION_CREDENTIALS itself -- no key material
  // touches this file directly.
  const auth = new google.auth.GoogleAuth({ scopes: [ANDROID_PUBLISHER_SCOPE] });
  cachedClient = google.androidpublisher({ version: 'v3', auth });
  return cachedClient;
}

function requirePackageName(): string {
  const packageName = process.env.ANDROID_PACKAGE_NAME;
  if (!packageName) throw new Error('ANDROID_PACKAGE_NAME is not set (see .env.example)');
  return packageName;
}

function requireRegionsVersion(): string {
  const version = process.env.REGIONS_VERSION;
  if (!version) throw new Error('REGIONS_VERSION is not set (see .env.example)');
  return version;
}

// GET one subscription (all its base plans + regional configs).
export async function getSubscription(productId: string): Promise<Subscription> {
  const client = await getClient();
  const packageName = requirePackageName();
  const res = await client.monetization.subscriptions.get({ packageName, productId });
  return res.data as Subscription;
}

// LIST every subscription product in the app -- useful for discovering
// exact productId/basePlanId spellings rather than guessing them.
export async function listSubscriptions(): Promise<Subscription[]> {
  const client = await getClient();
  const packageName = requirePackageName();
  const res = await client.monetization.subscriptions.list({ packageName });
  return (res.data.subscriptions ?? []) as Subscription[];
}

export interface PatchResult {
  dryRun: boolean;
  requestBody: Subscription;
  updateMask: string;
  response?: Subscription;
}

// Updates ONE region's price on ONE base plan. The Play API's PATCH is
// whole-field-mask based (protobuf FieldMask semantics), not
// index-into-array based -- you cannot patch a single element inside
// the repeated `basePlans` field in isolation. So this fetches the
// CURRENT full subscription, merges your one price change into the
// matching base plan's regionalConfigs (preserving every other base
// plan and every other region untouched), then PATCHes back the
// complete `basePlans` array with updateMask=basePlans. Skipping this
// merge step (e.g. sending only the one base plan you care about) would
// silently delete every other base plan and region on the subscription.
export async function patchBasePlanRegionalPrice(
  productId: string,
  basePlanId: string,
  target: PriceTarget,
  { dryRun }: { dryRun: boolean }
): Promise<PatchResult> {
  const current = await getSubscription(productId);
  const basePlans = current.basePlans ?? [];
  const basePlanIndex = basePlans.findIndex((bp) => bp.basePlanId === basePlanId);
  if (basePlanIndex === -1) {
    const available = basePlans.map((bp) => bp.basePlanId).join(', ') || '(none found)';
    throw new Error(`Base plan "${basePlanId}" not found on product "${productId}". Available: ${available}`);
  }

  const basePlan = { ...basePlans[basePlanIndex] };
  const regionalConfigs = [...(basePlan.regionalConfigs ?? [])];
  const regionIndex = regionalConfigs.findIndex((rc) => rc.regionCode === target.regionCode);
  const newConfig = {
    regionCode: target.regionCode,
    newSubscriberAvailability:
      regionIndex === -1 ? true : regionalConfigs[regionIndex].newSubscriberAvailability,
    price: { currencyCode: target.currencyCode, units: target.units, nanos: target.nanos },
  };
  if (regionIndex === -1) {
    regionalConfigs.push(newConfig);
  } else {
    regionalConfigs[regionIndex] = newConfig;
  }
  basePlan.regionalConfigs = regionalConfigs;

  const updatedBasePlans = [...basePlans];
  updatedBasePlans[basePlanIndex] = basePlan;

  const requestBody: Subscription = {
    packageName: current.packageName,
    productId: current.productId,
    basePlans: updatedBasePlans,
  };

  if (dryRun) {
    return { dryRun: true, requestBody, updateMask: 'basePlans' };
  }

  const client = await getClient();
  const packageName = requirePackageName();
  const res = await client.monetization.subscriptions.patch({
    packageName,
    productId,
    updateMask: 'basePlans',
    requestBody: {
      ...requestBody,
      // regionsVersion is required on every write per Google's own docs
      // -- NOT something the API lets you fetch/derive, see
      // .env.example's comment on where the value itself comes from.
      regionsVersion: { version: requireRegionsVersion() },
    } as androidpublisher_v3.Schema$Subscription,
  });

  return { dryRun: false, requestBody, updateMask: 'basePlans', response: res.data as Subscription };
}

export interface MigratePricesResult {
  dryRun: boolean;
  requestBody: unknown;
  response?: unknown;
}

// Moves EXISTING subscribers in the given regions off whatever legacy
// price they're grandfathered into, onto the base plan's current price
// -- this is the one call in this whole tool that can actually change
// what a real, already-paying subscriber is charged and can trigger
// Play's price-increase consent flow (which can cancel subscribers who
// don't accept). Deliberately a separate, explicitly-named function so
// nothing else in this file can trigger it by accident -- see this
// file's own top comment on the one piece of this request body
// (RegionalPriceMigrationConfig's exact sub-fields) that's a best-effort
// reading of Play's docs rather than fully doc-verified; confirm against
// the live Discovery document before running this for real.
export async function migratePrices(
  productId: string,
  basePlanId: string,
  regionCodes: string[],
  { dryRun }: { dryRun: boolean }
): Promise<MigratePricesResult> {
  const requestBody = {
    regionalPriceMigrations: regionCodes.map((regionCode) => ({ regionCode })),
    regionsVersion: { version: requireRegionsVersion() },
  };

  if (dryRun) {
    return { dryRun: true, requestBody };
  }

  const client = await getClient();
  const packageName = requirePackageName();
  const res = await client.monetization.subscriptions.basePlans.migratePrices({
    packageName,
    productId,
    basePlanId,
    requestBody,
  });

  return { dryRun: false, requestBody, response: res.data };
}
