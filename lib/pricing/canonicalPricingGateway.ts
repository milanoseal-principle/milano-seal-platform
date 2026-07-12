// Canonical Pricing Gateway — the single entry point for quoting.
//
// It does NOT hold its own price constants. Consumer-tier final prices delegate
// to the CONTROLLING engine (lib/pricing.ts → calculatePrice). Government,
// Enterprise, and Alliance categories intentionally do NOT auto-produce a final
// price — they return manual-review results, honoring the rule that revenue
// lanes and rate models may supply inputs but not a separate final-price truth.

import { calculatePrice } from "../pricing";

export type PricingCategory = "consumer" | "government" | "enterprise" | "alliance";

export type ConsumerTier = "Signature" | "Priority" | "Executive";
export type GovernmentRateKind = "hourly" | "overtime" | "standby" | "project" | "task_order";
export type EnterpriseModel = "custom_scope" | "retainer" | "project";
export type AllianceModel = "planning_input"; // planning only — never a public final price

export type ConsumerQuoteInput = Parameters<typeof calculatePrice>[0];

export interface CanonicalQuoteResult {
  category: PricingCategory;
  /** Present ONLY for consumer category (delegated controlling result). */
  consumer?: ReturnType<typeof calculatePrice>;
  manualReviewRequired: boolean;
  manualReviewReasons: string[];
  /** Never rendered publicly. Partner payout / margin stay internal. */
  internalOnly: boolean;
  publicDisplay: string;
}

// Situations that must never auto-produce a final quote.
export interface QuoteContext {
  regulatedUseCase?: boolean;
  courtMatter?: boolean;
  consularMatter?: boolean;
  custodyMatter?: boolean;
  immigrationMatter?: boolean;
  fingerprintOrOri?: boolean;
  receivingAuthorityUncertain?: boolean;
}

function manualReviewReasons(ctx: QuoteContext): string[] {
  const r: string[] = [];
  if (ctx.regulatedUseCase) r.push("Regulated use case — operator review required");
  if (ctx.courtMatter) r.push("Court matter — manual review");
  if (ctx.consularMatter) r.push("Consular matter — manual review");
  if (ctx.custodyMatter) r.push("Custody matter — manual review");
  if (ctx.immigrationMatter) r.push("Immigration matter — manual review");
  if (ctx.fingerprintOrOri) r.push("Fingerprint / ORI routing — manual review");
  if (ctx.receivingAuthorityUncertain) r.push("Receiving-authority requirements unverified — manual review");
  return r;
}

/** Consumer quote — delegates to the controlling engine unless context forces review. */
export function quoteConsumer(
  input: ConsumerQuoteInput,
  ctx: QuoteContext = {},
): CanonicalQuoteResult {
  const reasons = manualReviewReasons(ctx);
  if (reasons.length) {
    return {
      category: "consumer",
      manualReviewRequired: true,
      manualReviewReasons: reasons,
      internalOnly: false,
      publicDisplay: "Quote issued after review",
    };
  }
  return {
    category: "consumer",
    consumer: calculatePrice(input),
    manualReviewRequired: false,
    manualReviewReasons: [],
    internalOnly: false,
    publicDisplay: "Quote issued after review",
  };
}

/** Government / Enterprise / Alliance — no auto final price; operator prepares the quote. */
export function quoteNonConsumer(
  category: Exclude<PricingCategory, "consumer">,
  ctx: QuoteContext = {},
): CanonicalQuoteResult {
  const reasons = [
    `${category} pricing is operator-prepared — no automatic final quote`,
    ...manualReviewReasons(ctx),
  ];
  return {
    category,
    manualReviewRequired: true,
    manualReviewReasons: reasons,
    internalOnly: true, // rates, payouts, margin stay internal
    publicDisplay: "Quote issued after review",
  };
}
