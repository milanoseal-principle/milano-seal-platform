/**
 * procurementPricingAdapter — thin adapter over the CANONICAL pricing gateway.
 * Does NOT implement a new calculator. Government/institutional quotes are
 * operator-prepared (no automatic final price); this adapter surfaces the rate
 * schedule model and delegates quote generation to canonicalPricingGateway.
 *
 * Internal margins are never exposed. Statutory notarial fees stay separately
 * identifiable and are never merged into coordination fees.
 */

import {
  quoteNonConsumer,
  type CanonicalQuoteResult,
  type QuoteContext,
} from "@/lib/pricing/canonicalPricingGateway";

export type ProcurementPricingModel =
  | "hourly"
  | "overtime"
  | "standby"
  | "per_task"
  | "project"
  | "task_order"
  | "retainer"
  | "unit"
  | "pass_through"
  | "negotiated_enterprise"
  | "emergency_activation";

export interface RateScheduleLine {
  model: ProcurementPricingModel;
  label: string;
  /** Statutory fees flagged so they remain separately identifiable. */
  statutory?: boolean;
  /** Pass-through costs carry no markup. */
  passThrough?: boolean;
}

export const PROCUREMENT_RATE_MODELS: RateScheduleLine[] = [
  { model: "hourly", label: "Labor (per hour)" },
  { model: "overtime", label: "Labor overtime (per hour)" },
  { model: "standby", label: "Standby time (per hour)" },
  { model: "per_task", label: "Per-task coordination" },
  { model: "project", label: "Project-based" },
  { model: "task_order", label: "Task order" },
  { model: "retainer", label: "Retainer" },
  { model: "unit", label: "Unit pricing" },
  { model: "pass_through", label: "Third-party pass-through", passThrough: true },
  { model: "negotiated_enterprise", label: "Negotiated enterprise" },
  { model: "emergency_activation", label: "Emergency / after-hours activation" },
];

/**
 * Government procurement quote — always operator-prepared. Delegates to the
 * canonical gateway, which returns a manual-review result (internalOnly=true) so
 * rates, payouts, and margin stay internal. Never produces an auto public price.
 */
export function prepareProcurementQuote(ctx: QuoteContext = {}): CanonicalQuoteResult {
  return quoteNonConsumer("government", ctx);
}
