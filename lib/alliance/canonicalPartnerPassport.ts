// Canonical Partner Passport — controlling decision.
//
// The audit found THREE Partner Passport implementations, all with 0 importers:
//   - lib/alliance/intelligence/partnerPassport.ts   ← SELECTED (most complete)
//   - lib/dispatch/trustScore.ts (+ dispatch types)
//   - lib/platform/trustNetwork.ts
//
// Controlling = lib/alliance/intelligence/partnerPassport.ts. It is re-exported
// here as the canonical passport. The other two are NOT deleted; they are wrapped
// via partnerPassportAdapters and marked deprecated as consumers migrate.

export { buildPartnerPassport as buildCanonicalPartnerPassport } from "./intelligence/partnerPassport";
export type { PartnerPassportSummary as CanonicalPartnerPassport } from "./intelligence/partnerPassport";

export const CANONICAL_PARTNER_PASSPORT_SOURCE =
  "lib/alliance/intelligence/partnerPassport.ts";

export const PARTNER_PASSPORT_DEPRECATED_IMPLEMENTATIONS = [
  "lib/dispatch/trustScore.ts",
  "lib/platform/trustNetwork.ts",
] as const;
