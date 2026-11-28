// Server-side only. Eligibility policy and verified evidence are never browser inputs.
import { isDeepStrictEqual } from "node:util";
import { composeGovernedQuote } from "./governedQuotePreview";
import { splitFiftyFiftyCents, toCents } from "./paymentSplit";

type CheckoutTier = "signature" | "priority" | "executive";

/** Server-loaded records only. Public intake declarations remain provisional. */
export interface VerifiedAutomaticQuoteScope {
  documentType: string;
  originState: string;
  destinationCountry: string;
  tier: CheckoutTier;
  executionReviewId: string;
  clientRequirementsEvidenceId: string;
  addOnEvidenceId: string;
  courier: { disposition: "not_required" | "verified"; evidenceId: string; clientChargeCents: number };
  facts: Record<string, unknown>;
}

export interface ApprovedAutomaticQuotePolicy {
  id: string;
  approvedBy: string;
  effectiveAt: string;
  expiresAt: string;
  /** Exact verified scopes authorized by the approval record. */
  scopes: readonly VerifiedAutomaticQuoteScope[];
}

type Eligibility =
  | { status: "review_required"; reason: "POLICY_REQUIRED" | "SCOPE_REQUIRED" | "CANONICAL_REVIEW_REQUIRED" }
  | { status: "eligible"; policyId: string; totalCents: number; retainerCents: number; finalBalanceCents: number; currency: "USD" };

const hasText = (value: unknown) => typeof value === "string" && value.trim().length > 0;

/** An isolated evaluator. It neither accepts a quote nor issues an invoice or payment. */
export function evaluateAutomaticQuoteEligibility(
  scope: VerifiedAutomaticQuoteScope,
  policy: ApprovedAutomaticQuotePolicy | null,
  now: number,
): Eligibility {
  const starts = policy ? Date.parse(policy.effectiveAt) : NaN;
  const expires = policy ? Date.parse(policy.expiresAt) : NaN;
  if (!policy || !hasText(policy.id) || !hasText(policy.approvedBy)
    || !Number.isFinite(now) || !(starts <= now && now < expires)) {
    return { status: "review_required", reason: "POLICY_REQUIRED" };
  }
  if (![scope.documentType, scope.originState, scope.destinationCountry, scope.executionReviewId,
    scope.clientRequirementsEvidenceId, scope.addOnEvidenceId, scope.courier.evidenceId].every(hasText)
    || !["signature", "priority", "executive"].includes(scope.tier)
    || !Number.isSafeInteger(scope.courier.clientChargeCents) || scope.courier.clientChargeCents < 0
    || (scope.courier.disposition === "not_required" && scope.courier.clientChargeCents !== 0)
    || !["not_required", "verified"].includes(scope.courier.disposition)
    || !policy.scopes.some((approved) => isDeepStrictEqual(approved, scope))) {
    return { status: "review_required", reason: "SCOPE_REQUIRED" };
  }

  // Approved discounts still go through the existing discount authority;
  // this isolated scope cannot apply or promise an adjustment.
  if (hasText(scope.facts.discount_code) || hasText(scope.facts.discountCode)
    || Number(scope.facts.discount_amount ?? 0) !== 0 || Number(scope.facts.manual_adjustment ?? 0) !== 0) {
    return { status: "review_required", reason: "CANONICAL_REVIEW_REQUIRED" };
  }
  const { preview, projection } = composeGovernedQuote({
    ...scope.facts,
    document_type: scope.documentType,
    origin_state: scope.originState,
    destination_country: scope.destinationCountry,
    matter_base: scope.tier,
    courier_cost: scope.courier.clientChargeCents / 100,
  });
  if (preview.review_required || !projection || projection.matterBase !== scope.tier
    || preview.total == null || !Number.isFinite(preview.total) || preview.total <= 0) {
    return { status: "review_required", reason: "CANONICAL_REVIEW_REQUIRED" };
  }
  const totalCents = toCents(preview.total);
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
    return { status: "review_required", reason: "CANONICAL_REVIEW_REQUIRED" };
  }
  return { status: "eligible", policyId: policy.id, totalCents, ...splitFiftyFiftyCents(totalCents), currency: "USD" };
}
