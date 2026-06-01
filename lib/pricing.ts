// INTERNAL PRICING ENGINE — DO NOT EXPOSE TO FRONTEND
// Shared pricing constants consumed by dashboard, portal invoice, and payment gate.
// Never expose margin, base_cost, or internal notes to client surfaces.
export type ExecutionLane =
  | "RON_SIMPLE"
  | "MOBILE_STANDARD"
  | "Signature"
  | "Priority"
  | "Executive";

// ─────────────────────────────────────────────────────────────────────────────
// Canonical tier constants — single source of truth
// ─────────────────────────────────────────────────────────────────────────────
export const TIERS = {
  signature: {
    base: 750,
    clean_draft_override: 600,
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
  notarized_signature: 25,
  international_signer: 200,
  multi_jurisdiction: 300,
} as const;

export const APOSTILLE_FEES = {
  first: 250,
  additional: 150,
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

type Tier = keyof typeof TIERS;
type UrgencyKey = keyof typeof URGENCY_FEES;
type ShippingKey = keyof typeof SHIPPING_FEES;

function toInt(value: unknown, fallback = 0): number {
  const parsed = parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
  return (
    aliases[String(urgency ?? "standard").toLowerCase().trim()] ?? "standard"
  );
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
    ron_cost: number;
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
}

export function calculatePrice(params: PriceInput = {}): PriceResult {
  const tier = normalizeTier(params.tier);
  const tierConfig = TIERS[tier];
  const cleanDraft =
    toBool(params.clean_draft) ||
    toBool(params.cleanDraft) ||
    toBool(params.client_doc_ready);

  const documentCount = Math.max(
    1,
    toInt(params.document_count ?? params.documentCount, 1),
  );
  const signerCount = Math.max(
    1,
    toInt(params.signer_count ?? params.signerCount, 1),
  );
  const notarizedSigCount = Math.max(
    0,
    toInt(
      params.notarized_signature_count ??
        params.signature_count ??
        params.signatureCount,
      signerCount,
    ),
  );
  const intlSignerCount = Math.max(
    0,
    toInt(
      params.international_signer_count ?? params.internationalSignerCount,
      0,
    ),
  );
  const jurisdictionCount = Math.max(
    1,
    toInt(params.jurisdiction_count ?? params.jurisdictionCount, 1),
  );
  const apostilleCount = Math.max(
    0,
    toInt(
      params.apostille_count ?? params.apostilleCount,
      toBool(params.apostille_required) ? 1 : 0,
    ),
  );
  const urgency = normalizeUrgency(params.urgency ?? params.timeline);
  const shipping = normalizeShipping(params.shipping ?? params.dispatch);
  const executiveStateHandling =
    toBool(params.executive_state_handling) ||
    toBool(params.in_person_state_handling) ||
    toBool(params.direct_state_handling);
  const fbiApostille =
    toBool(params.fbi_apostille) || toBool(params.fbiApostille);
  const manualAdj =
    Number(params.manual_adjustment ?? params.manualAdjustment ?? 0) || 0;

  const breakdown: PriceBreakdownItem[] = [];
  let base: number;

  if (tier === "signature" && cleanDraft) {
    base = TIERS.signature.clean_draft_override;
    breakdown.push({
      key: "base",
      label: "Signature Lane — Clean Draft Override",
      amount: base,
      internal_only: true,
    });
  } else {
    base = tierConfig.base;
    breakdown.push({
      key: "base",
      label: `${tierConfig.label} — Base`,
      amount: base,
      internal_only: false,
    });
  }

  let total = base;

  const addlDocs = Math.max(0, documentCount - 1);
  if (addlDocs > 0) {
    const amt = addlDocs * COMPLEXITY.additional_document;
    breakdown.push({
      key: "additional_documents",
      label: `Additional document handling (${addlDocs})`,
      amount: amt,
      internal_only: false,
    });
    total += amt;
  }

  const addlSigners = Math.max(0, signerCount - 1);
  if (addlSigners > 0) {
    const amt = addlSigners * COMPLEXITY.additional_signer;
    breakdown.push({
      key: "additional_signers",
      label: `Additional signer coordination (${addlSigners})`,
      amount: amt,
      internal_only: false,
    });
    total += amt;
  }

  if (notarizedSigCount > 0) {
    const amt = notarizedSigCount * COMPLEXITY.notarized_signature;
    breakdown.push({
      key: "notarized_signatures",
      label: `Notarized signature tracking (${notarizedSigCount})`,
      amount: amt,
      internal_only: true,
    });
    total += amt;
  }

  if (intlSignerCount > 0) {
    const amt = intlSignerCount * COMPLEXITY.international_signer;
    breakdown.push({
      key: "international_signers",
      label: `International signer coordination (${intlSignerCount})`,
      amount: amt,
      internal_only: false,
    });
    total += amt;
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

  let apostilleTotal = 0;
  if (apostilleCount > 0) {
    apostilleTotal =
      APOSTILLE_FEES.first +
      Math.max(0, apostilleCount - 1) * APOSTILLE_FEES.additional;
    breakdown.push({
      key: "apostille",
      label: `Apostille coordination (${apostilleCount})`,
      amount: apostilleTotal,
      internal_only: false,
    });
    total += apostilleTotal;
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

  const urgencyAmt = URGENCY_FEES[urgency] ?? 0;
  if (urgencyAmt > 0) {
    breakdown.push({
      key: "urgency",
      label: `Timeline premium — ${urgency.replace(/_/g, " ")}`,
      amount: urgencyAmt,
      internal_only: false,
    });
    total += urgencyAmt;
  }

  const shippingAmt = SHIPPING_FEES[shipping] ?? 0;
  if (shippingAmt > 0) {
    breakdown.push({
      key: "shipping",
      label: `Dispatch / shipping — ${shipping.replace(/_/g, " ")}`,
      amount: shippingAmt,
      internal_only: true,
    });
    total += shippingAmt;
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
      ron_cost: money(notarizedSigCount * 25),
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
  const docCount = Math.max(
    1,
    toInt(params.document_count ?? params.documentCount, 1),
  );
  const signerCount = Math.max(
    1,
    toInt(params.signer_count ?? params.signerCount, 1),
  );
  const apostilleCount = Math.max(
    0,
    toInt(params.apostille_count ?? params.apostilleCount, 0),
  );
  const intlSignerCount = Math.max(
    0,
    toInt(
      params.international_signer_count ?? params.internationalSignerCount,
      0,
    ),
  );
  const jurisdictionCount = Math.max(
    1,
    toInt(params.jurisdiction_count ?? params.jurisdictionCount, 1),
  );
  const urgency = normalizeUrgency(params.urgency ?? params.timeline);
  const country = String(
    params.destination_country ?? params.destinationCountry ?? "",
  )
    .toLowerCase()
    .trim();
  const isInternational =
    country &&
    country !== "united states" &&
    country !== "us" &&
    country !== "usa";
  const isExecutiveUrgency =
    urgency === "rush" || urgency === "same_day" || urgency === "holiday";
  const isComplex =
    docCount >= 4 ||
    signerCount >= 3 ||
    apostilleCount >= 3 ||
    intlSignerCount >= 1 ||
    jurisdictionCount >= 3;

  if (isExecutiveUrgency || isComplex) return "executive";
  if (
    isInternational ||
    urgency === "expedited" ||
    urgency === "weekend" ||
    docCount >= 2 ||
    apostilleCount >= 1
  )
    return "priority";
  return "signature";
}

export function getPublicPricingCopy() {
  return {
    headline: "Execution pricing is confirmed after review.",
    display: [
      "Signature begins at $750",
      "Priority begins at $975",
      "Executive begins at $1,850+",
    ],
    intake_note:
      "Most matters fall between $750 and $1,850+ depending on complexity and control level. Final pricing is confirmed after review.",
  };
}

export interface PricingData {
  state?: string;
  apostille?: boolean;
  docs?: number;
  mobile?: boolean;
  miles?: number;
  signers?: number;
  translation?: boolean;
  urgency?: "standard" | "urgent";
  multi_country?: boolean;
  witnesses?: number;
  witness_type?: "ron" | "in_person";
  after_hours?: boolean;
  /** Normalized origin authority type — supplied by routing-normalizer */
  origin_authority_type?: string;
  /** Raw document type — used in pricing guards */
  document_type?: string;
}

/**
 * P0 Pricing guard: if document_type is an affidavit AND origin_authority_type
 * resolved to federal_document, do NOT auto-price as federal — flag for operator review.
 * Returns true if pricing should be blocked pending operator review.
 */
export function shouldBlockFederalAffidaviitPricing(data: PricingData): boolean {
  const docType = (data.document_type || "").toLowerCase();
  const isAffidavit = docType.includes("affidavit");
  const isFederal = data.origin_authority_type === "federal_document";
  if (isAffidavit && isFederal) {
    // Only allow if document explicitly indicates federal origin
    const isExplicitlyFederal =
      docType.includes("fbi") || docType.includes("federal");
    return !isExplicitlyFederal;
  }
  return false;
}

export interface PricingResult {
  lane: ExecutionLane;
  total: number;
  base: number;
  addons: { item: string; amount: number }[];
  witness_total: number;
}

function calcWitness(data: PricingData): number {
  if (!data.witnesses) return 0;
  const base = data.witness_type === "ron" ? 35 : 55;
  return base * data.witnesses + (data.after_hours ? 37 : 0);
}

export function determineLaneAndPrice(data: PricingData): PricingResult {
  // Colorado simple RON
  if (
    data.state === "Colorado" &&
    data.apostille === false &&
    (data.docs || 1) === 1
  ) {
    const wt = calcWitness(data);
    return {
      lane: "RON_SIMPLE",
      base: 150,
      total: 150 + wt,
      addons: [],
      witness_total: wt,
    };
  }
  // Florida mobile
  if (data.state === "Florida" && data.mobile === true) {
    const mileage = (data.miles || 0) * 2;
    const base = 135 + mileage;
    const wt = calcWitness(data);
    return {
      lane: "MOBILE_STANDARD",
      base,
      total: base + wt,
      addons: [],
      witness_total: wt,
    };
  }
  let lane: ExecutionLane = "Signature";
  let base = 750;
  if ((data.signers || 1) > 1 || data.translation) {
    lane = "Priority";
    base = 975;
  }
  if (data.urgency === "urgent" || data.multi_country) {
    lane = "Executive";
    base = 1850;
  }
  const wt = calcWitness(data);
  return { lane, base, total: base + wt, addons: [], witness_total: wt };
}

// ── Execution Intelligence Expansion — Structured Pricing Layer ───────────────
// New canonical lane configs consumed by dashboard, portal invoice, payment gate.

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
    price: 750,
    turnaround: "Standard",
    included: [
      "Notarization / Document Execution",
      "Florida Apostille Filing",
      "Secure Document Handling",
      "Shippo Courier Integration",
      "Client Portal Access",
    ],
  },
  priority: {
    id: "priority",
    label: "Priority Lane",
    price: 975,
    turnaround: "Priority",
    included: [
      "Notarization / Document Execution",
      "Florida Apostille Filing",
      "Priority Processing Queue",
      "Secure Document Handling",
      "Shippo Courier Integration",
      "Client Portal Access",
      "Dedicated Coordinator Review",
    ],
  },
  executive: {
    id: "executive",
    label: "Executive Lane",
    price: 1850,
    turnaround: "White Glove",
    included: [
      "Notarization / Document Execution",
      "Florida Apostille Filing",
      "White Glove Priority Processing",
      "Secure Document Handling",
      "Shippo Courier Integration",
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
    label: "Apostille Processing",
    price: 250,
    included_in_lanes: ["signature", "priority", "executive"],
  },
  rush: {
    id: "rush",
    label: "Rush Processing",
    price: 400,
    included_in_lanes: [],
  },
  extraSigner: {
    id: "extraSigner",
    label: "Additional Signer",
    price: 150,
    included_in_lanes: [],
  },
  witnessRemote: {
    id: "witnessRemote",
    label: "Remote Witness",
    price: 50,
    included_in_lanes: [],
  },
  witnessInPerson: {
    id: "witnessInPerson",
    label: "In-Person Witness",
    price: 75,
    included_in_lanes: [],
  },
  translationReview: {
    id: "translationReview",
    label: "Translation Review",
    price: 150,
    included_in_lanes: [],
  },
  courier: {
    id: "courier",
    label: "International Courier",
    price: 0,
    included_in_lanes: ["signature", "priority", "executive"],
  },
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

  const addOnsTotal = addOns.reduce((sum, a) => sum + a.price, 0);
  const total = basePrice + addOnsTotal;
  const balanceDue = Math.max(0, total - retainerPaid);

  return {
    lane,
    basePrice,
    retainerPaid,
    addOns,
    included,
    total,
    balanceDue,
    paymentStatus,
  };
}
