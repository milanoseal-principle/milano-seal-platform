/**
 * revenueOpportunity — canonical revenue record + events. Actual revenue uses
 * verified payment events only; quoted value is not paid; unknown stays null;
 * sample excluded from real KPIs.
 */

import type { RevenueChannel, RevenueModel, CommercialAccountStatus } from "@/lib/revenue-stack/types";

export type RevenueEventType =
  | "lead_created"
  | "intake_started"
  | "intake_completed"
  | "review_purchased"
  | "quote_created"
  | "quote_sent"
  | "payment_requested"
  | "payment_confirmed"
  | "execution_started"
  | "matter_completed"
  | "referral_received"
  | "repeat_matter_created"
  | "commercial_account_started"
  | "retainer_started"
  | "retainer_renewed"
  | "account_expanded"
  | "partner_cost_recorded"
  | "third_party_cost_recorded"
  | "refund_recorded"
  | "writeoff_recorded";

/** Events that represent verified actual revenue. */
export const ACTUAL_REVENUE_EVENTS: RevenueEventType[] = ["payment_confirmed"];

export interface RevenueOpportunity {
  id: string;
  matterId: string | null;
  organizationId: string | null;
  channel: RevenueChannel;
  revenueModel: RevenueModel;
  stage: CommercialAccountStatus;
  quotedValue: number | null;
  paidValue: number | null;
  recurringMonthlyValue: number | null;
  paymentConfirmed: boolean;
  owner: string | null;
  nextAction: string | null;
  isSample: boolean;
}

export const REVENUE_OPPORTUNITY_REGISTRY: RevenueOpportunity[] = [];

/** Real paid revenue only — quotes and samples excluded. */
export function realPaidRevenue(): number {
  return REVENUE_OPPORTUNITY_REGISTRY
    .filter((o) => o.paymentConfirmed && !o.isSample)
    .reduce((s, o) => s + (o.paidValue ?? 0), 0);
}

/** Whether an event type counts as verified actual revenue. */
export function isActualRevenueEvent(event: RevenueEventType): boolean {
  return ACTUAL_REVENUE_EVENTS.includes(event);
}
