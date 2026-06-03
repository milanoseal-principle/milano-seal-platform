export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { RECEIVING_AUTHORITIES } from "@/data/authorities";
import { AuthorityAcquisition } from "@/components/dashboard/AuthorityAcquisition";

export const metadata = {
  title: "Authority Acquisition Engine — Milano Seal",
};

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const k = String(item[key]);
    if (!result[k]) result[k] = [];
    result[k].push(item);
  }
  return result;
}

const VERIFIED_LEVELS = ["PARTNER_CONFIRMED", "MULTI_SOURCE_CONFIRMED", "AUTHORITY_VERIFIED"];

export type CountryStat = {
  country: string;
  total: number;
  unverified: number;
  verification_required: number;
  observed: number;
  partner_confirmed: number;
  multi_source: number;
  authority_verified: number;
  verified_count: number;
  coverage_pct: number;
};

export type GlobalStats = {
  total: number;
  verified: number;
  observed: number;
  needs_work: number;
};

export type ConfidenceCounts = {
  UNVERIFIED: number;
  VERIFICATION_REQUIRED: number;
  OBSERVED: number;
  PARTNER_CONFIRMED: number;
  MULTI_SOURCE_CONFIRMED: number;
  AUTHORITY_VERIFIED: number;
};

export default async function AuthorityAcquisitionPage() {
  await requireDashboardAccess();

  const activeAuthorities = RECEIVING_AUTHORITIES.filter((a) => a.valid_to === null);
  const byCountry = groupBy(activeAuthorities, "country_name");

  const countryStats: CountryStat[] = Object.entries(byCountry)
    .map(([country, auths]) => {
      const verifiedCount = auths.filter((a) => VERIFIED_LEVELS.includes(a.authority_confidence)).length;
      return {
        country,
        total: auths.length,
        unverified: auths.filter((a) => a.authority_confidence === "UNVERIFIED").length,
        verification_required: auths.filter((a) => a.authority_confidence === "VERIFICATION_REQUIRED").length,
        observed: auths.filter((a) => a.authority_confidence === "OBSERVED").length,
        partner_confirmed: auths.filter((a) => a.authority_confidence === "PARTNER_CONFIRMED").length,
        multi_source: auths.filter((a) => a.authority_confidence === "MULTI_SOURCE_CONFIRMED").length,
        authority_verified: auths.filter((a) => a.authority_confidence === "AUTHORITY_VERIFIED").length,
        verified_count: verifiedCount,
        coverage_pct: Math.round((verifiedCount / auths.length) * 100),
      };
    })
    .sort((a, b) => b.verified_count - a.verified_count || b.coverage_pct - a.coverage_pct);

  const globalStats: GlobalStats = {
    total: activeAuthorities.length,
    verified: activeAuthorities.filter((a) => VERIFIED_LEVELS.includes(a.authority_confidence)).length,
    observed: activeAuthorities.filter((a) => a.authority_confidence === "OBSERVED").length,
    needs_work: activeAuthorities.filter((a) =>
      ["UNVERIFIED", "VERIFICATION_REQUIRED"].includes(a.authority_confidence),
    ).length,
  };

  const confidenceCounts: ConfidenceCounts = {
    UNVERIFIED: activeAuthorities.filter((a) => a.authority_confidence === "UNVERIFIED").length,
    VERIFICATION_REQUIRED: activeAuthorities.filter((a) => a.authority_confidence === "VERIFICATION_REQUIRED").length,
    OBSERVED: activeAuthorities.filter((a) => a.authority_confidence === "OBSERVED").length,
    PARTNER_CONFIRMED: activeAuthorities.filter((a) => a.authority_confidence === "PARTNER_CONFIRMED").length,
    MULTI_SOURCE_CONFIRMED: activeAuthorities.filter((a) => a.authority_confidence === "MULTI_SOURCE_CONFIRMED").length,
    AUTHORITY_VERIFIED: activeAuthorities.filter((a) => a.authority_confidence === "AUTHORITY_VERIFIED").length,
  };

  return (
    <AuthorityAcquisition
      countryStats={countryStats}
      globalStats={globalStats}
      confidenceCounts={confidenceCounts}
      total={activeAuthorities.length}
    />
  );
}
