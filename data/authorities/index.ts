import { RECEIVING_AUTHORITIES } from "./registry";
import type {
  ReceivingAuthority,
  AuthorityType,
  AuthorityConfidence,
  CorridorStatus,
  AuthorityCoverageEntry,
  AuthorityTimelineEvent,
  AuthorityChangeLogEntry,
  SourceVaultEntry,
} from "./types";

export type { ReceivingAuthority, AuthorityType, AuthorityConfidence, CorridorStatus };
export { RECEIVING_AUTHORITIES };

// ── Slug normalization ────────────────────────────────────────────────────────

export function toAuthoritySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function getAuthority(id: string): ReceivingAuthority | null {
  return RECEIVING_AUTHORITIES.find((a) => a.id === id) ?? null;
}

export function getAuthoritiesByCountry(countryIso: string): ReceivingAuthority[] {
  return RECEIVING_AUTHORITIES.filter(
    (a) => a.country.toUpperCase() === countryIso.toUpperCase() && a.valid_to === null,
  );
}

export function getAuthoritiesByType(type: AuthorityType): ReceivingAuthority[] {
  return RECEIVING_AUTHORITIES.filter((a) => a.authority_type === type && a.valid_to === null);
}

export function getVerifiedAuthorities(): ReceivingAuthority[] {
  return RECEIVING_AUTHORITIES.filter(
    (a) =>
      (a.authority_confidence === "AUTHORITY_VERIFIED" ||
        a.authority_confidence === "MULTI_SOURCE_CONFIRMED") &&
      a.valid_to === null,
  );
}

export function getAuthoritiesNeedingReview(): ReceivingAuthority[] {
  const today = new Date().toISOString().slice(0, 10);
  return RECEIVING_AUTHORITIES.filter(
    (a) => a.next_review_due !== null && a.next_review_due <= today && a.valid_to === null,
  );
}

export function getHighFrictionAuthorities(minFriction = 7): ReceivingAuthority[] {
  return RECEIVING_AUTHORITIES.filter(
    (a) => a.friction_score >= minFriction && a.valid_to === null,
  );
}

export function getAuthorityDocumentRule(
  authorityId: string,
  documentTypeSlug: string,
) {
  const authority = getAuthority(authorityId);
  if (!authority) return null;
  return (
    authority.document_rules.find(
      (r) =>
        r.document_type_slug === documentTypeSlug &&
        (r.valid_to === null || r.valid_to > new Date().toISOString().slice(0, 10)),
    ) ?? null
  );
}

// ── Confidence gate ────────────────────────────────────────────────────────────
// Only AUTHORITY_VERIFIED and MULTI_SOURCE_CONFIRMED may auto-drive requirements.
// DEMOTED explicitly blocked — requirements no longer reliable.

export function canAutoDriveReadiness(confidence: AuthorityConfidence): boolean {
  if (confidence === "DEMOTED") return false;
  return (
    confidence === "AUTHORITY_VERIFIED" || confidence === "MULTI_SOURCE_CONFIRMED"
  );
}

// ── Authority slug → record ───────────────────────────────────────────────────
// Used by SEO pages to resolve [authority] param

export function getAuthorityBySlug(slug: string): ReceivingAuthority | null {
  return (
    RECEIVING_AUTHORITIES.find(
      (a) => toAuthoritySlug(a.authority_name) === slug && a.valid_to === null,
    ) ?? null
  );
}

// ── Static SEO params ─────────────────────────────────────────────────────────
// Returns only verified authorities with at least one document rule

export function getAuthorityStaticParams(): { country: string; authority: string }[] {
  return RECEIVING_AUTHORITIES.filter(
    (a) =>
      canAutoDriveReadiness(a.authority_confidence) &&
      a.document_rules.length > 0 &&
      a.valid_to === null,
  ).map((a) => ({
    country: a.country.toLowerCase(),
    authority: toAuthoritySlug(a.authority_name),
  }));
}

export { AUTHORITY_CHANGE_LOG, AUTHORITY_TIMELINE, SOURCE_VAULT } from "./changelog";
export type { AuthorityChangeLogEntry, AuthorityTimelineEvent, TimelineEventType, SourceVaultEntry, AuthorityCoverageEntry } from "./types";

// ── AOC queries ────────────────────────────────────────────────────────────────

export function getAuthorityCoverage(): AuthorityCoverageEntry[] {
  const byCountry: Record<string, AuthorityCoverageEntry> = {};

  for (const a of RECEIVING_AUTHORITIES) {
    if (a.valid_to !== null) continue;
    const key = a.country.toUpperCase();
    if (!byCountry[key]) {
      byCountry[key] = {
        country_iso: key,
        country_name: a.country_name,
        verified: 0,
        pending: 0,
        unknown: 0,
        demoted: 0,
      };
    }
    const c = a.authority_confidence;
    if (c === "AUTHORITY_VERIFIED" || c === "MULTI_SOURCE_CONFIRMED") {
      byCountry[key].verified++;
    } else if (c === "PARTNER_CONFIRMED" || c === "OBSERVED") {
      byCountry[key].pending++;
    } else if (c === "DEMOTED") {
      byCountry[key].demoted++;
    } else {
      byCountry[key].unknown++;
    }
  }

  return Object.values(byCountry).sort((a, b) =>
    b.verified - a.verified || a.country_name.localeCompare(b.country_name)
  );
}

export function getVerificationQueue(): ReceivingAuthority[] {
  return RECEIVING_AUTHORITIES.filter(
    (a) =>
      (a.authority_confidence === "VERIFICATION_REQUIRED" ||
        a.authority_confidence === "UNVERIFIED") &&
      a.valid_to === null,
  ).sort((a, b) => b.friction_score - a.friction_score);
}

export function getReviewQueue(): ReceivingAuthority[] {
  const today = new Date().toISOString().slice(0, 10);
  return RECEIVING_AUTHORITIES.filter(
    (a) =>
      a.next_review_due !== null &&
      a.next_review_due <= today &&
      a.valid_to === null,
  ).sort((a, b) => (a.next_review_due ?? "").localeCompare(b.next_review_due ?? ""));
}

export function getPromotionQueue(): ReceivingAuthority[] {
  return RECEIVING_AUTHORITIES.filter(
    (a) =>
      (a.authority_confidence === "OBSERVED" ||
        a.authority_confidence === "PARTNER_CONFIRMED") &&
      a.valid_to === null &&
      a.source_reference !== null,
  ).sort((a, b) => b.friction_score - a.friction_score);
}

export function getDemotedAuthorities(): ReceivingAuthority[] {
  return RECEIVING_AUTHORITIES.filter(
    (a) => a.authority_confidence === "DEMOTED" && a.valid_to === null,
  );
}

export function getAuthorityTimeline(authorityId: string): AuthorityTimelineEvent[] {
  const { AUTHORITY_TIMELINE } = require("./changelog") as { AUTHORITY_TIMELINE: AuthorityTimelineEvent[] };
  return AUTHORITY_TIMELINE.filter((e) => e.authority_id === authorityId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function getAuthorityChangeLog(authorityId: string): AuthorityChangeLogEntry[] {
  const { AUTHORITY_CHANGE_LOG } = require("./changelog") as { AUTHORITY_CHANGE_LOG: AuthorityChangeLogEntry[] };
  return AUTHORITY_CHANGE_LOG.filter((e) => e.authority_id === authorityId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function getSourceVault(authorityId: string): SourceVaultEntry[] {
  const { SOURCE_VAULT } = require("./changelog") as { SOURCE_VAULT: SourceVaultEntry[] };
  return SOURCE_VAULT.filter((e) => e.authority_id === authorityId)
    .sort((a, b) => b.captured_at.localeCompare(a.captured_at));
}

import { AUTHORITY_DEPENDENCIES } from "./dependencies";
import type { AuthorityDependency, AuthorityChain, DependencyType, AuthorityRole } from "./types";

export { AUTHORITY_DEPENDENCIES };
export type { AuthorityDependency, AuthorityChain, DependencyType, AuthorityRole };

// ── Dependency graph queries ───────────────────────────────────────────────────

export function getDependenciesForAuthority(authorityId: string): AuthorityDependency[] {
  return AUTHORITY_DEPENDENCIES.filter(
    (d) =>
      (d.upstream_authority_id === authorityId ||
        d.downstream_authority_id === authorityId) &&
      d.valid_to === null,
  );
}

export function getDependencyChain(
  countryIso: string,
  documentTypeSlug: string | null,
): AuthorityDependency[] {
  return AUTHORITY_DEPENDENCIES.filter(
    (d) =>
      d.country.toUpperCase() === countryIso.toUpperCase() &&
      (d.document_type_slug === documentTypeSlug || d.document_type_slug === null) &&
      d.valid_to === null,
  ).sort((a, b) => a.required_order - b.required_order);
}

export function buildAuthorityChain(
  countryIso: string,
  documentTypeSlug: string | null,
): AuthorityChain {
  const deps = getDependencyChain(countryIso, documentTypeSlug);
  const authorityIds = new Set<string>();
  for (const d of deps) {
    authorityIds.add(d.upstream_authority_id);
    authorityIds.add(d.downstream_authority_id);
  }

  const steps: AuthorityChain["chain"] = [];
  const seen = new Set<string>();

  for (const dep of deps) {
    if (!seen.has(dep.upstream_authority_id)) {
      seen.add(dep.upstream_authority_id);
      const a = getAuthority(dep.upstream_authority_id);
      if (a) {
        steps.push({
          step: dep.required_order,
          authority_id: a.id,
          authority_name: a.authority_name,
          authority_type: a.authority_type,
          role: dep.upstream_role,
          confidence: a.authority_confidence,
          dependency_type: dep.dependency_type,
        });
      }
    }
  }

  const confidenceLevels: AuthorityConfidence[] = [
    "AUTHORITY_VERIFIED",
    "MULTI_SOURCE_CONFIRMED",
    "PARTNER_CONFIRMED",
    "OBSERVED",
    "UNVERIFIED",
    "VERIFICATION_REQUIRED",
    "DEMOTED",
  ];

  let chainConfidence: AuthorityConfidence | null = null;
  for (const step of steps) {
    const idx = confidenceLevels.indexOf(step.confidence);
    if (
      chainConfidence === null ||
      idx > confidenceLevels.indexOf(chainConfidence)
    ) {
      chainConfidence = step.confidence;
    }
  }

  const isComplete = steps.length > 0 && steps.every(
    (s) =>
      s.confidence !== "VERIFICATION_REQUIRED" &&
      s.confidence !== "UNVERIFIED" &&
      s.confidence !== "DEMOTED",
  );

  return {
    country: countryIso,
    document_type_slug: documentTypeSlug,
    chain: steps.sort((a, b) => a.step - b.step),
    is_complete: isComplete,
    chain_confidence: chainConfidence,
  };
}
