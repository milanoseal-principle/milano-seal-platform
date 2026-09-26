// Compatibility facade for legacy consumers importing "@/lib/pricing".
//
// The historical lib/pricing.ts module remains available through relative imports
// while migration is completed. Exact alias consumers receive the canonical
// private Matter composer for calculatePrice so intake, quote generation and
// payment-bound totals cannot drift from the reviewed pricing catalog.

export * from "../pricing";

import {
  APOSTILLE_FEES,
  SHIPPING_FEES,
  URGENCY_FEES,
  type PriceInput,
  type PriceResult,
} from "../pricing";
import { composeCanonicalPrivateQuote, type TimingMode } from "./pricingComposer";
import type { MatterBaseId } from "./pricingCatalog";

function bool(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function count(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizedUrgency(value: unknown): TimingMode[] {
  const raw = String(value ?? "standard").trim().toLowerCase();
  if (["rush", "same_day", "same-day", "urgent"].includes(raw)) {
    return ["rush_same_day"];
  }
  if (raw === "expedited") return ["expedited"];
  if (raw === "weekend") return ["weekend"];
  if (raw === "holiday") return ["holiday"];
  if (raw === "after_hours" || raw === "after-hours") {
    return ["after_hours_evening"];
  }
  return ["standard"];
}

function legacyTier(params: PriceInput): "signature" | "priority" | "executive" {
  const raw = String(params.tier ?? "signature").trim().toLowerCase();
  if (raw === "executive") return "executive";
  if (raw === "priority") return "priority";
  return "signature";
}

function matterBaseForLegacyInput(
  params: PriceInput,
  notarizedSignatureCount: number,
): MatterBaseId {
  const urgency = String(params.urgency ?? params.timeline ?? "standard")
    .trim()
    .toLowerCase();
  const requested = legacyTier(params);

  // Priority/Executive must represent actual complexity, not the historical rule
  // that promoted a Matter merely because an apostille was present.
  if (
    requested === "executive" &&
    (["rush", "same_day", "same-day", "urgent", "holiday"].includes(urgency) ||
      bool(params.fbi_apostille) ||
      bool(params.fbiApostille))
  ) {
    return "executive";
  }
  if (
    requested === "priority" &&
    ["expedited", "weekend"].includes(urgency)
  ) {
    return "priority";
  }

  return notarizedSignatureCount > 0 ? "signature" : "authentication";
}

/**
 * Canonical implementation of the legacy calculatePrice contract.
 *
 * New code should call composeCanonicalPrivateQuote/projectCanonicalQuote
 * directly. This adapter exists so established intake and payment consumers use
 * the same private pricing truth during migration without a second price table.
 */
export function calculatePrice(params: PriceInput = {}): PriceResult {
  const documentCount = Math.max(
    1,
    count(params.document_count ?? params.documentCount, 1),
  );
  const signerCount = Math.max(1, count(params.signer_count ?? params.signerCount, 1));
  const notarizedSignatureCount = count(
    params.notarized_signature_count ?? params.signature_count ?? params.signatureCount,
    0,
  );
  const apostilleCount = Math.min(
    documentCount,
    count(
      params.apostille_count ?? params.apostilleCount,
      bool(params.apostille_required) ? documentCount : 0,
    ),
  );
  const internationalSignerCount = count(
    params.international_signer_count ?? params.internationalSignerCount,
    0,
  );
  const jurisdictionCount = Math.max(
    1,
    count(params.jurisdiction_count ?? params.jurisdictionCount, 1),
  );
  const matterBase = matterBaseForLegacyInput(params, notarizedSignatureCount);
  const timing = normalizedUrgency(params.urgency ?? params.timeline);
  const requestedShipping = String(params.shipping ?? params.dispatch ?? "none")
    .trim()
    .toLowerCase();
  const witnessCount = count(params.witness_count ?? params.witnesses, 0);
  const witnessType: "ron" | "in_person" =
    String(params.witness_type ?? "ron").trim().toLowerCase() === "in_person"
      ? "in_person"
      : "ron";
  const timingWithAfterHours = [
    ...new Set<TimingMode>([
      ...timing,
      ...(bool(params.after_hours) ? ["after_hours_evening" as const] : []),
    ]),
  ];

  // Legacy symbolic shipping is deliberately not converted to an invented client
  // courier charge. Actual courier cost is quoted through the canonical composer
  // once a governed carrier rate exists.
  const quote = composeCanonicalPrivateQuote({
    matterBase,
    executionMethod: notarizedSignatureCount > 0 ? "ron" : "none",
    documentCount,
    apostilleCount,
    signerCount,
    internationalSignerCount,
    jurisdictionCount,
    additionalNotarizedSignatureTrackingCount: Math.max(
      0,
      notarizedSignatureCount - 1,
    ),
    remoteWitnessCount: witnessType === "ron" ? witnessCount : 0,
    inPersonWitnessCount: witnessType === "in_person" ? witnessCount : 0,
    timing: timingWithAfterHours,
    fbiFederalApostille: bool(params.fbi_apostille) || bool(params.fbiApostille),
    executiveInPersonStateHandling:
      bool(params.executive_state_handling) ||
      bool(params.in_person_state_handling) ||
      bool(params.direct_state_handling),
    manualAdjustment: Number(params.manual_adjustment ?? params.manualAdjustment ?? 0) || 0,
    courierCost: 0,
  });

  const compatibilityTier: "signature" | "priority" | "executive" =
    matterBase === "executive"
      ? "executive"
      : matterBase === "priority"
        ? "priority"
        : "signature";
  const baseLine = quote.lineItems.find((item) => item.category === "base");
  const additionalDocuments = quote.lineItems
    .filter((item) =>
      ["additional_apostilled_documents", "additional_non_apostille_documents"].includes(
        item.code,
      ),
    )
    .reduce((sum, item) => {
      const match = item.label.match(/\((\d+)\)/);
      return sum + Number(match?.[1] ?? 0);
    }, 0);
  const apostilleTotal = quote.lineItems
    .filter((item) => item.code === "additional_apostilled_documents")
    .reduce((sum, item) => sum + item.amount, 0);
  const signatureTrackingTotal = quote.lineItems
    .filter((item) => item.code === "additional_notarized_signature_tracking")
    .reduce((sum, item) => sum + item.amount, 0);
  const witnessTotal = quote.lineItems
    .filter((item) => item.category === "witness")
    .reduce((sum, item) => sum + item.amount, 0);

  const breakdown = quote.lineItems.map((item) => ({
    key: item.code === "matter_base" ? "base" : item.code,
    label: item.label,
    amount: item.amount,
    internal_only: ["courier", "authority", "adjustment"].includes(item.category),
  }));

  // Keep legacy diagnostic exports visible for callers that inspect requested
  // shipping, but do not bill the old fixed shipping amount.
  void SHIPPING_FEES;
  void URGENCY_FEES;
  void APOSTILLE_FEES;
  void requestedShipping;

  return {
    tier: compatibilityTier,
    tier_label: baseLine?.label ?? matterBase,
    base: money(baseLine?.amount ?? 0),
    total: quote.total,
    quoted_price: quote.total,
    final_price: quote.total,
    retainer: quote.depositAmount,
    balance: quote.balanceDue,
    breakdown,
    internal: {
      clean_draft_applied: false,
      document_count: documentCount,
      additional_documents: additionalDocuments,
      signer_count: signerCount,
      additional_signers: Math.max(0, signerCount - 1),
      notarized_signature_count: notarizedSignatureCount,
      international_signer_count: internationalSignerCount,
      jurisdiction_count: jurisdictionCount,
      apostille_count: apostilleCount,
      apostille_total: money(apostilleTotal),
      urgency:
        timingWithAfterHours[0] === "rush_same_day"
          ? "rush"
          : timingWithAfterHours[0] === "after_hours_evening"
            ? "expedited"
            : timingWithAfterHours[0] === "standard"
              ? "standard"
              : timingWithAfterHours[0],
      shipping: "none",
      manual_adjustment: money(
        Number(params.manual_adjustment ?? params.manualAdjustment ?? 0) || 0,
      ),
      ron_cost: money(signatureTrackingTotal),
      witness_count: witnessCount,
      witness_type: witnessType,
      witness_total: money(witnessTotal),
      after_hours: bool(params.after_hours),
    },
  };
}
