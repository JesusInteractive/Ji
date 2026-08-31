// Resource shapes verified directly against Google's live API reference
// docs (developers.google.com/android-publisher/api-ref/rest/v3) rather
// than assumed -- field names below are the real ones, not guesses.

export interface Money {
  currencyCode: string;
  units: string; // int64 in the API -- Google's client libraries return this as a string
  nanos: number;
}

export interface RegionalBasePlanConfig {
  regionCode: string; // ISO 3166-1 alpha-2, e.g. "US", "GB"
  newSubscriberAvailability?: boolean;
  price?: Money;
}

export interface BasePlan {
  basePlanId: string;
  state?: string;
  regionalConfigs?: RegionalBasePlanConfig[];
  [key: string]: unknown; // autoRenewingBasePlanType, offerTags, etc. -- untouched by this tool
}

export interface Subscription {
  packageName: string;
  productId: string;
  basePlans?: BasePlan[];
  [key: string]: unknown; // listings, taxAndComplianceSettings, etc. -- untouched by this tool
}

export interface RegionsVersion {
  version: string; // e.g. "2022/02" -- see .env.example's own comment on where this comes from
}

// One region's intended new price, as parsed from CLI args before being
// written into a RegionalBasePlanConfig.
export interface PriceTarget {
  regionCode: string;
  currencyCode: string;
  units: string;
  nanos: number;
}
