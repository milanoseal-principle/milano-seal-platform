import { buildMilanoSealAttribution } from "./referral-attribution";
import { scoreExecutionReadiness } from "./execution-scoring";
import type { CanonicalExecutionTruth } from "@/lib/matter/executionTruth";

export type MilanoSealAuthorityNode =
  | "nicholas_milano"
  | "tiffany_burtt"
  | "milano_seal_operator"
  | "partner_notary"
  | "apostille_partner"
  | "translation_partner"
  | "shipping_partner"
  | "unknown";
export type MilanoSealServiceLane =
  | "signature"
  | "priority"
  | "executive"
  | "apostille"
  | "ron"
  | "mobile_notary"
  | "international_execution"
  | "real_estate"
  | "legal_document_support"
  | "other";
export type ExecutionUrgency =
  | "standard"
  | "priority"
  | "rush"
  | "same_day"
  | "critical";
export type ExecutionRoutingAction =
  | "quote_now"
  | "operator_review"
  | "schedule_execution"
  | "request_missing_info"
  | "jurisdiction_review"
  | "partner_referral"
  | "decline_or_refer_out";

export interface ExecutionRoutingInput {
  clientName?: string;
  email?: string;
  phone?: string;
  documentType?: string;
  documentCount?: number;
  signerCount?: number;
  signerLocation?: string;
  documentOriginJurisdiction?: string;
  destinationCountry?: string;
  apostilleRequired?: boolean;
  ronRequested?: boolean;
  mobileNotaryRequested?: boolean;
  executionTruth?: CanonicalExecutionTruth;
  translationNeeded?: boolean;
  shippingNeeded?: boolean;
  urgency?: ExecutionUrgency;
  requestedDate?: string;
  sourceAuthority?: MilanoSealAuthorityNode;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  entryPage?: string;
  notes?: string;
  paymentConfirmed?: boolean;
  documentsUploaded?: boolean;
  idVerificationReady?: boolean;
}

export interface ExecutionRoutingResult {
  readinessScore: number;
  serviceLane: MilanoSealServiceLane;
  urgency: ExecutionUrgency;
  action: ExecutionRoutingAction;
  slaMinutes: number;
  assignedNode: MilanoSealAuthorityNode;
  recommendedPath: string;
  missingInformation: string[];
  riskFlags: string[];
  custodyRequired: boolean;
  paymentGateRequired: boolean;
  attribution: ReturnType<typeof buildMilanoSealAttribution>;
}

function explicitExecutionMethod(input: ExecutionRoutingInput) {
  if (input.executionTruth) return input.executionTruth.execution_method;
  if (input.ronRequested === true) return "ron" as const;
  if (input.mobileNotaryRequested === true) return "mobile" as const;
  return null;
}

function explicitApostille(input: ExecutionRoutingInput) {
  if (input.executionTruth) {
    return input.executionTruth.authentication_requirement === "apostille";
  }
  return input.apostilleRequired === true;
}

export function detectMilanoSealServiceLane(
  input: ExecutionRoutingInput,
): MilanoSealServiceLane {
  const doc = (input.documentType ?? "").toLowerCase();
  const method = explicitExecutionMethod(input);
  if (doc.includes("real estate")) return "real_estate";
  if (method === "mobile") return "mobile_notary";
  if (method === "ron") return "ron";
  if (explicitApostille(input)) return "apostille";
  if (input.destinationCountry) return "international_execution";
  return "signature";
}

export function detectMissingExecutionInformation(input: ExecutionRoutingInput) {
  const missing: string[] = [];
  if (!input.clientName || (!input.email && !input.phone)) {
    missing.push("client contact");
  }
  if (!input.documentType) missing.push("document type");

  const method = explicitExecutionMethod(input);
  const signerLocation =
    input.executionTruth?.signer_location ?? input.signerLocation ?? null;
  if (method === "ron" && !signerLocation) missing.push("signer location");
  if (explicitApostille(input) && !input.destinationCountry) {
    missing.push("destination country");
  }
  if (input.executionTruth?.authentication_requirement === "review_required") {
    missing.push("authentication review");
  }
  if (input.executionTruth?.notarization_requirement === "review_required") {
    missing.push("notarization review");
  }
  if (
    input.executionTruth?.notarization_requirement === "required" &&
    input.executionTruth.execution_method === "review_required"
  ) {
    missing.push("execution method review");
  }
  return missing;
}

export function getExecutionRoutingAction(
  score: number,
  riskFlags: string[],
): ExecutionRoutingAction {
  if (riskFlags.includes("critical")) return "decline_or_refer_out";
  if (riskFlags.includes("jurisdiction_review")) return "jurisdiction_review";
  if (score >= 85) return "schedule_execution";
  if (score >= 70) return "quote_now";
  if (score < 45) return "request_missing_info";
  return "operator_review";
}

export function getExecutionSlaMinutes(
  urgency: ExecutionUrgency = "standard",
  action: ExecutionRoutingAction = "operator_review",
) {
  if (action === "request_missing_info") return 240;
  return urgency === "critical"
    ? 15
    : urgency === "same_day"
      ? 30
      : urgency === "rush"
        ? 60
        : urgency === "priority"
          ? 120
          : 480;
}

export function buildExecutionAttribution(input: ExecutionRoutingInput) {
  return buildMilanoSealAttribution({
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    entryPage: input.entryPage,
    source: input.utmSource ? "social" : "unknown",
    quoteAmount: undefined,
  });
}

export function routeMilanoSealRequest(
  input: ExecutionRoutingInput,
): ExecutionRoutingResult {
  const riskFlags: string[] = [];
  const method = explicitExecutionMethod(input);
  if (explicitApostille(input) && !input.destinationCountry) {
    riskFlags.push("jurisdiction_review");
  }
  if (method === "ron" && !(
    input.executionTruth?.signer_location ?? input.signerLocation
  )) {
    riskFlags.push("jurisdiction_review");
  }
  if (
    input.executionTruth?.notarization_requirement === "review_required" ||
    input.executionTruth?.authentication_requirement === "review_required" ||
    input.executionTruth?.execution_method === "review_required" ||
    input.executionTruth?.notarial_act === "review_required"
  ) {
    riskFlags.push("jurisdiction_review");
  }
  if ((input.notes ?? "").toLowerCase().includes("legal advice")) {
    riskFlags.push("legal_advice_risk");
  }

  const custodyRequired = Boolean(
    explicitApostille(input) ||
      input.shippingNeeded ||
      (input.documentType ?? "").toLowerCase().includes("original"),
  );
  const score = scoreExecutionReadiness({
    ...input,
    custodyRequired,
    jurisdictionKnown: !riskFlags.includes("jurisdiction_review"),
    riskFlags,
  });
  const action = getExecutionRoutingAction(score.score, riskFlags);

  return {
    readinessScore: score.score,
    serviceLane: detectMilanoSealServiceLane(input),
    urgency: input.urgency ?? "standard",
    action,
    slaMinutes: getExecutionSlaMinutes(input.urgency, action),
    assignedNode: input.sourceAuthority ?? "milano_seal_operator",
    recommendedPath:
      action === "jurisdiction_review"
        ? "Operator jurisdiction review before quote or scheduling"
        : "Document execution intake to quote and payment-gated scheduling",
    missingInformation: detectMissingExecutionInformation(input),
    riskFlags,
    custodyRequired,
    paymentGateRequired: ["quote_now", "schedule_execution"].includes(action),
    attribution: buildExecutionAttribution(input),
  };
}
