// Source-backed U.S. state (issuing-side) authority provenance and the official
// authority asset registry. Deterministic and projection-only.
//
// This module never turns model knowledge, third-party summaries or the legacy
// US_STATE_EXECUTION_REGISTRY into production law. Only an official government
// source, recorded by an operator inside its review window, may yield
// VERIFIED. Rule facts (RON, electronic submission, papering out, submission
// method, fee) read as "unknown" unless the record is VERIFIED.
// Hague membership alone proves none of: RON acceptance, wet-ink acceptance,
// translation requirements, document eligibility or receiving-authority
// acceptance.

import { US_STATE_EXECUTION_REGISTRY } from "@/lib/milano-seal/global-acceptance/us-state-execution-registry";

export type StateAuthorityStatus = "VERIFIED" | "REVIEW_REQUIRED" | "STALE" | "INSUFFICIENT_EVIDENCE";
export type StateAuthorityConfidence =
  | "OFFICIAL_SOURCE"
  | "OPERATOR_CONFIRMED"
  | "THIRD_PARTY"
  | "MODEL_GENERATED"
  | "UNVERIFIED";

export const STATE_AUTHORITY_TYPES = ["secretary_of_state", "state_notary_commission", "county_clerk", "other"] as const;
export type StateAuthorityType = (typeof STATE_AUTHORITY_TYPES)[number];

export const AUTHORITY_ASSET_TYPES = [
  "official_form",
  "instruction_sheet",
  "fee_schedule",
  "submission_guide",
  "authority_notice",
  "other",
] as const;
export type AuthorityAssetType = (typeof AUTHORITY_ASSET_TYPES)[number];
export type AuthorityAssetStatus = "ACTIVE" | "SUPERSEDED" | "REVIEW_REQUIRED";

export interface StateAuthorityRecord {
  id?: string | null;
  state_code: string;
  authority_name: string;
  authority_type: string;
  official_source_url?: string | null;
  official_source_title?: string | null;
  ron_supported_by_state_notary?: string | null;
  electronic_document_submission_status?: string | null;
  papering_out_rule?: string | null;
  county_clerk_pre_authentication?: string | null;
  competent_authority?: string | null;
  apostille_submission_method?: string | null;
  state_fee?: number | string | null;
  source_verified_at?: string | null;
  next_review_at?: string | null;
  confidence?: string | null;
  status?: string | null;
  review_notes?: string | null;
  verified_by?: string | null;
}

export interface AuthoritySourceAsset {
  id: string;
  authority_id: string;
  state_code: string;
  asset_type: string;
  title: string;
  purpose?: string | null;
  repository_path?: string | null;
  official_source_url?: string | null;
  source_version?: string | null;
  source_date?: string | null;
  verified_at?: string | null;
  status: string;
  sha256?: string | null;
}

/** Same host rule as the migration's VERIFIED constraint. */
const OFFICIAL_HOST = /^([a-z0-9-]+\.)*([a-z0-9-]+\.gov|state\.[a-z]{2}\.us)$/;

/** True only for https URLs on a U.S. government host (.gov or state.xx.us). */
export function isOfficialGovernmentSource(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" && OFFICIAL_HOST.test(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

const VERIFYING_CONFIDENCE = new Set<string>(["OFFICIAL_SOURCE", "OPERATOR_CONFIRMED"]);

const validDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export interface StateAuthorityEvaluation {
  status: StateAuthorityStatus;
  routeReviewRequired: boolean;
  reasons: string[];
}

/**
 * Effective provenance status. The stored status is never trusted upward:
 * a record is VERIFIED only when every provenance condition holds now.
 */
export function evaluateStateAuthority(record: StateAuthorityRecord, now: Date = new Date()): StateAuthorityEvaluation {
  const reasons: string[] = [];
  const url = record.official_source_url?.trim() ?? "";
  const confidence = record.confidence?.trim() ?? "UNVERIFIED";

  if (!url) {
    return {
      status: "INSUFFICIENT_EVIDENCE",
      routeReviewRequired: true,
      reasons: ["No source is recorded for this authority."],
    };
  }
  if (!isOfficialGovernmentSource(url)) {
    reasons.push("The recorded source is not an official government source.");
  }
  if (confidence === "MODEL_GENERATED") {
    reasons.push("Model-generated authority facts are never verified.");
  } else if (confidence === "THIRD_PARTY") {
    reasons.push("Third-party sources require independent operator confirmation against official authority evidence.");
  } else if (!VERIFYING_CONFIDENCE.has(confidence)) {
    reasons.push("Authority facts have not been verified by an operator.");
  }
  const verifiedAt = validDate(record.source_verified_at);
  const nextReview = validDate(record.next_review_at);
  if (!verifiedAt) reasons.push("No verification date is recorded.");
  if (!nextReview) reasons.push("No next review date is recorded.");
  if (!record.verified_by) reasons.push("No verifying operator is recorded.");
  if (record.status && record.status !== "VERIFIED" && reasons.length === 0) {
    reasons.push("The authority record is not marked verified.");
  }

  if (reasons.length > 0) {
    return { status: "REVIEW_REQUIRED", routeReviewRequired: true, reasons };
  }
  if (nextReview!.getTime() <= now.getTime()) {
    return {
      status: "STALE",
      routeReviewRequired: true,
      reasons: ["The official source review window has expired."],
    };
  }
  return { status: "VERIFIED", routeReviewRequired: false, reasons: [] };
}

export type AuthorityFact =
  | "ron_supported_by_state_notary"
  | "electronic_document_submission_status"
  | "papering_out_rule"
  | "county_clerk_pre_authentication"
  | "apostille_submission_method";

/**
 * A rule fact is only surfaced from a VERIFIED record. Anything else reads as
 * "unknown": e-apostille, RON acceptance, papering out and the like are never
 * labelled without authority evidence.
 */
export function authorityFact(record: StateAuthorityRecord, fact: AuthorityFact, now: Date = new Date()): string {
  if (evaluateStateAuthority(record, now).status !== "VERIFIED") return "unknown";
  const value = record[fact];
  return typeof value === "string" && value.trim() ? value.trim() : "unknown";
}

/** Government fee, only from a VERIFIED record. A fee is never invented. */
export function authorityStateFee(record: StateAuthorityRecord, now: Date = new Date()): number | null {
  if (evaluateStateAuthority(record, now).status !== "VERIFIED") return null;
  if (record.state_fee === null || record.state_fee === undefined || record.state_fee === "") return null;
  const fee = Number(record.state_fee);
  return Number.isFinite(fee) && fee >= 0 ? fee : null;
}

/**
 * Projects the legacy in-code state registry as unverified input. Its entries
 * carry operator notes, not official source URLs, so they can never become
 * VERIFIED and none of their asserted facts is surfaced.
 */
export function legacyStateAuthorityRecord(stateCode: string): StateAuthorityRecord | null {
  const code = stateCode.trim().toUpperCase();
  const legacy = US_STATE_EXECUTION_REGISTRY.find((entry) => entry.stateCode === code);
  if (!legacy) return null;
  const officialUrl = legacy.stateOfficialSources.map((source) => source.url).find(isOfficialGovernmentSource);
  return {
    state_code: code,
    authority_name: legacy.apostilleAuthority,
    authority_type: "secretary_of_state",
    official_source_url: officialUrl ?? null,
    ron_supported_by_state_notary: "unknown",
    electronic_document_submission_status: "unknown",
    papering_out_rule: "unknown",
    county_clerk_pre_authentication: "unknown",
    apostille_submission_method: "unknown",
    state_fee: null,
    confidence: "UNVERIFIED",
    status: "REVIEW_REQUIRED",
    review_notes: "Imported from the legacy in-code state registry; requires official source verification.",
  };
}

// ── Official asset registry ──

/** Operator-safe column lists (never client-facing). */
export const STATE_AUTHORITY_FIELDS =
  "id,state_code,authority_name,authority_type,official_source_url,official_source_title,ron_supported_by_state_notary,electronic_document_submission_status,papering_out_rule,county_clerk_pre_authentication,competent_authority,apostille_submission_method,state_fee,source_verified_at,next_review_at,confidence,status,review_notes,verified_by,updated_at";
export const AUTHORITY_ASSET_FIELDS =
  "id,authority_id,state_code,asset_type,title,purpose,repository_path,official_source_url,source_version,source_date,verified_at,status,sha256,review_notes,updated_at";


/** Registration record for the committed Florida DOS official form. */
export const FLORIDA_DOS_APOSTILLE_FORM = {
  stateCode: "FL",
  authorityName: "Florida Department of State, Division of Corporations",
  assetType: "official_form" as const,
  title: "Apostille and Notarial Certificate Request Form",
  purpose: "Apostille / Notarial Certificate Request",
  repositoryPath: "1-apostille_and_notarial_certificate_request_form-10-19-2023.pdf",
  officialSourceUrl:
    "https://files.floridados.gov/media/702388/1-apostille_and_notarial_certificate_request_form-10-19-2023.pdf",
  sourceVersion: "10-19-2023",
  sourceDate: "2023-10-19",
  sha256: "403aedc99dfea348f8392709f5ea63aa2af7d5836d91f498c354f70f3d3a9752",
} as const;

export type OfficialAssetResolution =
  | { status: "CURRENT"; asset: AuthoritySourceAsset; reasons: [] }
  | { status: "OPERATOR_VERIFICATION_REQUIRED"; asset: AuthoritySourceAsset; reasons: string[] }
  | { status: "MISSING"; asset: null; reasons: string[] }
  | { status: "AMBIGUOUS"; asset: null; reasons: string[] };

/**
 * Resolves the official asset a packet may use. Only ACTIVE assets with
 * official provenance and a content hash are eligible; SUPERSEDED and
 * REVIEW_REQUIRED assets are never selected. An ACTIVE asset without an
 * operator verification date resolves to OPERATOR_VERIFICATION_REQUIRED.
 */
export function resolveOfficialAsset(
  assets: readonly AuthoritySourceAsset[] | null | undefined,
  selector: { stateCode?: string; authorityId?: string; assetType?: AuthorityAssetType; purpose?: string },
): OfficialAssetResolution {
  const assetType = selector.assetType ?? "official_form";
  const candidates = (assets ?? []).filter(
    (asset) =>
      asset.status === "ACTIVE" &&
      asset.asset_type === assetType &&
      (!selector.stateCode || asset.state_code === selector.stateCode.toUpperCase()) &&
      (!selector.authorityId || asset.authority_id === selector.authorityId) &&
      (!selector.purpose || asset.purpose === selector.purpose) &&
      isOfficialGovernmentSource(asset.official_source_url) &&
      /^[0-9a-f]{64}$/.test(asset.sha256 ?? ""),
  );
  if (candidates.length === 0) {
    return { status: "MISSING", asset: null, reasons: ["No active official asset is registered for this authority."] };
  }
  if (candidates.length > 1) {
    return { status: "AMBIGUOUS", asset: null, reasons: ["More than one active official asset matches; operator review required."] };
  }
  const asset = candidates[0];
  if (!validDate(asset.verified_at)) {
    return {
      status: "OPERATOR_VERIFICATION_REQUIRED",
      asset,
      reasons: ["The official asset has not been verified against its official source by an operator."],
    };
  }
  return { status: "CURRENT", asset, reasons: [] };
}

export const FLORIDA_SUBMISSION_NOTICE = "Florida submission eligibility requires current operator verification.";
