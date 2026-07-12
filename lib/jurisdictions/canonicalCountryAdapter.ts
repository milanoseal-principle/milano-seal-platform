// Canonical Country Adapter — merges the multiple country sources by ISO code
// WITHOUT overwriting conflicts.
//
// Governance (from the duplicate audit):
//   - data/destinations         → controlling presentation/routing registry
//   - lib/compliance/countries  → authoritative compliance reference
//   - lib/jurisdictions/*        → this adapter/intelligence layer (NOT a competing DB)
//
// Conflicts between sources are surfaced for review, never silently resolved.

export type CountryVerificationStatus = "verified" | "unverified" | "conflict" | "unknown";
export type CountryHagueStatus = "member" | "non_member" | "unknown";

export interface CountrySourceRecord {
  source: string; // e.g. "data/destinations" | "compliance/countries" | "jurisdictions"
  iso: string;
  name?: string;
  hagueStatus?: CountryHagueStatus;
  lastVerifiedAt?: string | null;
}

export interface CanonicalCountryRecord {
  iso: string;
  name?: string;
  hagueStatus: CountryHagueStatus;
  sources: string[];
  lastVerifiedAt: string | null;
  verificationStatus: CountryVerificationStatus;
  conflicts: string[];
  manualReviewRequired: boolean;
}

/**
 * Merge multiple source records for one ISO code. Retains provenance and records
 * any Hague-status conflict rather than picking a winner.
 */
export function mergeCountrySources(
  iso: string,
  records: CountrySourceRecord[],
): CanonicalCountryRecord {
  const sources = records.map((r) => r.source);
  const name = records.find((r) => r.name)?.name;
  const hagueValues = Array.from(
    new Set(records.map((r) => r.hagueStatus).filter((h): h is CountryHagueStatus => !!h)),
  );
  const conflicts: string[] = [];
  let hagueStatus: CountryHagueStatus = "unknown";
  if (hagueValues.length === 1) hagueStatus = hagueValues[0];
  else if (hagueValues.length > 1) {
    conflicts.push(`Hague status conflict: ${hagueValues.join(" vs ")}`);
    hagueStatus = "unknown";
  }
  const verifiedDates = records
    .map((r) => r.lastVerifiedAt)
    .filter((d): d is string => !!d)
    .sort();
  const lastVerifiedAt = verifiedDates.length ? verifiedDates[verifiedDates.length - 1] : null;

  const verificationStatus: CountryVerificationStatus = conflicts.length
    ? "conflict"
    : lastVerifiedAt
      ? "verified"
      : "unverified";

  return {
    iso,
    name,
    hagueStatus,
    sources,
    lastVerifiedAt,
    verificationStatus,
    conflicts,
    manualReviewRequired: conflicts.length > 0 || verificationStatus !== "verified",
  };
}

export const CANONICAL_COUNTRY_NOTE =
  "Verify current official requirements before execution. data/destinations = presentation; compliance/countries = authoritative; jurisdictions = adapter layer.";
