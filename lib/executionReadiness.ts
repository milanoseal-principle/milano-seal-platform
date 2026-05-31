/**
 * Execution Readiness Engine
 *
 * Computes structured readiness for a matter given its workflow requirements
 * and current state. This is the single source of truth consumed by:
 * - Dashboard (full detail, operator view)
 * - Portal (client-safe subset)
 * - VA tasks (checklist view)
 * - Alliance (corridor summary only)
 */

import { getWorkflowOrDerive, getCountry, getDocumentType } from "@/data/intelligence";
import type { Workflow } from "@/data/intelligence";

// ── Types ────────────────────────────────────────────────────────────────────

export type ReadinessCategory =
  | "payment"
  | "scheduling"
  | "notarization"
  | "translation"
  | "witness"
  | "apostille"
  | "consular"
  | "courier"
  | "document";

export type ReadinessStatus = "complete" | "pending" | "not-required" | "unknown";

export interface ReadinessItem {
  id: string;
  label: string;
  category: ReadinessCategory;
  status: ReadinessStatus;
  required: boolean;
  note?: string;
  weight: number; // contribution to score (0–100 total across all required items)
}

export interface RejectionRisk {
  trigger: string;
  description: string;
  severity: "fatal" | "correctable";
}

// ── Authority confidence levels (Trust Core) ──────────────────────────────────

export type AuthorityConfidence =
  | "AUTHORITY_VERIFIED"
  | "MULTI_SOURCE_CONFIRMED"
  | "PARTNER_CONFIRMED"
  | "OBSERVED"
  | "UNVERIFIED"
  | "VERIFICATION_REQUIRED";

export interface ReadinessResult {
  score: number;                      // 0–100
  riskLevel: "low" | "medium" | "high";
  executionReady: boolean;            // score >= 60 and no fatal blockers
  items: ReadinessItem[];
  missing: ReadinessItem[];           // required items not yet complete
  fatalBlockers: ReadinessItem[];     // subset of missing where fatal risk exists
  timeline: string;
  ronEligible: boolean;
  witnessRequired: boolean;
  witnessCount: number;
  translationRequired: boolean;
  translationLanguage: string | null;
  certifiedTranslationRequired: boolean;
  apostilleRequired: boolean;
  consularRequired: boolean;
  executionPath: string[];
  rejectionRisks: RejectionRisk[];
  corridorLabel: "Certified Corridor" | "Standard Corridor" | "Authority-Verified Corridor";
  isDerived: boolean;
  countryName: string;
  documentName: string;
  lastReviewed: string;
  // Trust Core
  verificationStatus: AuthorityConfidence;
  authoritySource: string | null;
  requirementSource: string | null;
  clientSafeReason: string | null;
}

// ── Matter state interface (minimal — no internal fields) ────────────────────

export interface MatterState {
  matter_status?: string | null;
  payment_status?: string | null;
  is_paid_and_released?: boolean;
  client_name?: string | null;
  destination_country?: string | null;
  document_type?: string | null;
}

// ── Status ordering ──────────────────────────────────────────────────────────

const STATUS_ORDER = [
  "new",
  "intake_received",
  "under_review",
  "compliance_review",
  "quoted",
  "awaiting_payment",
  "payment_confirmed",
  "scheduled",
  "in_execution",
  "apostille_processing",
  "courier_ready",
  "shipped",
  "delivered",
  "completed",
  "closed",
];

function statusGte(current: string | null | undefined, threshold: string): boolean {
  const ci = STATUS_ORDER.indexOf(current ?? "");
  const ti = STATUS_ORDER.indexOf(threshold);
  if (ci < 0 || ti < 0) return false;
  return ci >= ti;
}

function isPaid(matter: MatterState): boolean {
  return (
    matter.payment_status === "paid" ||
    matter.payment_status === "confirmed" ||
    matter.payment_status === "payment_confirmed" ||
    matter.matter_status === "payment_confirmed" ||
    !!matter.is_paid_and_released
  );
}

// ── Slug normalization ───────────────────────────────────────────────────────

export function toSlug(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/\s*[/&]\s*/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Core engine ──────────────────────────────────────────────────────────────

export function computeExecutionReadiness(
  countryId: string,
  documentId: string,
  matter?: MatterState,
): ReadinessResult {
  const workflow = getWorkflowOrDerive(countryId, documentId);
  const countryData = getCountry(countryId);
  const docData = getDocumentType(documentId);

  const countryName = countryData?.name ?? countryId.replace(/-/g, " ");
  const documentName = docData?.name ?? documentId.replace(/-/g, " ");

  // If neither country nor document found, return minimal unknown result
  if (!workflow) {
    return unknownCorridorResult(countryName, documentName);
  }

  const s = matter?.matter_status ?? null;
  const paid = matter ? isPaid(matter) : false;

  // ── Build items ────────────────────────────────────────────────────────────

  const items: ReadinessItem[] = [];

  // 1. Payment (always required)
  items.push({
    id: "payment",
    label: "Payment Confirmed",
    category: "payment",
    required: true,
    weight: 20,
    status: paid ? "complete" : matter ? "pending" : "unknown",
    note: paid ? undefined : "Required before scheduling and execution.",
  });

  // 2. Scheduling
  const scheduled = statusGte(s, "scheduled");
  items.push({
    id: "scheduling",
    label: "Execution Session Scheduled",
    category: "scheduling",
    required: true,
    weight: 10,
    status: scheduled ? "complete" : matter ? "pending" : "unknown",
    note: scheduled ? undefined : "Unlocked after payment confirmation.",
  });

  // 3. Notarization
  if (workflow.notarizationRequired) {
    const notarized = statusGte(s, "apostille_processing");
    const ronEligible =
      workflow.notarizationType === "ron" || workflow.notarizationType === "either";
    items.push({
      id: "notarization",
      label: `Notarization / Execution${ronEligible ? " (RON Eligible)" : " (In-Person)"}`,
      category: "notarization",
      required: true,
      weight: 20,
      status: notarized ? "complete" : matter ? "pending" : "unknown",
      note: ronEligible
        ? "Eligible for Remote Online Notarization (RON) via Florida-commissioned notary."
        : "In-person notarization required for this document type.",
    });
  }

  // 4. Witnesses
  if (workflow.witnessRequired) {
    const notarized = statusGte(s, "apostille_processing");
    items.push({
      id: "witnesses",
      label: `${workflow.witnessCount ?? 1} Witness${(workflow.witnessCount ?? 1) > 1 ? "es" : ""} Required`,
      category: "witness",
      required: true,
      weight: 10,
      status: notarized ? "complete" : matter ? "pending" : "unknown",
      note: `${workflow.witnessCount ?? 1} witness${(workflow.witnessCount ?? 1) > 1 ? "es" : ""} must be present at the notarization appointment. Witnesses may not be related to the principal.`,
    });
  }

  // 5. Translation
  if (workflow.translationRequired) {
    const shipped = statusGte(s, "shipped");
    items.push({
      id: "translation",
      label: `${workflow.translationLanguage} Translation${workflow.certifiedTranslationRequired ? " (Certified)" : ""}`,
      category: "translation",
      required: true,
      weight: 15,
      status: shipped ? "complete" : matter ? "pending" : "unknown",
      note: workflow.certifiedTranslationRequired
        ? `Certified ${workflow.translationLanguage} translation by a sworn translator required. Machine translations are not accepted.`
        : `${workflow.translationLanguage} translation required.`,
    });
  }

  // 6. Apostille
  if (workflow.apostilleRequired) {
    const apostilled = statusGte(s, "courier_ready");
    items.push({
      id: "apostille",
      label: `Apostille — ${workflow.apostilleAuthority ?? "Florida Department of State"}`,
      category: "apostille",
      required: true,
      weight: 15,
      status: apostilled ? "complete" : matter ? "pending" : "unknown",
      note: "Apostille issued by the Florida Department of State authenticates the notary's commission for Hague Convention member countries.",
    });
  }

  // 7. Consular legalization
  if (workflow.consularLegalizationRequired) {
    const shipped = statusGte(s, "shipped");
    items.push({
      id: "consular",
      label: `Consular Legalization — ${countryName} Embassy`,
      category: "consular",
      required: true,
      weight: 15,
      status: shipped ? "complete" : matter ? "pending" : "unknown",
      note: `${countryName} is not a Hague Convention member. Full legalization chain required: FL Dept of State → US Dept of State → ${countryName} Embassy attestation.`,
    });
  }

  // 8. Courier release
  const courierReleased = statusGte(s, "shipped");
  items.push({
    id: "courier",
    label: "Released to Courier",
    category: "courier",
    required: true,
    weight: 10,
    status: courierReleased
      ? "complete"
      : matter
      ? "pending"
      : "unknown",
    note: courierReleased ? undefined : "Document released to international courier after apostille/legalization completion.",
  });

  // ── Score computation ──────────────────────────────────────────────────────

  const requiredItems = items.filter((i) => i.required);
  const totalWeight = requiredItems.reduce((sum, i) => sum + i.weight, 0);
  const earnedWeight = requiredItems
    .filter((i) => i.status === "complete")
    .reduce((sum, i) => sum + i.weight, 0);
  const score =
    totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  const missing = requiredItems.filter((i) => i.status !== "complete" && i.status !== "not-required");
  const fatalBlockers = missing.filter((i) => i.category === "payment");

  const riskLevel: "low" | "medium" | "high" =
    fatalBlockers.length > 0
      ? "high"
      : score < 40
      ? "high"
      : score < 70
      ? "medium"
      : "low";

  const executionReady = score >= 60 && fatalBlockers.length === 0;

  const rejectionRisks: RejectionRisk[] = workflow.rejectionTriggers.map((rt) => ({
    trigger: rt.trigger,
    description: rt.description,
    severity: rt.severity,
  }));

  // Trust Core: derive verification status and source from workflow metadata
  const verificationStatus: AuthorityConfidence = workflow.isDerived
    ? "OBSERVED"
    : workflow.sourceReference
    ? "MULTI_SOURCE_CONFIRMED"
    : "PARTNER_CONFIRMED";

  const authoritySource = workflow.isDerived
    ? null
    : (workflow.apostilleAuthority ?? "Florida Department of State");

  const requirementSource = workflow.sourceReference ?? null;

  const clientSafeReason = workflow.isDerived
    ? `This corridor follows standard ${countryName} authentication requirements for ${documentName}.`
    : `Requirements are based on ${workflow.routeType} standards reviewed ${workflow.lastReviewed}.`;

  return {
    score,
    riskLevel,
    executionReady,
    items,
    missing,
    fatalBlockers,
    timeline: workflow.estimatedTimeline,
    ronEligible:
      workflow.notarizationRequired &&
      (workflow.notarizationType === "ron" || workflow.notarizationType === "either"),
    witnessRequired: workflow.witnessRequired,
    witnessCount: workflow.witnessCount ?? 0,
    translationRequired: workflow.translationRequired,
    translationLanguage: workflow.translationLanguage ?? null,
    certifiedTranslationRequired: workflow.certifiedTranslationRequired ?? false,
    apostilleRequired: workflow.apostilleRequired,
    consularRequired: !!workflow.consularLegalizationRequired,
    executionPath: workflow.executionPath,
    rejectionRisks,
    corridorLabel: workflow.isDerived ? "Standard Corridor" : "Certified Corridor",
    isDerived: workflow.isDerived ?? false,
    countryName,
    documentName,
    lastReviewed: workflow.lastReviewed,
    verificationStatus,
    authoritySource,
    requirementSource,
    clientSafeReason,
  };
}

// ── Convenience: compute from matter fields directly ─────────────────────────

export function computeReadinessFromMatter(matter: MatterState): ReadinessResult | null {
  const countryId = toSlug(matter.destination_country);
  const documentId = toSlug(matter.document_type);
  if (!countryId || !documentId) return null;
  return computeExecutionReadiness(countryId, documentId, matter);
}

// ── Client-safe summary (portal, VA) ─────────────────────────────────────────

export interface ClientReadinessSummary {
  score: number;
  riskLevel: "low" | "medium" | "high";
  executionReady: boolean;
  timeline: string;
  requiredItems: string[];        // labels only, no internal notes
  missingItems: string[];         // labels only, client-safe
  ronEligible: boolean;
  witnessRequired: boolean;
  translationRequired: boolean;
  translationLanguage: string | null;
  apostilleRequired: boolean;
  // No: rejectionRisks, corridorLabel, isDerived, lastReviewed, consularRequired details
}

export function toClientSummary(result: ReadinessResult): ClientReadinessSummary {
  return {
    score: result.score,
    riskLevel: result.riskLevel,
    executionReady: result.executionReady,
    timeline: result.timeline,
    requiredItems: result.items.filter((i) => i.required).map((i) => i.label),
    missingItems: result.missing.map((i) => i.label),
    ronEligible: result.ronEligible,
    witnessRequired: result.witnessRequired,
    translationRequired: result.translationRequired,
    translationLanguage: result.translationLanguage,
    apostilleRequired: result.apostilleRequired,
  };
}

// ── Fallback for unknown corridor ─────────────────────────────────────────────

function unknownCorridorResult(countryName: string, documentName: string): ReadinessResult {
  return {
    score: 0,
    riskLevel: "high",
    executionReady: false,
    items: [],
    missing: [],
    fatalBlockers: [],
    timeline: "To be determined",
    ronEligible: false,
    witnessRequired: false,
    witnessCount: 0,
    translationRequired: false,
    translationLanguage: null,
    certifiedTranslationRequired: false,
    apostilleRequired: false,
    consularRequired: false,
    executionPath: [],
    rejectionRisks: [],
    corridorLabel: "Standard Corridor",
    isDerived: true,
    countryName,
    documentName,
    lastReviewed: new Date().toISOString().slice(0, 10),
    verificationStatus: "VERIFICATION_REQUIRED",
    authoritySource: null,
    requirementSource: null,
    clientSafeReason: "This corridor has not yet been mapped. Your coordinator will review requirements before execution.",
  };
}
