/**
 * Authority Pack Generator
 *
 * Generates a structured AuthorityPack from authority intelligence + workflow fallback.
 * If no verified authority exists: falls back to getWorkflowOrDerive().
 * If authority exists but confidence is below threshold: shows Verification Required.
 * Never asserts requirements as confirmed without verified source.
 */

import {
  getAuthority,
  getAuthorityDocumentRule,
  canAutoDriveReadiness,
} from "@/data/authorities";
import { getWorkflowOrDerive, getCountry } from "@/data/intelligence";
import type { AuthorityPack, CustomsAdvisory } from "@/data/authorities/types";

const ADVISORY_DISCLAIMER =
  "This information is procedural guidance only. Requirements should always be confirmed with the receiving authority. The Milano Seal is not a law firm and does not provide legal advice. International document requirements may change.";

// ── Customs advisory (advisory only — never implies customs approval) ──────────

function buildCustomsAdvisory(
  frictionScore: number,
  hasDocumentRule: boolean,
): CustomsAdvisory {
  const integrity = hasDocumentRule ? 80 : 40;
  return {
    advisory_only: true,
    pre_clearance_integrity_score: integrity,
    documentation_completeness: hasDocumentRule ? "complete" : "partial",
    authority_pack_status: hasDocumentRule ? "ready" : "verification_required",
    customs_risk_buffer:
      frictionScore >= 9 ? "elevated" : frictionScore >= 6 ? "moderate" : "low",
    corridor_friction: frictionScore,
    known_operational_delays: null,
    disclaimer: ADVISORY_DISCLAIMER,
  };
}

// ── Main pack generator ────────────────────────────────────────────────────────

export function generateAuthorityPack(
  authorityId: string,
  documentTypeSlug: string,
  countryId: string,
): AuthorityPack {
  const authority = getAuthority(authorityId);

  if (!authority) {
    // No authority record — full fallback to country workflow
    const workflow = getWorkflowOrDerive(countryId, documentTypeSlug);
    const country = getCountry(countryId);
    return {
      authority: {
        id: authorityId,
        name: "Unknown Authority",
        country: countryId,
        type: "other",
        confidence: "VERIFICATION_REQUIRED",
        friction_score: 5,
        complexity_score: 5,
        verified_at: null,
      },
      requirements: workflow
        ? {
            apostille_required: workflow.apostilleRequired,
            consular_required: !!workflow.consularLegalizationRequired,
            translation: workflow.translationRequired
              ? workflow.certifiedTranslationRequired
                ? "certified_required"
                : "required"
              : "none",
            translation_language: workflow.translationLanguage ?? null,
            witnesses: workflow.witnessRequired
              ? workflow.witnessCount === 2
                ? "two_witnesses"
                : "one_witness"
              : "none",
            ron_accepted:
              workflow.notarizationType === "ron" || workflow.notarizationType === "either",
            original_required: false,
            age_limit_months: null,
          }
        : null,
      rejection_warnings: workflow
        ? workflow.rejectionTriggers.map((rt) => ({
            trigger: rt.trigger,
            client_safe_label: rt.description,
            severity: rt.severity as "fatal" | "correctable" | "advisory",
          }))
        : [],
      source_attribution: null,
      verification_status: "VERIFICATION_REQUIRED",
      client_safe_notes:
        "Requirements for this authority have not yet been independently verified. Your coordinator will confirm requirements before execution.",
      operator_guidance:
        "No verified authority record exists. Using country-level workflow derivation. Research this authority before accepting the matter.",
      requires_qa_checklist: false,
      customs_advisory: buildCustomsAdvisory(5, false),
    };
  }

  const documentRule = getAuthorityDocumentRule(authorityId, documentTypeSlug);
  const canDrive = canAutoDriveReadiness(authority.authority_confidence);
  const isItaly = authority.country.toUpperCase() === "IT";

  // If confidence is below threshold, show Verification Required
  // but still populate structure from available (unverified) data
  const verificationStatus = authority.authority_confidence;

  const rejectionWarnings = authority.rejection_rules
    .filter((r) => r.active)
    .map((r) => ({
      trigger: r.trigger,
      client_safe_label: r.client_safe_label,
      severity: r.severity,
    }));

  const requirements = documentRule
    ? {
        apostille_required: documentRule.apostille_required,
        consular_required: documentRule.consular_required,
        translation: documentRule.translation_requirement,
        translation_language: documentRule.translation_language,
        witnesses: documentRule.witness_requirement,
        ron_accepted: documentRule.ron_accepted,
        original_required: documentRule.original_required,
        age_limit_months: documentRule.age_limit_months,
      }
    : null;

  // Client-safe notes
  const clientSafeNotes = canDrive
    ? (authority.notes_client_safe ??
        `Your document will be processed according to ${authority.authority_name} requirements.`)
    : "Requirements for this authority are under verification. Your coordinator will confirm all requirements before execution.";

  // Operator guidance
  const operatorGuidance = !canDrive
    ? `Authority confidence: ${authority.authority_confidence}. Requirements must be manually verified before advising client. Source: ${authority.source_reference ?? "none on file"}.`
    : authority.notes_operator ?? null;

  return {
    authority: {
      id: authority.id,
      name: authority.authority_name,
      country: authority.country_name,
      type: authority.authority_type,
      confidence: authority.authority_confidence,
      friction_score: authority.friction_score,
      complexity_score: authority.complexity_score,
      verified_at: authority.verified_at,
    },
    requirements,
    rejection_warnings: rejectionWarnings,
    source_attribution: authority.source_reference,
    verification_status: verificationStatus,
    client_safe_notes: clientSafeNotes,
    operator_guidance: operatorGuidance,
    requires_qa_checklist: isItaly || authority.friction_score >= 7,
    customs_advisory: buildCustomsAdvisory(authority.friction_score, !!documentRule),
  };
}

// ── Client-safe pack extract ───────────────────────────────────────────────────
// Portal receives this subset only — operator guidance and confidence math excluded.

export interface ClientSafeAuthorityPack {
  authority_name: string;
  authority_type: string;
  verification_status: string;
  requirements_summary: string | null;
  client_safe_notes: string | null;
  requires_verification: boolean;
  customs_advisory_only: boolean;
  disclaimer: string;
}

export function toClientSafeAuthorityPack(pack: AuthorityPack): ClientSafeAuthorityPack {
  const requiresVerification =
    pack.verification_status === "VERIFICATION_REQUIRED" ||
    pack.verification_status === "UNVERIFIED";

  let requirementsSummary: string | null = null;
  if (pack.requirements && !requiresVerification) {
    const parts: string[] = [];
    if (pack.requirements.apostille_required) parts.push("Apostille required");
    if (pack.requirements.consular_required) parts.push("Consular authentication required");
    if (pack.requirements.translation !== "none")
      parts.push(
        `${pack.requirements.translation_language ?? "Translation"} ${
          pack.requirements.translation === "certified_required" ? "(certified)" : "required"
        }`,
      );
    if (pack.requirements.witnesses !== "none")
      parts.push(
        pack.requirements.witnesses === "two_witnesses" ? "2 witnesses required" : "1 witness required",
      );
    if (pack.requirements.original_required) parts.push("Original document required");
    requirementsSummary = parts.join(" · ") || null;
  }

  return {
    authority_name: pack.authority.name,
    authority_type: pack.authority.type,
    verification_status: pack.verification_status,
    requirements_summary: requirementsSummary,
    client_safe_notes: pack.client_safe_notes,
    requires_verification: requiresVerification,
    customs_advisory_only: true,
    disclaimer: ADVISORY_DISCLAIMER,
  };
}
