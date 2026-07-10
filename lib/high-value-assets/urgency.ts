/**
 * urgency — high-value asset deadline/urgency. Delegates the core rule set to the
 * Maritime urgency engine (no duplication) and adds asset-specific framing.
 * Payment-before-scheduling stays enforced; urgent never means guaranteed.
 */

import { evaluateUrgency } from "@/lib/maritime/urgency/maritimeUrgency";

export interface AssetUrgencyInput {
  closingDate?: string | null;
  hoursRemaining?: number | null;
  internationalDelivery?: boolean;
  escrowTimeline?: boolean;
  consularDeadline?: boolean;
  paymentConfirmed?: boolean;
  documentReady?: boolean;
  receivingAuthorityUncertain?: boolean;
}

export interface AssetUrgencyResult {
  urgency: string;
  deadlineRisk: "low" | "elevated" | "high" | "manual_review";
  blocker: string | null;
  operatorNextAction: string;
  guaranteed: false;
}

export function scoreHighValueAssetUrgency(input: AssetUrgencyInput): AssetUrgencyResult {
  const base = evaluateUrgency({
    hoursRemaining: input.hoursRemaining ?? null,
    paymentConfirmed: input.paymentConfirmed,
    signerAuthorityVerified: true,
    receivingAuthorityUncertain: input.receivingAuthorityUncertain,
  });

  const deadlineRisk = getAssetDeadlineRisk(input);
  return {
    urgency: base.urgencyLevel,
    deadlineRisk,
    blocker: base.blocker,
    operatorNextAction: buildAssetOperatorNextAction(input, base.nextOperatorAction),
    guaranteed: false,
  };
}

export function getAssetDeadlineRisk(input: AssetUrgencyInput): AssetUrgencyResult["deadlineRisk"] {
  if (input.receivingAuthorityUncertain) return "manual_review";
  const h = input.hoursRemaining ?? null;
  if (h !== null && h <= 6) return "high";
  if (h !== null && h <= 48) return "elevated";
  if (input.consularDeadline || input.internationalDelivery) return "elevated";
  return "low";
}

export function buildAssetOperatorNextAction(
  input: AssetUrgencyInput,
  fallback: string,
): string {
  // Scheduling requires verified payment AND document readiness.
  if (input.paymentConfirmed === false) return "verify_payment";
  if (input.documentReady === false) return "review_document_readiness";
  return fallback;
}
