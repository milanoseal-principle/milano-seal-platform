import type { MilanoLane, PaymentMode } from "@/src/features/milano/types";

export const MILANO_PRICING = {
  lanes: {
    signature: 750,
    priority: 975,
    executive: 1850,
  },
  addOns: {
    apostilleCoordination: 275,
    rushSameDayHandling: 175,
    additionalSigner: 75,
  },
} as const;

export interface PricingInput {
  lane?: MilanoLane | string | null;
  apostilleRequired?: boolean;
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
}

function money(value: number): number {
  return Math.max(0, Math.round(value * 100) / 100);
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

  if (input.apostilleRequired) {
    addOns.push({ code: "apostille_coordination", label: "Apostille Coordination", amount: MILANO_PRICING.addOns.apostilleCoordination });
  }

  if (input.rush) {
    addOns.push({ code: "rush_same_day", label: "Rush / Same-Day Handling", amount: MILANO_PRICING.addOns.rushSameDayHandling });
  }

  const signerCount = Math.max(1, Math.floor(Number(input.signerCount ?? 1)));
  for (let index = 2; index <= signerCount; index += 1) {
    addOns.push({ code: `additional_signer_${index}`, label: "Additional Signer", amount: MILANO_PRICING.addOns.additionalSigner });
  }

  const originalTotal = money(basePrice + addOns.reduce((sum, item) => sum + item.amount, 0));
  const discountAmount = money(Math.min(originalTotal, Math.max(0, Number(input.discountAmount ?? 0))));
  const finalTotal = money(originalTotal - discountAmount);
  const split = input.paymentMode === "split_50_50";
  const depositAmount = split ? money(finalTotal / 2) : finalTotal;
  const balanceDue = split ? money(finalTotal - depositAmount) : 0;
  const paymentReference = input.matterReference ? `${input.matterReference}-${split ? "DEPOSIT" : "FULL"}` : "MS-PENDING";

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
  };
}
