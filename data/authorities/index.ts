import { RECEIVING_AUTHORITIES } from "./registry";
import type {
  ReceivingAuthority,
  AuthorityType,
  AuthorityConfidence,
  CorridorStatus,
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

export function canAutoDriveReadiness(confidence: AuthorityConfidence): boolean {
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
