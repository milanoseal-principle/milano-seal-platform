/**
 * Matter Intelligence Core
 *
 * Single source of truth for matter execution intelligence.
 * Consumed by portal, dashboard, alliance, and VA surfaces.
 *
 * Inputs: MatterIntelligenceInput (country, document, matter_type, + optional context)
 * Outputs: MatterIntelligenceResult (execution path, authority chain, readiness, next actions)
 *
 * Never invents data. If a field cannot be derived from real intelligence, it returns null.
 * Operator and client outputs are strictly separated.
 */

import { getWorkflowOrDerive, getCountry, getDocumentType } from "@/data/intelligence";
import { getAuthorityBySlug, canAutoDriveReadiness } from "@/data/authorities";
import { generateAuthorityPack } from "@/lib/authorityPack";
import { certifyAuthorityChain } from "@/lib/authorityChainCertification";
import type { ChainCertificationResult } from "@/lib/authorityChainCertification";
import type { AuthorityPack } from "@/data/authorities/types";

// ── Types ──────────────────────────────────────────────────────────────────────

export type MatterType =
  | "citizenship_by_descent"
  | "vital_records"
  | "power_of_attorney"
  | "corporate"
  | "real_estate"
  | "immigration"
  | "academic"
  | "employment"
  | "name_change"
  | "divorce"
  | "adoption"
  | "criminal_record"
  | "medical"
  | "general";

export interface MatterIntelligenceInput {
  country_id: string;
  document_id: string;
  matter_type: MatterType;
  receiving_authority_slug?: string | null;
  // Optional matter context (from existing deal record)
  is_paid?: boolean;
  is_notarized?: boolean;
  has_translation?: boolean;
  has_apostille?: boolean;
  has_scheduled?: boolean;
  courier_status?: string | null;
  deal_status?: string | null;
}

export interface ExecutionStep {
  step: number;
  label: string;
  client_label: string;
  status: "complete" | "pending" | "blocked" | "not_applicable";
  required: boolean;
  notes: string | null;
}

export interface RequiredItem {
  item: string;
  category: "document" | "service" | "payment" | "authority" | "coordination";
  status: "provided" | "missing" | "unknown";
  client_safe: boolean;
}

export interface MatterIntelligenceResult {
  // Core IDs
  country_id: string;
  document_id: string;
  matter_type: MatterType;
  // Country and document info
  country_name: string;
  document_name: string;
  corridor_type: "hague" | "consular" | "unknown";
  // Execution path (from workflow derivation)
  execution_path: string[];
  execution_path_client: string[];
  // Authority intelligence
  authority_name: string | null;
  authority_confidence: string | null;
  authority_chain: ChainCertificationResult | null;
  authority_pack: AuthorityPack | null;
  // Requirements
  required_items: RequiredItem[];
  missing_items: string[];
  missing_items_client: string[];
  // Translation
  translation_required: boolean;
  translation_certified: boolean;
  translation_language: string | null;
  // Witnesses
  witnesses_required: boolean;
  witness_count: number;
  // RON
  ron_available: boolean;
  // Apostille / Authentication
  apostille_required: boolean;
  consular_required: boolean;
  // Timeline
  estimated_timeline_days: number | null;
  timeline_note: string | null;
  // Next actions
  next_action_operator: string;
  next_action_client: string;
  // Risk
  rejection_risks: string[];
  requires_qa_checklist: boolean;
  // Criticality
  criticality_level: "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | "EXECUTIVE" | null;
  // Readiness
  readiness_score: number | null;
  // Derived flag
  is_derived: boolean;
  // Operator notes
  operator_summary: string;
}

// ── Client-safe subset ─────────────────────────────────────────────────────────

export interface ClientMatterIntelligence {
  country_name: string;
  document_name: string;
  execution_path: string[];
  authority_name: string | null;
  authority_status: string | null;
  translation_required: boolean;
  translation_language: string | null;
  translation_certified: boolean;
  witnesses_required: boolean;
  apostille_required: boolean;
  missing_items: string[];
  next_action: string;
  requires_coordinator_review: boolean;
  timeline_note: string | null;
  disclaimer: string;
}

// ── Disclaimer ─────────────────────────────────────────────────────────────────

const DISCLAIMER =
  "Procedural guidance only. Requirements should always be confirmed with the receiving authority. The Milano Seal is not a law firm and does not provide legal advice.";

// ── Main function ──────────────────────────────────────────────────────────────

export function computeMatterIntelligence(
  input: MatterIntelligenceInput,
): MatterIntelligenceResult {
  const country = getCountry(input.country_id);
  const doc = getDocumentType(input.document_id);

  if (!country || !doc) {
    return buildUnknownResult(input);
  }

  const workflow = getWorkflowOrDerive(input.country_id, input.document_id);
  const authority = input.receiving_authority_slug
    ? getAuthorityBySlug(input.receiving_authority_slug)
    : null;

  const authorityPack = authority
    ? generateAuthorityPack(authority.id, input.document_id, input.country_id)
    : null;

  const authorityChain = certifyAuthorityChain(
    country.isoCode,
    input.document_id,
  );

  const isHague = country.corridorType === "hague";

  // Build required items from workflow + authority pack
  const requiredItems: RequiredItem[] = [];

  // Notarization
  requiredItems.push({
    item: "Notarization",
    category: "service",
    status: input.is_notarized ? "provided" : "missing",
    client_safe: true,
  });

  // Translation
  const translationRequired = authorityPack?.requirements
    ? authorityPack.requirements.translation !== "none"
    : workflow?.translationRequired ?? false;
  const translationCertified = authorityPack?.requirements
    ? authorityPack.requirements.translation === "certified_required"
    : workflow?.certifiedTranslationRequired ?? false;
  const translationLanguage =
    authorityPack?.requirements?.translation_language ??
    workflow?.translationLanguage ??
    null;

  if (translationRequired) {
    requiredItems.push({
      item: translationCertified
        ? `Certified ${translationLanguage ?? "translation"}`
        : `${translationLanguage ?? "Translation"}`,
      category: "document",
      status: input.has_translation ? "provided" : "missing",
      client_safe: true,
    });
  }

  // Apostille
  const apostilleRequired =
    authorityPack?.requirements?.apostille_required ??
    workflow?.apostilleRequired ??
    isHague;
  if (apostilleRequired) {
    requiredItems.push({
      item: "Apostille",
      category: "authority",
      status: input.has_apostille ? "provided" : "missing",
      client_safe: true,
    });
  }

  // Witnesses
  const witnessesRequired = authorityPack?.requirements
    ? authorityPack.requirements.witnesses !== "none"
    : workflow?.witnessRequired ?? false;
  const witnessCount =
    authorityPack?.requirements?.witnesses === "two_witnesses"
      ? 2
      : authorityPack?.requirements?.witnesses === "one_witness"
        ? 1
        : workflow?.witnessCount ?? 0;

  if (witnessesRequired) {
    requiredItems.push({
      item: `${witnessCount} witness${witnessCount > 1 ? "es" : ""}`,
      category: "service",
      status: "unknown",
      client_safe: true,
    });
  }

  // Payment
  requiredItems.push({
    item: "Payment",
    category: "payment",
    status: input.is_paid ? "provided" : "missing",
    client_safe: true,
  });

  // Scheduling
  requiredItems.push({
    item: "Notarization appointment",
    category: "coordination",
    status: input.has_scheduled ? "provided" : "missing",
    client_safe: true,
  });

  const missingItems = requiredItems
    .filter((r) => r.status === "missing")
    .map((r) => r.item);

  const missingItemsClient = requiredItems
    .filter((r) => r.status === "missing" && r.client_safe)
    .map((r) => r.item);

  // Execution path
  const executionPath = workflow?.executionPath ?? [
    "Document execution appointment scheduled",
    "Notarization completed",
    ...(apostilleRequired ? ["Apostille obtained"] : []),
    ...(translationRequired ? ["Certified translation completed"] : []),
    "Document package released to client",
  ];

  const executionPathClient = executionPath;

  // Next actions
  const nextActionOperator = deriveOperatorNextAction(input, missingItems, authorityPack);
  const nextActionClient = deriveClientNextAction(input, missingItemsClient);

  // Rejection risks (operator only)
  const rejectionRisks: string[] = [];
  if (authorityPack?.rejection_warnings) {
    for (const w of authorityPack.rejection_warnings) {
      rejectionRisks.push(w.client_safe_label);
    }
  }
  if (workflow?.rejectionTriggers) {
    for (const rt of workflow.rejectionTriggers) {
      if (rt.severity === "fatal") rejectionRisks.push(rt.description);
    }
  }

  // Timeline
  const estimatedTimeline = deriveTimeline(input);

  // Operator summary
  const authorityConfidenceLabel = authority?.authority_confidence ?? null;
  const isDerived =
    !authority || !canAutoDriveReadiness(authority.authority_confidence);
  const chainStatus = authorityChain?.status ?? "NO_CHAIN";

  const operatorSummary = [
    `${doc.name} for ${country.name}.`,
    authority
      ? `Authority: ${authority.authority_name} (${authorityConfidenceLabel}).`
      : "No specific authority identified — using country-level workflow derivation.",
    `Chain status: ${chainStatus}.`,
    missingItems.length > 0
      ? `Missing: ${missingItems.join(", ")}.`
      : "All tracked items provided.",
    isDerived
      ? "Requirements are derived — not authority-verified."
      : "Requirements sourced from verified authority record.",
  ].join(" ");

  return {
    country_id: input.country_id,
    document_id: input.document_id,
    matter_type: input.matter_type,
    country_name: country.name,
    document_name: doc.name,
    corridor_type:
      country.corridorType === "hague"
        ? "hague"
        : country.corridorType === "consular"
          ? "consular"
          : "unknown",
    execution_path: executionPath,
    execution_path_client: executionPathClient,
    authority_name: authority?.authority_name ?? null,
    authority_confidence: authorityConfidenceLabel,
    authority_chain: authorityChain,
    authority_pack: authorityPack,
    required_items: requiredItems,
    missing_items: missingItems,
    missing_items_client: missingItemsClient,
    translation_required: translationRequired,
    translation_certified: translationCertified,
    translation_language: translationLanguage,
    witnesses_required: witnessesRequired,
    witness_count: witnessCount,
    ron_available:
      workflow?.notarizationType === "ron" ||
      workflow?.notarizationType === "either",
    apostille_required: apostilleRequired,
    consular_required:
      authorityPack?.requirements?.consular_required ??
      workflow?.consularLegalizationRequired ??
      !isHague,
    estimated_timeline_days: estimatedTimeline,
    timeline_note: isDerived
      ? "Timeline estimate based on country-level derivation."
      : null,
    next_action_operator: nextActionOperator,
    next_action_client: nextActionClient,
    rejection_risks: rejectionRisks,
    requires_qa_checklist:
      authorityPack?.requires_qa_checklist ??
      country.isoCode.toUpperCase() === "IT",
    criticality_level: null,
    readiness_score: null,
    is_derived: isDerived,
    operator_summary: operatorSummary,
  };
}

// ── Helper: operator next action ───────────────────────────────────────────────

function deriveOperatorNextAction(
  input: MatterIntelligenceInput,
  missingItems: string[],
  pack: AuthorityPack | null,
): string {
  if (!input.is_paid)
    return "Send payment link to client. Do not schedule until payment confirmed.";
  if (!input.has_scheduled) return "Schedule notarization appointment.";
  if (!input.is_notarized)
    return "Complete notarization. Confirm all signatories are present.";
  if (
    pack &&
    !canAutoDriveReadiness(
      pack.verification_status as Parameters<typeof canAutoDriveReadiness>[0],
    )
  ) {
    return "Confirm authority requirements with receiving authority before proceeding.";
  }
  if (!input.has_apostille) return "Submit for apostille processing.";
  if (
    !input.has_translation &&
    missingItems.some((m) => m.toLowerCase().includes("translation"))
  ) {
    return "Send document for certified translation.";
  }
  if (input.courier_status === null || input.courier_status === undefined) {
    return "Create shipping label and coordinate delivery.";
  }
  return "Monitor delivery. Confirm receipt with client.";
}

// ── Helper: client next action ─────────────────────────────────────────────────

function deriveClientNextAction(
  input: MatterIntelligenceInput,
  missingItems: string[],
): string {
  if (!input.is_paid) return "Complete payment to begin execution.";
  if (!input.has_scheduled)
    return "Your coordinator will contact you to schedule your appointment.";
  if (!input.is_notarized)
    return "Attend your scheduled notarization appointment.";
  if (missingItems.length === 0)
    return "Your document package is in progress. Your coordinator will update you at each step.";
  return "Your coordinator is processing your document package.";
}

// ── Helper: timeline derivation ────────────────────────────────────────────────
// Only returns real estimates based on known corridor data.
// No invented numbers.

function deriveTimeline(input: MatterIntelligenceInput): number | null {
  const country = getCountry(input.country_id);
  if (!country) return null;

  const iso = country.isoCode.toUpperCase();
  if (iso === "IT") return 28; // ~4 weeks — conservative; Prefettura typically 3–5 business days but overall ~4 weeks
  if (iso === "MX") return 21; // ~3 weeks
  if (iso === "PT") return 18; // ~2.5 weeks
  return null; // insufficient data for other corridors
}

// ── Fallback for unknown corridor ─────────────────────────────────────────────

function buildUnknownResult(
  input: MatterIntelligenceInput,
): MatterIntelligenceResult {
  return {
    country_id: input.country_id,
    document_id: input.document_id,
    matter_type: input.matter_type,
    country_name: input.country_id,
    document_name: input.document_id,
    corridor_type: "unknown",
    execution_path: [],
    execution_path_client: [],
    authority_name: null,
    authority_confidence: null,
    authority_chain: null,
    authority_pack: null,
    required_items: [],
    missing_items: [],
    missing_items_client: [],
    translation_required: false,
    translation_certified: false,
    translation_language: null,
    witnesses_required: false,
    witness_count: 0,
    ron_available: false,
    apostille_required: false,
    consular_required: false,
    estimated_timeline_days: null,
    timeline_note: null,
    next_action_operator: "Research this corridor before advising client.",
    next_action_client: "Your coordinator will confirm requirements.",
    rejection_risks: [],
    requires_qa_checklist: false,
    criticality_level: null,
    readiness_score: null,
    is_derived: true,
    operator_summary: `Unknown corridor: ${input.country_id} / ${input.document_id}. Manual research required.`,
  };
}

// ── Client-safe extract ────────────────────────────────────────────────────────

export function toClientMatterIntelligence(
  result: MatterIntelligenceResult,
): ClientMatterIntelligence {
  const authorityVerified =
    result.authority_confidence === "AUTHORITY_VERIFIED" ||
    result.authority_confidence === "MULTI_SOURCE_CONFIRMED";

  return {
    country_name: result.country_name,
    document_name: result.document_name,
    execution_path: result.execution_path_client,
    authority_name: result.authority_name,
    authority_status: result.authority_name
      ? authorityVerified
        ? "Requirements confirmed"
        : "Verification in progress"
      : null,
    translation_required: result.translation_required,
    translation_language: result.translation_language,
    translation_certified: result.translation_certified,
    witnesses_required: result.witnesses_required,
    apostille_required: result.apostille_required,
    missing_items: result.missing_items_client,
    next_action: result.next_action_client,
    requires_coordinator_review: result.is_derived || !authorityVerified,
    timeline_note: result.timeline_note,
    disclaimer: DISCLAIMER,
  };
}
