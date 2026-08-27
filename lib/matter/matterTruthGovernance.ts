import { evaluateRonEligibility, evaluateTranslationGovernance, evaluateWitnessGovernance, evaluateDocumentMedium, type RonEligibilityInput, type TranslationGovernance, type WitnessGovernance, type DocumentMediumGovernance } from "@/lib/international-execution/operationalGovernance";

export type EvidenceState = "VERIFIED" | "INCOMPLETE" | "BLOCKED" | "REVIEW_REQUIRED" | "STALE";
export type CompletenessState = "COMPLETE" | "INCOMPLETE" | "BLOCKED" | "REVIEW_REQUIRED" | "STALE_EVIDENCE";
export type TruthDomain = "identity" | "documents" | "signers" | "execution" | "witnesses" | "translation" | "authority" | "payment" | "scheduling" | "custody" | "courier" | "delivery" | "release";

export interface MatterTruthSection {
  id: TruthDomain | "pricing" | "discount" | "completion" | "receiving_authority" | "notarial_act" | "destination";
  label: string;
  state: EvidenceState;
  source: string;
  lastUpdated?: string | null;
  owner: string;
  evidence: string[];
  blocker?: string;
  nextAction?: string;
  href?: string;
}

export interface MatterTruthInput {
  matterId: string;
  clientName?: string | null;
  destinationCountry?: string | null;
  documentType?: string | null;
  originState?: string | null;
  executionMethod?: string | null;
  notarialAct?: string | null;
  authorityStatus?: "verified" | "review_required" | "stale" | "unknown";
  competentAuthority?: string | null;
  receivingAuthorityKnown?: boolean | null;
  paymentStatus?: string | null;
  paymentSettlementStatus?: string | null;
  amountDue?: number | null;
  amountPaid?: number | null;
  wiseReference?: string | null;
  scheduledAt?: string | null;
  executionCompletedAt?: string | null;
  apostilleStatus?: string | null;
  custodyVerified?: boolean | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  deliveryStatus?: string | null;
  deliveryTimestamp?: string | null;
  releaseVerified?: boolean | null;
  completedAt?: string | null;
  ron?: RonEligibilityInput;
  witnesses?: WitnessGovernance;
  translation?: TranslationGovernance;
  documentMedium?: DocumentMediumGovernance;
  updatedAt?: string | null;
  partnerComplianceCurrent?: boolean | null;
}

export type DiscrepancySeverity = "INFO" | "WARNING" | "BLOCKING" | "CRITICAL";
export interface MatterDiscrepancy {
  id: string;
  matterId: string;
  class: string;
  severity: DiscrepancySeverity;
  sourceA: string;
  sourceB: string;
  description: string;
  blocker: string;
  requiredAction: string;
  owner: string;
  createdAt: string;
  resolvedAt?: string;
}

function nowIso() { return new Date().toISOString(); }
function normalizedPayment(value?: string | null) { return value?.trim().toLowerCase() ?? "unknown"; }
function paymentVerified(input: MatterTruthInput) {
  const status = normalizedPayment(input.paymentStatus);
  const settlement = normalizedPayment(input.paymentSettlementStatus);
  return status === "paid" || status === "confirmed" || status === "payment_confirmed" || settlement === "settled" || settlement === "confirmed";
}

export function buildMatterTruthSections(input: MatterTruthInput): MatterTruthSection[] {
  const ron = input.ron ? evaluateRonEligibility(input.ron) : null;
  const witness = input.witnesses ? evaluateWitnessGovernance(input.witnesses) : null;
  const translation = input.translation ? evaluateTranslationGovernance(input.translation) : null;
  const medium = input.documentMedium ? evaluateDocumentMedium(input.documentMedium) : null;
  const paid = paymentVerified(input);

  const mapSimple = (ok: boolean, unresolved = false): EvidenceState => ok ? "VERIFIED" : unresolved ? "REVIEW_REQUIRED" : "INCOMPLETE";
  const mapGate = (state: string | null): EvidenceState => {
    if (!state) return "INCOMPLETE";
    if (["READY", "ELIGIBLE", "NOT_REQUIRED"].includes(state)) return "VERIFIED";
    if (["BLOCKED", "INELIGIBLE", "DISQUALIFIED"].includes(state)) return "BLOCKED";
    if (state === "REVIEW_REQUIRED") return "REVIEW_REQUIRED";
    return "INCOMPLETE";
  };

  return [
    { id: "identity", label: "Client / Matter Identity", state: mapSimple(Boolean(input.matterId && input.clientName)), source: "Canonical Matter", owner: "Operator", evidence: [input.matterId, input.clientName ?? "client unresolved"], href: `/dashboard/deals/${encodeURIComponent(input.matterId)}` },
    { id: "documents", label: "Document Facts", state: mapSimple(Boolean(input.documentType && input.originState), !input.documentType), source: "Canonical Matter + document evidence", owner: "Operator", evidence: [input.documentType ?? "document type unresolved", input.originState ?? "origin unresolved"] },
    { id: "destination", label: "Destination", state: mapSimple(Boolean(input.destinationCountry)), source: "Canonical Matter", owner: "Operator", evidence: [input.destinationCountry ?? "destination unresolved"] },
    { id: "receiving_authority", label: "Receiving Authority", state: input.receivingAuthorityKnown === true ? "VERIFIED" : "REVIEW_REQUIRED", source: "Receiving-authority evidence", owner: "Operator", evidence: [input.receivingAuthorityKnown === true ? "requirements captured" : "requirements unresolved"] },
    { id: "execution", label: "Execution Method / RON", state: ron ? mapGate(ron.state) : mapSimple(Boolean(input.executionMethod), true), source: "Execution truth", owner: "Operator", evidence: [input.executionMethod ?? "execution method unresolved", ...(ron?.reasons ?? [])] },
    { id: "notarial_act", label: "Notarial Act", state: mapSimple(Boolean(input.notarialAct), true), source: "Execution truth", owner: "Operator", evidence: [input.notarialAct ?? "notarial act unresolved"] },
    { id: "witnesses", label: "Witness Governance", state: mapGate(witness), source: "Execution truth", owner: "Operator", evidence: [witness ?? "witness requirement not loaded"] },
    { id: "translation", label: "Translation", state: mapGate(translation), source: "Translation evidence", owner: "Operator", evidence: [translation ?? "translation requirement not loaded"] },
    { id: "documents", label: "Original / Copy", state: mapGate(medium), source: "Document-medium evidence", owner: "Operator", evidence: [medium ?? "copy/original requirement not loaded"] },
    { id: "authority", label: "Apostille / Authentication Authority", state: input.authorityStatus === "verified" && input.competentAuthority ? "VERIFIED" : input.authorityStatus === "stale" ? "STALE" : "REVIEW_REQUIRED", source: "Authority evidence registry", owner: "CTO / Operator", evidence: [input.competentAuthority ?? "competent authority unresolved", input.authorityStatus ?? "authority status unknown"], href: "/dashboard/compliance-atlas" },
    { id: "pricing", label: "Pricing", state: input.amountDue != null ? "VERIFIED" : "INCOMPLETE", source: "Canonical pricing engine", owner: "Platform", evidence: [input.amountDue != null ? `amount due ${input.amountDue}` : "amount due unresolved"] },
    { id: "payment", label: "Wise Payment", state: paid && input.wiseReference ? "VERIFIED" : paid ? "REVIEW_REQUIRED" : "INCOMPLETE", source: "Wise settlement evidence", owner: "Platform", evidence: [input.paymentStatus ?? "payment unknown", input.wiseReference ?? "Wise reference missing"], href: "/dashboard/payments" },
    { id: "scheduling", label: "Scheduling", state: input.scheduledAt ? (paid ? "VERIFIED" : "BLOCKED") : "INCOMPLETE", source: "Canonical scheduling gate", owner: "Operator", evidence: [input.scheduledAt ?? "not scheduled"] },
    { id: "custody", label: "Custody", state: input.custodyVerified === true ? "VERIFIED" : "INCOMPLETE", source: "Custody evidence", owner: "Operator", evidence: [input.custodyVerified === true ? "custody verified" : "custody evidence incomplete"] },
    { id: "courier", label: "Courier", state: input.trackingNumber && input.carrier ? "VERIFIED" : "INCOMPLETE", source: "Carrier/courier evidence", owner: "Operator", evidence: [input.carrier ?? "carrier missing", input.trackingNumber ?? "tracking missing"] },
    { id: "delivery", label: "Delivery", state: input.deliveryTimestamp ? "VERIFIED" : input.deliveryStatus?.toLowerCase() === "delivered" ? "REVIEW_REQUIRED" : "INCOMPLETE", source: "Carrier/provider delivery evidence", owner: "Operator", evidence: [input.deliveryStatus ?? "delivery status unknown", input.deliveryTimestamp ?? "delivery timestamp missing"] },
    { id: "release", label: "Release", state: input.releaseVerified === true && paid && input.custodyVerified === true ? "VERIFIED" : input.releaseVerified === true ? "BLOCKED" : "INCOMPLETE", source: "Governed release evidence", owner: "Operator", evidence: [input.releaseVerified === true ? "release marked verified" : "release not verified"] },
    { id: "completion", label: "Completion", state: input.completedAt && input.deliveryTimestamp && input.releaseVerified === true ? "VERIFIED" : input.completedAt ? "BLOCKED" : "INCOMPLETE", source: "Canonical Matter state + completion evidence", owner: "Operator", evidence: [input.completedAt ?? "Matter not completed"] },
  ];
}

export function findMatterDiscrepancies(input: MatterTruthInput): MatterDiscrepancy[] {
  const rows: Omit<MatterDiscrepancy, "id" | "matterId" | "createdAt">[] = [];
  const add = (value: Omit<MatterDiscrepancy, "id" | "matterId" | "createdAt">) => rows.push(value);
  const ron = input.ron ? evaluateRonEligibility(input.ron) : null;
  if (input.executionMethod === "ron" && !input.ron?.signerLocation) add({ class: "ron_signer_jurisdiction_missing", severity: "BLOCKING", sourceA: "execution_method", sourceB: "signer_location", description: "RON is selected but signer jurisdiction is missing.", blocker: "RON eligibility cannot be proven.", requiredAction: "Resolve signer location and rerun RON eligibility.", owner: "Operator" });
  if (input.executionMethod === "ron" && (input.ron?.wetInkRequirement === true || ron?.state === "INELIGIBLE")) add({ class: "ron_wet_ink_conflict", severity: "CRITICAL", sourceA: "execution_method", sourceB: "receiving_authority", description: "RON conflicts with a wet-ink/original execution requirement.", blocker: "Remote execution is not eligible.", requiredAction: "Move to governed in-person/mobile review.", owner: "Operator" });
  if (input.apostilleStatus === "state_apostille" && input.originState?.toLowerCase() === "federal") add({ class: "state_apostille_federal_origin", severity: "CRITICAL", sourceA: "apostille_route", sourceB: "document_origin", description: "State apostille routing conflicts with federal document origin.", blocker: "Wrong competent authority path.", requiredAction: "Route to federal authentication review.", owner: "CTO" });
  if (input.apostilleStatus === "state_apostille" && input.authorityStatus !== "verified") add({ class: "apostille_authority_unresolved", severity: "BLOCKING", sourceA: "apostille_route", sourceB: "authority_evidence", description: "Apostille route is selected while authority applicability is unresolved.", blocker: "Competent authority/Hague applicability is not verified.", requiredAction: "Verify Matter-specific authority evidence.", owner: "Operator" });
  if (input.authorityStatus === "verified" && !input.competentAuthority) add({ class: "competent_authority_missing", severity: "BLOCKING", sourceA: "authority_status", sourceB: "competent_authority", description: "Authority is marked verified without a competent authority reference.", blocker: "Routing evidence is incomplete.", requiredAction: "Attach competent authority evidence.", owner: "CTO" });
  if (input.translation?.completedAt && !input.translation.translatedDocumentRef) add({ class: "translation_file_missing", severity: "BLOCKING", sourceA: "translation_completed", sourceB: "translated_document", description: "Translation is marked complete without translated-document evidence.", blocker: "Translation completion is unsupported.", requiredAction: "Attach translated file evidence or correct status.", owner: "Operator" });
  if (input.translation?.certifiedTranslationRequired === true && input.translation.completedAt && !input.translation.certificationEvidenceRef) add({ class: "translation_certification_missing", severity: "BLOCKING", sourceA: "certified_translation", sourceB: "certification_evidence", description: "Certified translation is required but certification evidence is missing.", blocker: "Certified translation is incomplete.", requiredAction: "Attach certification evidence.", owner: "Operator" });
  if (paymentVerified(input) && input.amountDue != null && input.amountPaid != null && Math.abs(input.amountDue - input.amountPaid) > 0.009) add({ class: "payment_amount_mismatch", severity: "CRITICAL", sourceA: "invoice_amount", sourceB: "Wise_settlement", description: "Settled amount does not equal the canonical amount due.", blocker: "Payment reconciliation is contradictory.", requiredAction: "Review Wise transaction and canonical invoice snapshot.", owner: "Platform" });
  if (input.scheduledAt && !paymentVerified(input)) add({ class: "scheduled_without_payment", severity: "CRITICAL", sourceA: "scheduling", sourceB: "payment", description: "Matter is scheduled without verified payment evidence.", blocker: "Payment-before-scheduling gate violated.", requiredAction: "Block progression and reconcile payment/schedule state.", owner: "Operator" });
  if (input.deliveryStatus?.toLowerCase() === "delivered" && !input.deliveryTimestamp) add({ class: "delivery_evidence_missing", severity: "BLOCKING", sourceA: "delivery_status", sourceB: "delivery_evidence", description: "Delivery is marked complete without delivered timestamp/evidence.", blocker: "Delivery truth is unsupported.", requiredAction: "Attach carrier/provider delivery evidence.", owner: "Operator" });
  if (input.releaseVerified === true && input.custodyVerified !== true) add({ class: "release_without_custody", severity: "CRITICAL", sourceA: "release", sourceB: "custody", description: "Release is marked verified before custody evidence is complete.", blocker: "Release gate violated.", requiredAction: "Restore release block until custody evidence is verified.", owner: "Operator" });
  if (input.completedAt && (!input.deliveryTimestamp || input.releaseVerified !== true)) add({ class: "completion_truth_conflict", severity: "CRITICAL", sourceA: "completion", sourceB: "delivery_release", description: "Matter is completed while delivery/release evidence is incomplete.", blocker: "Completion truth conflicts with required closeout evidence.", requiredAction: "Reconcile closeout evidence before certification.", owner: "Operator" });
  if (input.partnerComplianceCurrent === false) add({ class: "partner_compliance_expired", severity: "BLOCKING", sourceA: "partner_assignment", sourceB: "partner_compliance", description: "Assigned execution partner has expired/non-current compliance evidence.", blocker: "Partner eligibility is not current.", requiredAction: "Re-run governed partner eligibility and reassignment.", owner: "Operator" });
  const createdAt = nowIso();
  return rows.map((row) => ({ ...row, matterId: input.matterId, id: `${input.matterId}:${row.class}`, createdAt }));
}

export function deriveMatterCompleteness(sections: readonly MatterTruthSection[]) {
  const domainRows = sections.filter((section): section is MatterTruthSection & { id: TruthDomain } => ["identity", "documents", "signers", "execution", "witnesses", "translation", "authority", "payment", "scheduling", "custody", "courier", "delivery", "release"].includes(section.id));
  const blockingDomains = domainRows.filter((row) => row.state === "BLOCKED").map((row) => row.id);
  const reviewDomains = domainRows.filter((row) => row.state === "REVIEW_REQUIRED").map((row) => row.id);
  const staleDomains = domainRows.filter((row) => row.state === "STALE").map((row) => row.id);
  const incompleteDomains = domainRows.filter((row) => row.state === "INCOMPLETE").map((row) => row.id);
  const overallState: CompletenessState = blockingDomains.length ? "BLOCKED" : staleDomains.length ? "STALE_EVIDENCE" : reviewDomains.length ? "REVIEW_REQUIRED" : incompleteDomains.length ? "INCOMPLETE" : "COMPLETE";
  return { overallState, domains: domainRows, blockingDomains, reviewDomains, staleDomains, missingEvidence: domainRows.filter((row) => row.state !== "VERIFIED").flatMap((row) => row.evidence.filter((item) => /missing|unresolved|unknown|incomplete|not loaded|not verified/i.test(item))) };
}
