// INTERNAL PRICING ENGINE — DO NOT EXPOSE TO FRONTEND
export type ExecutionLane =
  | "RON_SIMPLE"
  | "MOBILE_STANDARD"
  | "Signature"
  | "Priority"
  | "Executive";

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
