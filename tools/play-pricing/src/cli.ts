#!/usr/bin/env node
import 'dotenv/config';
import { parseArgs } from 'node:util';
import { getSubscription, listSubscriptions, migratePrices, patchBasePlanRegionalPrice } from './client';
import type { PriceTarget } from './types';

// --- Input validation -------------------------------------------------
// Google's CURRENT docs say productId/basePlanId must be lowercase
// letters, numbers, underscores, and dots -- but this app's actual,
// already-created product IDs in Play Console (e.g. "Platinum",
// "Pro_monthly") have capitals, meaning that rule either tightened after
// these were created or Play Console's list shows a different field than
// the strict API-facing productId. Rather than block real, existing IDs
// on a documented-but-seemingly-not-actually-enforced rule, this allows
// mixed case and only rejects genuinely malformed input (empty, too
// long, or containing characters no product ID could plausibly have).
// Region codes are still strictly ISO 3166-1 alpha-2 (2 letters) --
// that rule has no evidence of being loosely enforced.
const ID_PATTERN = /^[A-Za-z0-9_.]{1,40}$/;
const REGION_PATTERN = /^[A-Za-z]{2}$/;

function validateId(value: string | undefined, label: string): string {
  if (!value || !ID_PATTERN.test(value)) {
    throw new Error(`--${label} must be 1-40 chars of letters, numbers, "_", "." (got: ${value ?? '(missing)'})`);
  }
  return value;
}

function validateRegion(value: string | undefined): string {
  const upper = (value ?? '').toUpperCase();
  if (!REGION_PATTERN.test(upper)) {
    throw new Error(`--region must be a 2-letter region code like US or GB (got: ${value ?? '(missing)'})`);
  }
  return upper;
}

function validateCurrency(value: string | undefined): string {
  const upper = (value ?? '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(upper)) {
    throw new Error(`--currency must be a 3-letter ISO 4217 code like USD (got: ${value ?? '(missing)'})`);
  }
  return upper;
}

// Splits a decimal amount like "9.99" into Money's {units, nanos} --
// rounded to whole cents (nanos as a multiple of 10,000,000) since
// that's how every real price in this app is actually entered; a
// fractional-cent price would almost certainly be a typo, not intent.
function parseAmount(value: string | undefined): { units: string; nanos: number } {
  const amount = Number(value);
  if (!value || !Number.isFinite(amount) || amount < 0) {
    throw new Error(`--amount must be a non-negative number like 9.99 (got: ${value ?? '(missing)'})`);
  }
  const totalCents = Math.round(amount * 100);
  const units = Math.floor(totalCents / 100);
  const cents = totalCents % 100;
  return { units: String(units), nanos: cents * 10_000_000 };
}

function printJson(label: string, value: unknown): void {
  console.log(`\n${label}:`);
  console.log(JSON.stringify(value, null, 2));
}

async function runGet(args: Record<string, string | boolean | undefined>): Promise<void> {
  if (!args.product) {
    const subs = await listSubscriptions();
    printJson('Subscriptions', subs.map((s) => ({ productId: s.productId, basePlanIds: (s.basePlans ?? []).map((bp) => bp.basePlanId) })));
    console.log('\nPass --product <productId> to see one subscription\'s full base plans + regional prices.');
    return;
  }
  const productId = validateId(args.product as string, 'product');
  const subscription = await getSubscription(productId);
  printJson(`Subscription "${productId}"`, subscription);
}

async function runSet(args: Record<string, string | boolean | undefined>): Promise<void> {
  const productId = validateId(args.product as string, 'product');
  const basePlanId = validateId(args.base as string, 'base');
  const regionCode = validateRegion(args.region as string);
  const currencyCode = validateCurrency(args.currency as string);
  const { units, nanos } = parseAmount(args.amount as string);
  const dryRun = Boolean(args['dry-run']);

  const target: PriceTarget = { regionCode, currencyCode, units, nanos };
  const result = await patchBasePlanRegionalPrice(productId, basePlanId, target, { dryRun });

  if (result.dryRun) {
    console.log(`\nDRY RUN -- no request sent to Google. This is what WOULD be sent:`);
    console.log(`PATCH .../subscriptions/${productId}?updateMask=${result.updateMask}`);
    printJson('Request body', result.requestBody);
  } else {
    console.log(`\nUpdated ${productId}/${basePlanId} in ${regionCode} to ${currencyCode} ${(Number(units) + nanos / 1e9).toFixed(2)}.`);
    printJson('Response', result.response);
    console.log(
      '\nReminder: new buyers see this price within a few hours. Existing subscribers keep their old ' +
        'price until you separately run the "migrate" command -- see README.md.'
    );
  }
}

async function runMigrate(args: Record<string, string | boolean | undefined>): Promise<void> {
  const productId = validateId(args.product as string, 'product');
  const basePlanId = validateId(args.base as string, 'base');
  const regionCodes = String(args.regions ?? '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => validateRegion(r));
  if (regionCodes.length === 0) {
    throw new Error('--regions must be a comma-separated list of region codes, e.g. --regions US,GB');
  }
  const dryRun = Boolean(args['dry-run']);

  const result = await migratePrices(productId, basePlanId, regionCodes, { dryRun });

  if (result.dryRun) {
    console.log(`\nDRY RUN -- no request sent to Google. This is what WOULD be sent:`);
    console.log(`POST .../subscriptions/${productId}/basePlans/${basePlanId}:migratePrices`);
    printJson('Request body', result.requestBody);
  } else {
    console.log(
      `\nMigrated existing subscribers in ${regionCodes.join(', ')} on ${productId}/${basePlanId} to the current price.`
    );
    console.log('This can trigger Play\'s price-increase consent flow for affected subscribers, who may cancel if they decline.');
  }
}

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      product: { type: 'string' },
      base: { type: 'string' },
      region: { type: 'string' },
      regions: { type: 'string' },
      amount: { type: 'string' },
      currency: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
    },
  });

  const command = positionals[0];
  switch (command) {
    case 'get':
      await runGet(values);
      break;
    case 'set':
      await runSet(values);
      break;
    case 'migrate':
      await runMigrate(values);
      break;
    default:
      console.log(
        'Usage:\n' +
          '  npm run prices -- get [--product <productId>]\n' +
          '  npm run prices -- set --product <p> --base <basePlanId> --region <US> --amount <9.99> --currency <USD> [--dry-run]\n' +
          '  npm run prices -- migrate --product <p> --base <basePlanId> --regions <US,GB> [--dry-run]'
      );
      process.exitCode = command ? 1 : 0;
  }
}

main().catch((err) => {
  console.error('\nError:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
