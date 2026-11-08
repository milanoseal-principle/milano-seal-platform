// INTERNAL PRICING ENGINE — DO NOT EXPOSE TO FRONTEND
// Canonical Matter economics consumed by intake, quote, dashboard, portal invoice,
// and payment gates. Public pages must use reviewed-quote language only.

export type ExecutionLane =
  | "RON_SIMPLE"
  | "MOBILE_STANDARD"
  | "Signature"
  | "Priority"
  | "Executive";

export const TIERS = {
  signature: {
    base: 750,
    clean_draft_override: 750,
    label: "Signature Lane",
    description: "Standard execution for straightforward matters",
  },
  priority: {
    base: 975,
    label: "Priority Lane",
    description: "Expedited coordination and structured handling",
  },
  executive: {
    base: 1850,
    label: "Executive Lane",
    description: "High-touch coordination, time-sensitive or complex",
  },
} as const;

export const COMPLEXITY = {
  additional_document: 75,
  additional_signer: 150,
  international_signer: 200,
  multi_jurisdiction: 300,
} as const;

export const APOSTILLE_FEES = {
  // The first apostille coordination is included in the execution-lane base.
  first: 250,
  additional: 250,
  executive_in_person_state_handling: 500,
  fbi_apostille: 750,
} as const;

export const URGENCY_FEES = {
  standard: 0,
  expedited: 200,
  rush: 400,
  same_day: 400,
  weekend: 250,
  holiday: 350,
} as const;

export const SHIPPING_FEES = {
  none: 0,
  standard_domestic: 45,
  expedited_domestic: 85,
  international: 150,
} as const;

export const WITNESS_FEES = {
  ron: 50,
  in_person: 75,
  after_hours: 150,
} as const;

type Tier = keyof typeof TIERS;
type UrgencyKey = keyof typeof URGENCY_FEES;
type ShippingKey = keyof typeof SHIPPING_FEES;

function toInt(value: unknown, fallback = 0): number {
  const parsed = parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toNonNegativeInt(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function toBool(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function money(value: number): number {
  return Math.round(Number(value || 0) * 100) / 100;
}

function normalizeTier(tier: unknown): Tier {
  const normalized = String(tier ?? "signature").toLowerCase().trim();
  if (normalized in TIERS) return normalized as Tier;
  return "signature";
}

function normalizeUrgency(urgency: unknown): UrgencyKey {
  const aliases: Record<string, UrgencyKey> = {
    after_hours: "expedited",
    urgent: "rush",
    rush: "rush",
    same_day: "same_day",
    expedited: "expedited",
    weekend: "weekend",
    holiday: "holiday",
    standard: "standard",
  };
  return aliases[String(urgency ?? "standard").toLowerCase().trim()] ?? "standard";
}

function normalizeShipping(shipping: unknown): ShippingKey {
  const aliases: Record<string, ShippingKey> = {
    none: "none",
    standard: "standard_domestic",
    standard_domestic: "standard_domestic",
    domestic: "standard_domestic",
    expedited: "expedited_domestic",
    expedited_domestic: "expedited_domestic",
    overnight: "expedited_domestic",
    international: "international",
    dhl: "international",
  };
  return aliases[String(shipping ?? "none").toLowerCase().trim()] ?? "none";
}

export interface PriceBreakdownItem {
  key: string;
  label: string;
  amount: number;
  internal_only: boolean;
}

export interface PriceResult {
  tier: Tier;
  tier_label: string;
  base: number;
  total: number;
  quoted_price: number;
  final_price: number;
  retainer: number;
  balance: number;
  breakdown: PriceBreakdownItem[];
  internal: {
    clean_draft_applied: boolean;
    document_count: number;
    additional_documents: number;
    signer_count: number;
    additional_signers: number;
    notarized_signature_count: number;
    international_signer_count: number;
    jurisdiction_count: number;
    apostille_count: number;
    apostille_total: number;
    urgency: UrgencyKey;
    shipping: ShippingKey;
    manual_adjustment: number;
    witness_count: number;
    witness_type: "ron" | "in_person";
    witness_total: number;
    after_hours: boolean;
  };
}

export interface PriceInput {
  tier?: unknown;
  clean_draft?: unknown;
  cleanDraft?: unknown;
  client_doc_ready?: unknown;
  document_count?: unknown;
  documentCount?: unknown;
  signer_count?: unknown;
  signerCount?: unknown;
  notarized_signature_count?: unknown;
  signature_count?: unknown;
  signatureCount?: unknown;
  international_signer_count?: unknown;
  internationalSignerCount?: unknown;
  jurisdiction_count?: unknown;
  jurisdictionCount?: unknown;
  apostille_count?: unknown;
  apostilleCount?: unknown;
  apostille_required?: unknown;
  urgency?: unknown;
  timeline?: unknown;
  shipping?: unknown;
  dispatch?: unknown;
  executive_state_handling?: unknown;
  in_person_state_handling?: unknown;
  direct_state_handling?: unknown;
  fbi_apostille?: unknown;
  fbiApostille?: unknown;
  manual_adjustment?: unknown;
  manualAdjustment?: unknown;
  witness_count?: unknown;
  witnesses?: unknown;
  witness_type?: unknown;
  after_hours?: unknown;
}

export function calculatePrice(params: PriceInput = {}): PriceResult {
  const tier = normalizeTier(params.tier);
  const tierConfig = TIERS[tier];
  const cleanDraft =
    toBool(params.clean_draft) || toBool(params.cleanDraft) || toBool(params.client_doc_ready);

  const documentCount = Math.max(1, toInt(params.document_count ?? params.documentCount, 1));
  const signerCount = Math.max(1, toInt(params.signer_count ?? params.signerCount, 1));
  const notarizedSigCount = Math.max(
    0,
    toNonNegativeInt(
      params.notarized_signature_count ?? params.signature_count ?? params.signatureCount,
      0,
    ),
  );
  const intlSignerCount = Math.max(
    0,
    toNonNegativeInt(params.international_signer_count ?? params.internationalSignerCount, 0),
  );
  const jurisdictionCount = Math.max(
    1,
    toInt(params.jurisdiction_count ?? params.jurisdictionCount, 1),
  );
  const requestedApostilleCount = Math.max(
    0,
    toNonNegativeInt(
      params.apostille_count ?? params.apostilleCount,
      toBool(params.apostille_required) ? documentCount : 0,
    ),
  );
  const apostilleCount = Math.min(documentCount, requestedApostilleCount);
  const urgency = normalizeUrgency(params.urgency ?? params.timeline);
  const shipping = normalizeShipping(params.shipping ?? params.dispatch);
  const executiveStateHandling =
    toBool(params.executive_state_handling) ||
    toBool(params.in_person_state_handling) ||
    toBool(params.direct_state_handling);
  const fbiApostille = toBool(params.fbi_apostille) || toBool(params.fbiApostille);
  const manualAdj = Number(params.manual_adjustment ?? params.manualAdjustment ?? 0) || 0;
  const witnessCount = Math.max(
    0,
    toNonNegativeInt(params.witness_count ?? params.witnesses, 0),
  );
  const witnessType: "ron" | "in_person" =
    String(params.witness_type ?? "ron").toLowerCase() === "in_person"
      ? "in_person"
      : "ron";
  const afterHours = toBool(params.after_hours);

  const breakdown: PriceBreakdownItem[] = [];
  const base = tierConfig.base;
  breakdown.push({
    key: "base",
    label: `${tierConfig.label} — first document${apostilleCount > 0 ? " + first apostille coordination" : ""}`,
    amount: base,
    internal_only: false,
  });

  let total = base;

  // A document receiving the +$250 additional-apostille charge does not also
  // receive the generic +$75 additional-document charge.
  const additionalApostilleDocuments = Math.max(0, apostilleCount - 1);
  let apostilleTotal = 0;
  if (additionalApostilleDocuments > 0) {
    apostilleTotal = additionalApostilleDocuments * APOSTILLE_FEES.additional;
    breakdown.push({
      key: "additional_apostille_documents",
      label: `Additional apostille documents (${additionalApostilleDocuments})`,
      amount: apostilleTotal,
      internal_only: false,
    });
    total += apostilleTotal;
  }

  const documentsCoveredByBaseAndApostilles = Math.max(1, apostilleCount);
  const addlDocs = Math.max(0, documentCount - documentsCoveredByBaseAndApostilles);
  if (addlDocs > 0) {
    const amount = addlDocs * COMPLEXITY.additional_document;
    breakdown.push({
      key: "additional_documents",
      label: `Additional document handling (${addlDocs})`,
      amount,
      internal_only: false,
    });
    total += amount;
  }

  const addlSigners = Math.max(0, signerCount - 1);
  if (addlSigners > 0) {
    const amount = addlSigners * COMPLEXITY.additional_signer;
    breakdown.push({
      key: "additional_signers",
      label: `Additional signer coordination (${addlSigners})`,
      amount,
      internal_only: false,
    });
    total += amount;
  }

  if (intlSignerCount > 0) {
    const amount = intlSignerCount * COMPLEXITY.international_signer;
    breakdown.push({
      key: "international_signers",
      label: `International signer coordination (${intlSignerCount})`,
      amount,
      internal_only: false,
    });
    total += amount;
  }

  if (jurisdictionCount >= 3) {
    breakdown.push({
      key: "multi_jurisdiction",
      label: "Multi-jurisdiction handling",
      amount: COMPLEXITY.multi_jurisdiction,
      internal_only: false,
    });
    total += COMPLEXITY.multi_jurisdiction;
  }

  if (executiveStateHandling) {
    breakdown.push({
      key: "executive_state_handling",
      label: "Executive Lane — In-person state handling",
      amount: APOSTILLE_FEES.executive_in_person_state_handling,
      internal_only: false,
    });
    total += APOSTILLE_FEES.executive_in_person_state_handling;
  }

  if (fbiApostille) {
    breakdown.push({
      key: "fbi_apostille",
      label: "FBI Apostille Coordination",
      amount: APOSTILLE_FEES.fbi_apostille,
      internal_only: false,
    });
    total += APOSTILLE_FEES.fbi_apostille;
  }

  const urgencyAmount = URGENCY_FEES[urgency] ?? 0;
  if (urgencyAmount > 0) {
    breakdown.push({
      key: "urgency",
      label: `Timeline premium — ${urgency.replace(/_/g, " ")}`,
      amount: urgencyAmount,
      internal_only: false,
    });
    total += urgencyAmount;
  }

  const shippingAmount = SHIPPING_FEES[shipping] ?? 0;
  if (shippingAmount > 0) {
    breakdown.push({
      key: "shipping",
      label: `Dispatch / shipping — ${shipping.replace(/_/g, " ")}`,
      amount: shippingAmount,
      internal_only: true,
    });
    total += shippingAmount;
  }

  const witnessTotal =
    witnessCount > 0
      ? witnessCount * WITNESS_FEES[witnessType] +
        (afterHours ? WITNESS_FEES.after_hours : 0)
      : 0;
  if (witnessTotal > 0) {
    breakdown.push({
      key: "witness_support",
      label: `Witness support (${witnessCount})`,
      amount: witnessTotal,
      internal_only: true,
    });
    total += witnessTotal;
  }

  if (manualAdj !== 0) {
    breakdown.push({
      key: "manual_adjustment",
      label: "Manual pricing adjustment",
      amount: manualAdj,
      internal_only: true,
    });
    total += manualAdj;
  }

  const finalTotal = money(total);
  return {
    tier,
    tier_label: tierConfig.label,
    base: money(base),
    total: finalTotal,
    quoted_price: finalTotal,
    final_price: finalTotal,
    retainer: finalTotal,
    balance: 0,
    breakdown,
    internal: {
      clean_draft_applied: tier === "signature" && cleanDraft,
      document_count: documentCount,
      additional_documents: addlDocs,
      signer_count: signerCount,
      additional_signers: addlSigners,
      notarized_signature_count: notarizedSigCount,
      international_signer_count: intlSignerCount,
      jurisdiction_count: jurisdictionCount,
      apostille_count: apostilleCount,
      apostille_total: money(apostilleTotal),
      urgency,
      shipping,
      manual_adjustment: money(manualAdj),
      witness_count: witnessCount,
      witness_type: witnessType,
      witness_total: money(witnessTotal),
      after_hours: afterHours,
    },
  };
}

export function suggestTier(
  params: {
    document_count?: unknown;
    documentCount?: unknown;
    signer_count?: unknown;
    signerCount?: unknown;
    apostille_count?: unknown;
    apostilleCount?: unknown;
    international_signer_count?: unknown;
    internationalSignerCount?: unknown;
    jurisdiction_count?: unknown;
    jurisdictionCount?: unknown;
    urgency?: unknown;
    timeline?: unknown;
    destination_country?: unknown;
    destinationCountry?: unknown;
  } = {},
): Tier {
  const docCount = Math.max(1, toInt(params.document_count ?? params.documentCount, 1));
  const signerCount = Math.max(1, toInt(params.signer_count ?? params.signerCount, 1));
  const apostilleCount = Math.max(0, toInt(params.apostille_count ?? params.apostilleCount, 0));
  const intlSignerCount = Math.max(
    0,
    toInt(params.international_signer_count ?? params.internationalSignerCount, 0),
  );
  const jurisdictionCount = Math.max(
    1,
    toInt(params.jurisdiction_count ?? params.jurisdictionCount, 1),
  );
  const urgency = normalizeUrgency(params.urgency ?? params.timeline);

  if (
    urgency === "rush" ||
    urgency === "same_day" ||
    urgency === "holiday" ||
    jurisdictionCount >= 3 ||
    intlSignerCount >= 1
  ) return "executive";

  if (
    urgency === "expedited" ||
    urgency === "weekend" ||
    signerCount >= 2 ||
    docCount >= 7 ||
    apostilleCount >= 7
  ) return "priority";

  return "signature";
}

export function getPublicPricingCopy() {
  return {
    headline: "Execution pricing is confirmed after review.",
    display: [
      "Matter-specific execution quote",
      "Scope reviewed before payment",
      "No public numeric price menu",
    ],
    intake_note:
      "Final pricing is confirmed only after document, origin, destination, signer, authentication, timing, and release requirements are reviewed.",
  };
}

export type ExecutionLaneId = "signature" | "priority" | "executive";

export interface ExecutionLaneConfig {
  id: ExecutionLaneId;
  label: string;
  price: number;
  turnaround: string;
  included: string[];
}

export const EXECUTION_LANES: Record<ExecutionLaneId, ExecutionLaneConfig> = {
  signature: {
    id: "signature",
    label: "Signature Lane",
    price: TIERS.signature.base,
    turnaround: "Standard",
    included: [
      "First Document Execution Coordination",
      "First Apostille Coordination When Required",
      "Secure Document Handling",
      "Courier Coordination",
      "Client Portal Access",
    ],
  },
  priority: {
    id: "priority",
    label: "Priority Lane",
    price: TIERS.priority.base,
    turnaround: "Priority",
    included: [
      "First Document Execution Coordination",
      "First Apostille Coordination When Required",
      "Priority Processing Queue",
      "Secure Document Handling",
      "Courier Coordination",
      "Client Portal Access",
      "Dedicated Coordinator Review",
    ],
  },
  executive: {
    id: "executive",
    label: "Executive Lane",
    price: TIERS.executive.base,
    turnaround: "White Glove",
    included: [
      "First Document Execution Coordination",
      "First Apostille Coordination When Required",
      "White Glove Priority Processing",
      "Secure Document Handling",
      "Courier Coordination",
      "Client Portal Access",
      "Dedicated Coordinator — Named Contact",
      "Pre-Flight Document Review",
      "Direct Coordinator Communication",
    ],
  },
};

export type PricingAddonId =
  | "apostille"
  | "rush"
  | "extraSigner"
  | "witnessRemote"
  | "witnessInPerson"
  | "translationReview"
  | "courier";

export interface PricingAddon {
  id: PricingAddonId;
  label: string;
  price: number;
  included_in_lanes: ExecutionLaneId[];
}

export const PRICING_ADDONS: Record<PricingAddonId, PricingAddon> = {
  apostille: {
    id: "apostille",
    label: "First Apostille Coordination",
    price: APOSTILLE_FEES.first,
    included_in_lanes: ["signature", "priority", "executive"],
  },
  rush: { id: "rush", label: "Rush Processing", price: URGENCY_FEES.rush, included_in_lanes: [] },
  extraSigner: { id: "extraSigner", label: "Additional Signer", price: COMPLEXITY.additional_signer, included_in_lanes: [] },
  witnessRemote: { id: "witnessRemote", label: "Remote Witness", price: WITNESS_FEES.ron, included_in_lanes: [] },
  witnessInPerson: { id: "witnessInPerson", label: "In-Person Witness", price: WITNESS_FEES.in_person, included_in_lanes: [] },
  translationReview: { id: "translationReview", label: "Translation Review", price: 150, included_in_lanes: [] },
  courier: { id: "courier", label: "International Courier", price: 0, included_in_lanes: ["signature", "priority", "executive"] },
};

export interface PricingBreakdown {
  lane: ExecutionLaneId | null;
  basePrice: number;
  retainerPaid: number;
  addOns: Array<{ id: PricingAddonId; label: string; price: number }>;
  included: string[];
  total: number;
  balanceDue: number;
  paymentStatus: "unpaid" | "partial" | "paid" | "refunded";
}

export function computePricingBreakdown(
  lane: ExecutionLaneId | null,
  addOnIds: PricingAddonId[],
  retainerPaid: number,
  paymentStatus: PricingBreakdown["paymentStatus"],
): PricingBreakdown {
  const laneConfig = lane ? EXECUTION_LANES[lane] : null;
  const basePrice = laneConfig?.price ?? 0;
  const included = laneConfig?.included ?? [];
  const addOns = addOnIds
    .filter((id) => {
      const addon = PRICING_ADDONS[id];
      return addon && lane && !addon.included_in_lanes.includes(lane);
    })
    .map((id) => {
      const addon = PRICING_ADDONS[id];
      return { id, label: addon.label, price: addon.price };
    });
  const addOnsTotal = addOns.reduce((sum, item) => sum + item.price, 0);
  const total = basePrice + addOnsTotal;
  return {
    lane,
    basePrice,
    retainerPaid,
    addOns,
    included,
    total,
    balanceDue: Math.max(0, total - retainerPaid),
    paymentStatus,
  };
}
