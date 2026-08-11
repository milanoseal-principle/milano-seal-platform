// Partner Passport adapters — normalize the two deprecated passport shapes
// (dispatch, platform) toward the canonical passport. Translation only.
//
// These implementations currently have 0 importers, so this is a forward-compat
// shim; full field-by-field migration happens in a later consumer-migration phase.

import type { CanonicalPartnerPassport } from "./canonicalPartnerPassport";

/**
 * Normalize an arbitrary legacy passport-like object into the subset of fields
 * shared with the canonical passport. Unknown fields are dropped, never invented.
 */
export function normalizeToCanonicalPassport(
  input: Record<string, unknown>,
): Partial<CanonicalPartnerPassport> {
  const carry = [
    "partnerId",
    "trustScore",
    "status",
    "tier",
    "states",
    "countries",
    "languages",
    "specialties",
    "availability",
    "completedMatters",
  ];
  const out: Record<string, unknown> = {};
  for (const key of carry) if (key in input) out[key] = input[key];
  return out as unknown as Partial<CanonicalPartnerPassport>;
}
