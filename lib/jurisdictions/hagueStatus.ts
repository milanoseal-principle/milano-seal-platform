import type { CountryRecord, HagueStatus } from "./types";
import { getCountryByIso, getCountryByName } from "./countryRegistry";

// Hague Apostille Convention status classification.
//
// SAFETY: This is an operational lookup against an illustrative registry, NOT
// an authoritative determination. Anything not confidently classified defaults
// to "unknown", which routes to manual review. Membership must be verified
// against the HCCH status table before execution.

export interface HagueClassification {
  status: HagueStatus;
  requiresManualReview: boolean;
  note: string;
}

export function classifyHague(
  country: string | CountryRecord | undefined,
): HagueClassification {
  const record = resolveCountry(country);

  if (!record) {
    return {
      status: "unknown",
      requiresManualReview: true,
      note: "Country not found in registry — manual review required. Verify Hague status against the HCCH status table.",
    };
  }

  if (record.hagueStatus === "unknown") {
    return {
      status: "unknown",
      requiresManualReview: true,
      note: "Hague status unknown for this record — manual review required before execution.",
    };
  }

  return {
    status: record.hagueStatus,
    // Even known statuses stay verify-before-execution; flag review when the
    // record itself is uncertain.
    requiresManualReview: record.requiresManualReview === true,
    note:
      record.hagueStatus === "member"
        ? "Illustrative member classification — verify current status and the specific receiving authority before execution."
        : "Illustrative non-member classification — consular legalization path likely; verify before execution.",
  };
}

function resolveCountry(
  country: string | CountryRecord | undefined,
): CountryRecord | undefined {
  if (!country) return undefined;
  if (typeof country !== "string") return country;
  const byIso = country.trim().length <= 3 ? getCountryByIso(country) : undefined;
  return byIso ?? getCountryByName(country) ?? getCountryByIso(country);
}
