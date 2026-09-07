import { APOSTILLE_FEES, TIERS } from "@/lib/pricing";
import {
  calculateCourierCharge,
  normalizeCourierCreditTier,
  type CourierCreditTier,
} from "@/lib/shippo/courierCredit";

export const AUTHENTICATION_ROUTES = [
  "hague_apostille",
  "state_authentication",
  "federal_authentication",
  "consular_legalization",
  "mixed_route",
  "review_required",
] as const;

export type AuthenticationRoute = (typeof AUTHENTICATION_ROUTES)[number];
export type AuthenticationPriceStatus =
  | "confirmed"
  | "pending_authority_confirmation"
  | "operator_review"
  | "waived";

export interface AuthenticationPriceLine {
  type: string;
  label: string;
  amountCents: number | null;
  status: AuthenticationPriceStatus;
  evidenceSource: string;
}

export function normalizeAuthenticationRoute(value: unknown): AuthenticationRoute {
  const route = String(value ?? "").trim().toLowerCase();
  return AUTHENTICATION_ROUTES.includes(route as AuthenticationRoute)
    ? (route as AuthenticationRoute)
    : "review_required";
}

function dollarsToCents(value: number): number {
  return Math.round(value * 100);
}

export function calculateMatterPricing(input: {
  executionTier: unknown;
  authenticationRoute: unknown;
  authentication: AuthenticationPriceLine[];
  shippoRate: {
    amount: string;
    currency: string;
    carrier: string;
    serviceLevel: string;
    estimatedDays?: number | null;
    rateId: string;
  } | null;
  discountCents: number;
  paymentPlan: "full" | "split_50_50";
}) {
  const tier: CourierCreditTier = normalizeCourierCreditTier(input.executionTier);
  const route = normalizeAuthenticationRoute(input.authenticationRoute);
  const executionAmountCents = dollarsToCents(TIERS[tier].base);
  const unresolved = input.authentication.some(
    (line) => line.status !== "confirmed" && line.status !== "waived",
  );
  const authenticationCents = input.authentication.reduce(
    (sum, line) => sum + (line.status === "confirmed" && line.amountCents != null ? line.amountCents : 0),
    0,
  );
  const courier = input.shippoRate
    ? calculateCourierCharge({
        providerRateAmount: input.shippoRate.amount,
        currency: input.shippoRate.currency,
        tier,
      })
    : null;
  const courierCents = courier?.clientCourierChargeCents ?? 0;
  const subtotal = executionAmountCents + authenticationCents + courierCents;
  const discount = Math.max(0, Math.min(Math.trunc(input.discountCents), subtotal));
  const total = subtotal - discount;
  const amountDueNow = input.paymentPlan === "split_50_50" ? Math.round(total / 2) : total;
  const finalPriceConfirmed = route !== "review_required" && !unresolved && courier !== null;

  return {
    execution: { tier, label: TIERS[tier].label, amountCents: executionAmountCents },
    route: { type: route, status: route === "review_required" ? "operator_review" : "confirmed" },
    authentication: input.authentication,
    courier: courier && input.shippoRate ? {
      rateAmountCents: courier.providerRateAmountCents,
      tierCreditCents: courier.tierCourierCreditCents,
      clientChargeCents: courierCents,
      carrier: input.shippoRate.carrier,
      serviceLevel: input.shippoRate.serviceLevel,
      estimatedDays: input.shippoRate.estimatedDays ?? null,
      rateId: input.shippoRate.rateId,
    } : null,
    discount: { amountCents: discount },
    subtotalCents: subtotal,
    totalCents: total,
    amountDueNowCents: amountDueNow,
    balanceRemainingCents: total - amountDueNow,
    currency: input.shippoRate?.currency.toUpperCase() ?? "USD",
    finalPriceConfirmed,
  };
}

export const CURRENT_HAGUE_APOSTILLE_AMOUNT_CENTS = dollarsToCents(APOSTILLE_FEES.first);
