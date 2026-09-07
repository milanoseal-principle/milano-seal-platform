import { TIERS } from "@/lib/pricing";

export type CourierCreditTier = keyof typeof TIERS;

const CREDIT_CENTS: Record<CourierCreditTier, number> = {
  signature: 0,
  priority: 5_000,
  executive: 10_000,
};

export interface CourierCharge {
  providerRateAmountCents: number;
  tierCourierCreditCents: number;
  clientCourierChargeCents: number;
  providerRateAmount: string;
  tierCourierCredit: string;
  clientCourierCharge: string;
  currency: string;
}

export function normalizeCourierCreditTier(value: unknown): CourierCreditTier {
  const tier = String(value ?? "").trim().toLowerCase();
  if (tier === "signature" || tier === "priority" || tier === "executive") {
    return tier;
  }
  throw new Error("INVALID_EXECUTION_TIER");
}

function parseMoneyToCents(value: string): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) {
    throw new Error("INVALID_PROVIDER_RATE");
  }
  const [whole, fraction = ""] = value.trim().split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function formatCents(value: number): string {
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`;
}

export function calculateCourierCharge(params: {
  providerRateAmount: string;
  currency: string;
  tier: unknown;
}): CourierCharge {
  const currency = params.currency.trim().toUpperCase();
  if (currency !== "USD") throw new Error("COURIER_CURRENCY_REVIEW_REQUIRED");
  const rateCents = parseMoneyToCents(params.providerRateAmount);
  const creditCents = Math.min(rateCents, CREDIT_CENTS[normalizeCourierCreditTier(params.tier)]);
  return {
    providerRateAmountCents: rateCents,
    tierCourierCreditCents: creditCents,
    clientCourierChargeCents: rateCents - creditCents,
    providerRateAmount: formatCents(rateCents),
    tierCourierCredit: formatCents(creditCents),
    clientCourierCharge: formatCents(rateCents - creditCents),
    currency,
  };
}
