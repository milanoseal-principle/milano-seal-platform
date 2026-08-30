import type { ShippoRate } from "./types";

export type MilanoShippingLane =
  | "signature"
  | "priority"
  | "executive"
  | "route_review_only"
  | "regulated_manual_review"
  | string;

export type RateSelectionPolicy =
  | "LOWEST_APPROVED_COST"
  | "BALANCED_PRIORITY"
  | "FASTEST_APPROVED";

export interface RankedShippoRate {
  rate: ShippoRate;
  rank: number;
  recommended: boolean;
  selectionPolicy: RateSelectionPolicy;
  selectionReason: string;
}

function normalizeLane(lane?: string | null): string {
  return (lane ?? "signature")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function money(rate: ShippoRate): number {
  const parsed = Number.parseFloat(rate.amount);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function days(rate: ShippoRate): number {
  return typeof rate.estimated_days === "number" && Number.isFinite(rate.estimated_days)
    ? rate.estimated_days
    : Number.POSITIVE_INFINITY;
}

function providerKey(rate: ShippoRate): string {
  return rate.provider.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function providerPriority(rate: ShippoRate, international: boolean): number {
  const provider = providerKey(rate);
  const internationalOrder = ["dhl_express", "dhl", "fedex", "ups", "usps"];
  const domesticOrder = ["ups", "fedex", "usps", "dhl_express", "dhl"];
  const order = international ? internationalOrder : domesticOrder;
  const index = order.indexOf(provider);
  return index === -1 ? order.length + 1 : index;
}

function stableRateSort(
  rates: ShippoRate[],
  compare: (left: ShippoRate, right: ShippoRate) => number,
): ShippoRate[] {
  return rates
    .map((rate, index) => ({ rate, index }))
    .sort((left, right) => compare(left.rate, right.rate) || left.index - right.index)
    .map(({ rate }) => rate);
}

export function getRateSelectionPolicy(lane?: string | null): RateSelectionPolicy {
  const normalized = normalizeLane(lane);
  if (normalized.includes("executive")) return "FASTEST_APPROVED";
  if (normalized.includes("priority")) return "BALANCED_PRIORITY";
  return "LOWEST_APPROVED_COST";
}

export function rankApprovedRates(input: {
  rates: ShippoRate[];
  lane?: MilanoShippingLane | null;
  destinationCountry?: string | null;
}): RankedShippoRate[] {
  const rates = [...input.rates];
  if (rates.length === 0) return [];

  const policy = getRateSelectionPolicy(input.lane);
  const international = (input.destinationCountry ?? "US").toUpperCase() !== "US";

  let ordered: ShippoRate[];
  let reason: string;

  if (policy === "FASTEST_APPROVED") {
    ordered = stableRateSort(rates, (left, right) =>
      days(left) - days(right) ||
      providerPriority(left, international) - providerPriority(right, international) ||
      money(left) - money(right),
    );
    reason = "Executive lane: fastest approved service, then preferred-carrier reliability, then cost.";
  } else if (policy === "BALANCED_PRIORITY") {
    const cheapest = Math.min(...rates.map(money));
    const budgetCeiling = Math.max(cheapest * 1.3, cheapest + 25);
    const valuePool = rates.filter((rate) => money(rate) <= budgetCeiling);
    const candidates = valuePool.length > 0 ? valuePool : rates;

    const preferred = stableRateSort(candidates, (left, right) =>
      days(left) - days(right) ||
      money(left) - money(right) ||
      providerPriority(left, international) - providerPriority(right, international),
    );
    const selected = preferred[0];
    const remaining = stableRateSort(
      rates.filter((rate) => rate.object_id !== selected.object_id),
      (left, right) =>
        money(left) - money(right) ||
        days(left) - days(right) ||
        providerPriority(left, international) - providerPriority(right, international),
    );
    ordered = [selected, ...remaining];
    reason = "Priority lane: fastest approved service within the governed value ceiling, avoiding unnecessary courier spend.";
  } else {
    ordered = stableRateSort(rates, (left, right) =>
      money(left) - money(right) ||
      days(left) - days(right) ||
      providerPriority(left, international) - providerPriority(right, international),
    );
    reason = "Signature lane: lowest-cost approved service, then delivery speed and preferred-carrier reliability.";
  }

  return ordered.map((rate, index) => ({
    rate,
    rank: index + 1,
    recommended: index === 0,
    selectionPolicy: policy,
    selectionReason: index === 0 ? reason : "Approved alternative retained for operator review.",
  }));
}

export function selectRecommendedRate(input: {
  rates: ShippoRate[];
  lane?: MilanoShippingLane | null;
  destinationCountry?: string | null;
}): RankedShippoRate | null {
  return rankApprovedRates(input)[0] ?? null;
}
