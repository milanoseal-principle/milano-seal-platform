import type { MilanoLane, PaymentMode } from "@/src/features/milano/types";

export const MILANO_PRICING = {
  lanes: {
    signature: 750,
    priority: 975,
    executive: 1850,
  },
  addOns: {
    additionalApostilleDocument: 250,
    additionalNonApostilleDocument: 75,
    rushSameDayHandling: 400,
    additionalSigner: 150,
  },
} as const;

export interface PricingInput {
  lane?: MilanoLane | string | null;
  apostilleRequired?: boolean;
  apostilleCount?: number;
  documentCount?: number;
  rush?: boolean;
  signerCount?: number;
  discountAmount?: number;
  paymentMode?: PaymentMode;
  matterReference?: string;
}

export interface PricingResult {
  lane: MilanoLane;
  base_price: number;
  add_ons: Array<{ code: string; label: string; amount: number }>;
  original_total: number;
  discount_amount: number;
  final_total: number;
  deposit_required: boolean;
  deposit_amount: number;
  balance_due: number;
  payment_reference: string;
  review_required: boolean;
  pricing_truth: {
    first_document_included: boolean;
    first_apostille_coordination_included: boolean;
    document_count: number;
    apostille_count: number;
    additional_apostille_documents: number;
    additional_non_apostille_documents: number;
  };
}

function money(value: number): number {
  return Math.max(0, Math.round(value * 100) / 100);
}

function positiveInt(value: unknown, fallback: number): number {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function normalizeLane(lane?: string | null): MilanoLane {
  const normalized = String(lane ?? "priority").toLowerCase().trim();
  if (normalized === "signature") return "signature";
  if (normalized === "priority") return "priority";
  if (normalized === "executive") return "executive";
  if (normalized === "custom" || normalized === "custom_review") return "custom_review";
  return "priority";
}

export function calculateMilanoPricing(input: PricingInput = {}): PricingResult {
  const lane = normalizeLane(input.lane);
  const reviewRequired = lane === "custom_review";
  const billableLane = reviewRequired ? "priority" : lane;
  const basePrice = MILANO_PRICING.lanes[billableLane];
  const addOns: PricingResult["add_ons"] = [];

  const documentCount = positiveInt(input.documentCount, 1);
  const inferredApostilleCount = input.apostilleRequired ? documentCount : 0;
  const requestedApostilleCount = Math.max(
    0,
    Math.floor(Number(input.apostilleCount ?? inferredApostilleCount) || 0),
  );
  const apostilleCount = Math.min(documentCount, requestedApostilleCount);

  // Canonical Matter pricing:
  // - the base lane fee covers the first document;
  // - when apostille is required, the first apostille coordination is included;
  // - each additional document requiring its own apostille is +$250;
  // - additional documents in the same Matter that do not require apostille retain
  //   the governed document-handling add-on and are never double charged.
  const additionalApostilleDocuments = Math.max(0, apostilleCount - 1);
  if (additionalApostilleDocuments > 0) {
    addOns.push({
      code: "additional_apostille_documents",
      label: `Additional Apostille Documents (${additionalApostilleDocuments})`,
      amount:
        additionalApostilleDocuments * MILANO_PRICING.addOns.additionalApostilleDocument,
    });
  }

  const documentsCoveredByBaseAndApostilles = Math.max(1, apostilleCount);
  const additionalNonApostilleDocuments = Math.max(
    0,
    documentCount - documentsCoveredByBaseAndApostilles,
  );
  if (additionalNonApostilleDocuments > 0) {
    addOns.push({
      code: "additional_non_apostille_documents",
      label: `Additional Document Handling (${additionalNonApostilleDocuments})`,
      amount:
        additionalNonApostilleDocuments *
        MILANO_PRICING.addOns.additionalNonApostilleDocument,
    });
  }

  if (input.rush) {
    addOns.push({
      code: "rush_same_day",
      label: "Rush / Same-Day Handling",
      amount: MILANO_PRICING.addOns.rushSameDayHandling,
    });
  }

  const signerCount = positiveInt(input.signerCount, 1);
  for (let index = 2; index <= signerCount; index += 1) {
    addOns.push({
      code: `additional_signer_${index}`,
      label: "Additional Signer",
      amount: MILANO_PRICING.addOns.additionalSigner,
    });
  }

  const originalTotal = money(
    basePrice + addOns.reduce((sum, item) => sum + item.amount, 0),
  );
  const discountAmount = money(
    Math.min(originalTotal, Math.max(0, Number(input.discountAmount ?? 0))),
  );
  const finalTotal = money(originalTotal - discountAmount);
  const split = input.paymentMode === "split_50_50";
  const depositAmount = split ? money(finalTotal / 2) : finalTotal;
  const balanceDue = split ? money(finalTotal - depositAmount) : 0;
  const paymentReference = input.matterReference
    ? `${input.matterReference}-${split ? "DEPOSIT" : "FULL"}`
    : "MS-PENDING";

  return {
    lane,
    base_price: basePrice,
    add_ons: addOns,
    original_total: originalTotal,
    discount_amount: discountAmount,
    final_total: finalTotal,
    deposit_required: split,
    deposit_amount: depositAmount,
    balance_due: balanceDue,
    payment_reference: paymentReference,
    review_required: reviewRequired,
    pricing_truth: {
      first_document_included: true,
      first_apostille_coordination_included: apostilleCount > 0,
      document_count: documentCount,
      apostille_count: apostilleCount,
      additional_apostille_documents: additionalApostilleDocuments,
      additional_non_apostille_documents: additionalNonApostilleDocuments,
    },
  };
}
