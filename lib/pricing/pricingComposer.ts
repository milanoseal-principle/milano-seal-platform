import {
  DOCUMENT_FEES,
  LANGUAGE_PREP_FEES,
  MATTER_BASES,
  MOBILE_TRAVEL_FEES,
  NOTARY_SIGNER_FEES,
  QUOTE_REVIEW_ONLY,
  SPECIAL_HANDLING_FEES,
  TIMING_FEES,
  type MatterBaseId,
  type QuoteReviewOnlyCode,
} from "./pricingCatalog";

export type ExecutionMethod = "none" | "ron" | "in_person";
export type TimingMode =
  | "standard"
  | "expedited"
  | "rush_same_day"
  | "after_hours_evening"
  | "weekend"
  | "holiday";

export interface CanonicalPrivateQuoteInput {
  matterBase: MatterBaseId;
  executionMethod?: ExecutionMethod;
  documentCount?: number;
  apostilleCount?: number;
  floridaNotarialActCount?: number;
  signerCount?: number;
  remoteWitnessCount?: number;
  inPersonWitnessCount?: number;
  internationalSignerCount?: number;
  jurisdictionCount?: number;
  mobileMiles?: number;
  timing?: TimingMode[];
  translationCoordination?: boolean;
  fbiFederalApostille?: boolean;
  executiveInPersonStateHandling?: boolean;
  reviewOnlyItems?: QuoteReviewOnlyCode[];
  courierCost?: number;
  externalAuthorityFees?: number;
  manualAdjustment?: number;
  discountAmount?: number;
}

export interface CanonicalPrivateQuoteLine {
  code: string;
  label: string;
  amount: number;
  category:
    | "base"
    | "document"
    | "notary"
    | "signer"
    | "witness"
    | "travel"
    | "timing"
    | "language"
    | "special"
    | "courier"
    | "authority"
    | "adjustment";
  internalOnly: true;
}

export interface CanonicalPrivateQuoteResult {
  matterBase: MatterBaseId;
  executionMethod: ExecutionMethod;
  lineItems: CanonicalPrivateQuoteLine[];
  subtotal: number;
  discountAmount: number;
  total: number;
  depositAmount: number;
  balanceDue: number;
  paymentMode: "split_50_50";
  reviewRequired: boolean;
  reviewOnlyItems: QuoteReviewOnlyCode[];
  pricingGuards: {
    singleMatterBaseApplied: true;
    firstDocumentIncluded: true;
    firstApostilleIncludedWhenRequired: true;
    apostilledDocumentsNotDoubleCharged: true;
  };
}

function count(value: unknown, fallback = 0): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function money(value: unknown): number {
  const n = Number(value);
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
}

function positiveMoney(value: unknown): number {
  return Math.max(0, money(value));
}

function pushLine(
  target: CanonicalPrivateQuoteLine[],
  code: string,
  label: string,
  amount: number,
  category: CanonicalPrivateQuoteLine["category"],
) {
  if (amount <= 0) return;
  target.push({ code, label, amount: money(amount), category, internalOnly: true });
}

function travelCharge(miles: number): { amount: number; reviewRequired: boolean; label: string } {
  if (miles <= MOBILE_TRAVEL_FEES.local_radius_miles) {
    return { amount: 0, reviewRequired: false, label: "Local mobile radius included" };
  }
  if (miles <= 25) {
    return { amount: MOBILE_TRAVEL_FEES.tier_11_25, reviewRequired: false, label: "Mobile travel — 11–25 miles" };
  }
  if (miles <= 50) {
    return { amount: MOBILE_TRAVEL_FEES.tier_26_50, reviewRequired: false, label: "Mobile travel — 26–50 miles" };
  }
  return { amount: 0, reviewRequired: true, label: "Mobile travel — over 50 miles" };
}

export function composeCanonicalPrivateQuote(
  input: CanonicalPrivateQuoteInput,
): CanonicalPrivateQuoteResult {
  const base = MATTER_BASES[input.matterBase];
  const executionMethod = input.executionMethod ?? "none";
  const documentCount = Math.max(1, count(input.documentCount, 1));
  const apostilleCount = Math.min(documentCount, count(input.apostilleCount, 0));
  const signerCount = Math.max(1, count(input.signerCount, 1));
  const floridaNotarialActCount = count(input.floridaNotarialActCount, 0);
  const remoteWitnessCount = count(input.remoteWitnessCount, 0);
  const inPersonWitnessCount = count(input.inPersonWitnessCount, 0);
  const internationalSignerCount = count(input.internationalSignerCount, 0);
  const jurisdictionCount = Math.max(1, count(input.jurisdictionCount, 1));
  const mobileMiles = Math.max(0, Number(input.mobileMiles ?? 0) || 0);
  const timing = [...new Set<TimingMode>(input.timing ?? ["standard"])];
  const reviewOnlyItems = [...new Set(input.reviewOnlyItems ?? [])].filter((code) =>
    QUOTE_REVIEW_ONLY.includes(code),
  );

  const lineItems: CanonicalPrivateQuoteLine[] = [];
  pushLine(lineItems, "matter_base", base.label, base.amount, "base");

  const additionalApostilledDocuments = Math.max(0, apostilleCount - 1);
  pushLine(
    lineItems,
    "additional_apostilled_documents",
    `Additional document requiring its own apostille (${additionalApostilledDocuments})`,
    additionalApostilledDocuments * DOCUMENT_FEES.additional_apostilled_document,
    "document",
  );

  // The first document is included in the base. Any additional document already
  // receiving the +$250 apostille-document charge is excluded from the generic
  // +$75 handling charge.
  const coveredDocuments = Math.max(1, apostilleCount);
  const additionalNonApostilleDocuments = Math.max(0, documentCount - coveredDocuments);
  pushLine(
    lineItems,
    "additional_non_apostille_documents",
    `Additional non-apostille document handling (${additionalNonApostilleDocuments})`,
    additionalNonApostilleDocuments * DOCUMENT_FEES.additional_non_apostille_document,
    "document",
  );

  pushLine(
    lineItems,
    "florida_notarial_acts",
    `Florida notarial act (${floridaNotarialActCount})`,
    floridaNotarialActCount * NOTARY_SIGNER_FEES.florida_notarial_act,
    "notary",
  );

  const additionalSigners = Math.max(0, signerCount - 1);
  pushLine(
    lineItems,
    "additional_signers",
    `Additional signer (${additionalSigners})`,
    additionalSigners * NOTARY_SIGNER_FEES.additional_signer,
    "signer",
  );

  pushLine(
    lineItems,
    "remote_witnesses",
    `Remote witness (${remoteWitnessCount})`,
    remoteWitnessCount * NOTARY_SIGNER_FEES.remote_witness,
    "witness",
  );
  pushLine(
    lineItems,
    "in_person_witnesses",
    `In-person witness (${inPersonWitnessCount})`,
    inPersonWitnessCount * NOTARY_SIGNER_FEES.in_person_witness,
    "witness",
  );
  pushLine(
    lineItems,
    "international_signers",
    `International signer coordination (${internationalSignerCount})`,
    internationalSignerCount * NOTARY_SIGNER_FEES.international_signer_coordination,
    "signer",
  );

  if (jurisdictionCount >= 3) {
    pushLine(
      lineItems,
      "multi_jurisdiction",
      "Multi-jurisdiction handling",
      DOCUMENT_FEES.multi_jurisdiction_handling,
      "special",
    );
  }

  if (input.fbiFederalApostille) {
    pushLine(
      lineItems,
      "fbi_federal_apostille",
      "FBI / federal apostille coordination",
      DOCUMENT_FEES.fbi_federal_apostille_coordination,
      "special",
    );
  }

  if (input.executiveInPersonStateHandling) {
    pushLine(
      lineItems,
      "executive_in_person_state_handling",
      "Executive in-person state handling",
      SPECIAL_HANDLING_FEES.executive_in_person_state_handling,
      "special",
    );
  }

  let travelReviewRequired = false;
  if (executionMethod === "in_person") {
    const travel = travelCharge(mobileMiles);
    travelReviewRequired = travel.reviewRequired;
    pushLine(lineItems, "mobile_travel", travel.label, travel.amount, "travel");
  }

  for (const timingMode of timing) {
    if (timingMode === "standard") continue;
    const amount = TIMING_FEES[timingMode];
    pushLine(
      lineItems,
      `timing_${timingMode}`,
      `Timing premium — ${timingMode.replaceAll("_", " ")}`,
      amount,
      "timing",
    );
  }

  if (input.translationCoordination) {
    pushLine(
      lineItems,
      "translation_coordination",
      "Translation coordination",
      LANGUAGE_PREP_FEES.translation_coordination,
      "language",
    );
  }

  pushLine(
    lineItems,
    "courier",
    "Courier / release cost",
    positiveMoney(input.courierCost),
    "courier",
  );
  pushLine(
    lineItems,
    "external_authority_fees",
    "External authority / government fees",
    positiveMoney(input.externalAuthorityFees),
    "authority",
  );

  const manualAdjustment = money(input.manualAdjustment);
  if (manualAdjustment !== 0) {
    lineItems.push({
      code: "manual_adjustment",
      label: "Approved manual adjustment",
      amount: manualAdjustment,
      category: "adjustment",
      internalOnly: true,
    });
  }

  const subtotal = money(lineItems.reduce((sum, item) => sum + item.amount, 0));
  const discountAmount = Math.min(subtotal, positiveMoney(input.discountAmount));
  const total = money(subtotal - discountAmount);
  const depositAmount = money(total / 2);
  const balanceDue = money(total - depositAmount);

  if (travelReviewRequired && !reviewOnlyItems.includes("mobile_travel_over_50_miles")) {
    reviewOnlyItems.push("mobile_travel_over_50_miles");
  }

  return {
    matterBase: input.matterBase,
    executionMethod,
    lineItems,
    subtotal,
    discountAmount,
    total,
    depositAmount,
    balanceDue,
    paymentMode: "split_50_50",
    reviewRequired: reviewOnlyItems.length > 0,
    reviewOnlyItems,
    pricingGuards: {
      singleMatterBaseApplied: true,
      firstDocumentIncluded: true,
      firstApostilleIncludedWhenRequired: true,
      apostilledDocumentsNotDoubleCharged: true,
    },
  };
}
