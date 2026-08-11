/**
 * procurementSafety — canonical safety policy consumed by every Procurement
 * Engine module. Encodes the non-negotiable rules: no fabricated opportunities,
 * awards, contract values, relationships, references, or insurance; no
 * government/airport/TSA endorsement; no legal or immigration advice; unknown
 * data stays unknown; public and internal data stay separated.
 *
 * These are presentation/governance guards — they never touch payments,
 * scheduling, release, custody, RLS, Shippo, or BlueNotary.
 */

export type DataStatus =
  | "verified"
  | "submitted"
  | "pending_verification"
  | "incomplete"
  | "archived"
  | "sample";

export type VerificationStatus =
  | "verified"
  | "unverified"
  | "pending_verification"
  | "unknown";

/** Fields every procurement record must carry (Step 3 contract). */
export interface ProcurementRecordMeta {
  id: string;
  source: string;
  sourceUrl?: string | null;
  dataStatus: DataStatus;
  verificationStatus: VerificationStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
  owner?: string | null;
  notes?: string | null;
  isSample: boolean;
}

/** Phrases that must never appear as unqualified public claims. */
export const BANNED_PUBLIC_CLAIMS: readonly string[] = [
  "government approved",
  "government-approved",
  "preferred vendor",
  "guaranteed award",
  "guaranteed contract",
  "guaranteed acceptance",
  "guaranteed deployment",
  "airport approved",
  "tsa approved",
  "tsa certified",
  "airline approved",
  "sida access",
  "badge approved",
  "legal advice",
  "immigration advice",
];

/** True when a string contains a banned unqualified public claim. */
export function containsBannedClaim(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return BANNED_PUBLIC_CLAIMS.some((c) => t.includes(c));
}

/**
 * An award may only be recorded with documented award evidence. Never infer an
 * award from a submission, a recommendation, or optimism.
 */
export function canRecordAward(evidence: {
  awardEvidenceRef?: string | null;
  verified?: boolean;
}): boolean {
  return Boolean(evidence.awardEvidenceRef) && evidence.verified === true;
}

/** Insurance is only "bound" with real binding evidence — never a broker letter or LOI. */
export function isInsuranceBound(status: string): boolean {
  return status === "bound";
}

/** Reference is only usable in output when consent is explicitly recorded as confirmed. */
export function isReferenceUsable(consentStatus: string): boolean {
  return consentStatus === "confirmed";
}

/** Normalize an unknown/blank value to the canonical "unknown" sentinel, never a guess. */
export function unknownIfBlank<T>(value: T | null | undefined): T | null {
  return value === undefined || value === "" ? null : (value ?? null);
}

export const PROCUREMENT_SAFETY_NOTICE =
  "Administrative procurement coordination only. Not legal advice. No government, airport, TSA, or airline endorsement is claimed. Unknown information remains unverified rather than assumed.";
