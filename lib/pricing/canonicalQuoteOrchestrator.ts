import {
  QUOTE_REVIEW_ONLY,
  type MatterBaseId,
  type QuoteReviewOnlyCode,
} from "./pricingCatalog";
import {
  composeCanonicalPrivateQuote,
  type CanonicalPrivateQuoteInput,
  type CanonicalPrivateQuoteResult,
  type ExecutionMethod,
  type TimingMode,
} from "./pricingComposer";

export interface CanonicalQuoteFacts extends Record<string, unknown> {
  matter_base?: unknown;
  matterBase?: unknown;
  lane?: unknown;
  execution_method?: unknown;
  executionMethod?: unknown;
  document_count?: unknown;
  documentCount?: unknown;
  docs_count?: unknown;
  docs?: unknown;
  apostille_count?: unknown;
  apostilleCount?: unknown;
  apostille_required?: unknown;
  authentication_requirement?: unknown;
  notarization_required?: unknown;
  notarization_requirement?: unknown;
  ron_required?: unknown;
  signer_count?: unknown;
  signerCount?: unknown;
  signers?: unknown;
  florida_notarial_act_count?: unknown;
  floridaNotarialActCount?: unknown;
  witnesses?: unknown;
  witness_type?: unknown;
  remote_witness_count?: unknown;
  in_person_witness_count?: unknown;
  international_signer_count?: unknown;
  jurisdiction_count?: unknown;
  miles?: unknown;
  mobile_miles?: unknown;
  urgency?: unknown;
  timeline?: unknown;
  after_hours?: unknown;
  translation?: unknown;
  translation_coordination?: unknown;
  fbi_apostille?: unknown;
  federal_apostille?: unknown;
  executive_state_handling?: unknown;
  consular_legalization?: unknown;
  certified_translation?: unknown;
  receiving_authority_uncertain?: unknown;
  document_preparation?: unknown;
  courier_cost?: unknown;
  external_authority_fees?: unknown;
  manual_adjustment?: unknown;
  discount_amount?: unknown;
  service_code?: unknown;
}

export interface CanonicalQuoteProjection {
  matterBase: MatterBaseId;
  executionMethod: ExecutionMethod;
  quote: CanonicalPrivateQuoteResult;
  eligibleSubtotal: number;
  nonDiscountableTotal: number;
  reviewRequired: boolean;
  reviewReasons: QuoteReviewOnlyCode[];
}

const asBool = (value: unknown): boolean =>
  value === true || value === "true" || value === 1 || value === "1";

const asCount = (value: unknown, fallback = 0): number => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const asMoney = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

function normalizeExecutionMethod(facts: CanonicalQuoteFacts): ExecutionMethod {
  const raw = String(
    facts.execution_method ?? facts.executionMethod ?? "",
  ).trim().toLowerCase();
  if (["ron", "remote", "remote_online", "remote_online_notarization"].includes(raw)) {
    return "ron";
  }
  if (["in_person", "in-person", "mobile", "mobile_notary", "physical"].includes(raw)) {
    return "in_person";
  }
  return "none";
}

function explicitMatterBase(facts: CanonicalQuoteFacts): MatterBaseId | null {
  const raw = String(facts.matter_base ?? facts.matterBase ?? "")
    .trim()
    .toLowerCase();
  const allowed: MatterBaseId[] = [
    "authentication",
    "signature",
    "priority",
    "executive",
    "international_passport_execution",
  ];
  return allowed.includes(raw as MatterBaseId) ? (raw as MatterBaseId) : null;
}

function deriveMatterBase(
  facts: CanonicalQuoteFacts,
  executionMethod: ExecutionMethod,
): MatterBaseId {
  const explicit = explicitMatterBase(facts);
  if (explicit) return explicit;

  const serviceCode = String(facts.service_code ?? "").trim().toLowerCase();
  if (serviceCode === "international_passport_execution") {
    return "international_passport_execution";
  }

  const lane = String(facts.lane ?? "").trim().toLowerCase();
  if (lane === "executive") return "executive";
  if (lane === "priority") return "priority";

  const notarizationRequired =
    asBool(facts.notarization_required) ||
    asBool(facts.ron_required) ||
    ["required", "yes", "true"].includes(
      String(facts.notarization_requirement ?? "").trim().toLowerCase(),
    );

  if (executionMethod === "none" && !notarizationRequired) {
    return "authentication";
  }

  return "signature";
}

function normalizeTiming(facts: CanonicalQuoteFacts): TimingMode[] {
  const timing = new Set<TimingMode>();
  const raw = String(facts.urgency ?? facts.timeline ?? "standard")
    .trim()
    .toLowerCase();

  if (["rush", "same_day", "same-day", "urgent"].includes(raw)) {
    timing.add("rush_same_day");
  } else if (raw === "expedited") {
    timing.add("expedited");
  } else if (raw === "weekend") {
    timing.add("weekend");
  } else if (raw === "holiday") {
    timing.add("holiday");
  }

  if (asBool(facts.after_hours)) timing.add("after_hours_evening");
  if (timing.size === 0) timing.add("standard");
  return [...timing];
}

function normalizeReviewOnlyItems(facts: CanonicalQuoteFacts): QuoteReviewOnlyCode[] {
  const review = new Set<QuoteReviewOnlyCode>();
  if (asBool(facts.consular_legalization)) review.add("consular_legalization");
  if (asBool(facts.certified_translation)) review.add("certified_translation");
  if (asBool(facts.document_preparation)) {
    review.add("document_preparation_execution_formatting");
  }
  if (asBool(facts.receiving_authority_uncertain)) {
    review.add("unknown_authority_fee");
  }
  return [...review].filter((code) => QUOTE_REVIEW_ONLY.includes(code));
}

export function projectCanonicalQuote(
  facts: CanonicalQuoteFacts,
): CanonicalQuoteProjection {
  const executionMethod = normalizeExecutionMethod(facts);
  const matterBase = deriveMatterBase(facts, executionMethod);
  const documentCount = Math.max(
    1,
    asCount(
      facts.document_count ?? facts.documentCount ?? facts.docs_count ?? facts.docs,
      1,
    ),
  );
  const apostilleRequired =
    asBool(facts.apostille_required) ||
    ["apostille", "required"].includes(
      String(facts.authentication_requirement ?? "").trim().toLowerCase(),
    );
  const apostilleCount = Math.min(
    documentCount,
    asCount(
      facts.apostille_count ?? facts.apostilleCount,
      apostilleRequired ? documentCount : 0,
    ),
  );
  const signerCount = Math.max(
    1,
    asCount(facts.signer_count ?? facts.signerCount ?? facts.signers, 1),
  );
  const witnessCount = asCount(facts.witnesses, 0);
  const witnessType = String(facts.witness_type ?? "").trim().toLowerCase();
  const remoteWitnessCount = asCount(
    facts.remote_witness_count,
    witnessType === "ron" || witnessType === "remote" ? witnessCount : 0,
  );
  const inPersonWitnessCount = asCount(
    facts.in_person_witness_count,
    witnessType === "in_person" || witnessType === "in-person" ? witnessCount : 0,
  );

  const input: CanonicalPrivateQuoteInput = {
    matterBase,
    executionMethod,
    documentCount,
    apostilleCount,
    signerCount,
    floridaNotarialActCount: asCount(
      facts.florida_notarial_act_count ?? facts.floridaNotarialActCount,
      0,
    ),
    remoteWitnessCount,
    inPersonWitnessCount,
    internationalSignerCount: asCount(facts.international_signer_count, 0),
    jurisdictionCount: Math.max(1, asCount(facts.jurisdiction_count, 1)),
    mobileMiles:
      executionMethod === "in_person"
        ? Math.max(0, Number(facts.mobile_miles ?? facts.miles ?? 0) || 0)
        : 0,
    timing: normalizeTiming(facts),
    translationCoordination:
      asBool(facts.translation) || asBool(facts.translation_coordination),
    fbiFederalApostille:
      asBool(facts.fbi_apostille) || asBool(facts.federal_apostille),
    executiveInPersonStateHandling: asBool(facts.executive_state_handling),
    reviewOnlyItems: normalizeReviewOnlyItems(facts),
    courierCost: Math.max(0, asMoney(facts.courier_cost)),
    externalAuthorityFees: Math.max(0, asMoney(facts.external_authority_fees)),
    manualAdjustment: asMoney(facts.manual_adjustment),
    discountAmount: Math.max(0, asMoney(facts.discount_amount)),
  };

  const quote = composeCanonicalPrivateQuote(input);
  const nonDiscountableTotal = Math.round(
    (Math.max(0, asMoney(facts.courier_cost)) +
      Math.max(0, asMoney(facts.external_authority_fees))) *
      100,
  ) / 100;
  const eligibleSubtotal = Math.round(
    Math.max(0, quote.subtotal - nonDiscountableTotal) * 100,
  ) / 100;

  return {
    matterBase,
    executionMethod,
    quote,
    eligibleSubtotal,
    nonDiscountableTotal,
    reviewRequired: quote.reviewRequired,
    reviewReasons: quote.reviewOnlyItems,
  };
}
