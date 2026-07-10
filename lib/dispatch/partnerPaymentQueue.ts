// Partner payment QUEUE — tracking model ONLY.
//
// This module DOES NOT process payments and NEVER touches Wise. It is a
// read-only tracking list of amounts owed to independent partners for
// completed, QA-approved work. Every item requires explicit FOUNDER APPROVAL
// before any payout is initiated elsewhere. No auto-pay, ever.

import type { PartnerPaymentItem, PartnerPaymentStatus } from "./types";

export function usd(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Total (in cents) still awaiting founder approval.
export function totalPendingApproval(items: PartnerPaymentItem[]): number {
  return items
    .filter((i) => !i.founderApproved && i.status !== "on_hold")
    .reduce((sum, i) => sum + i.amountCents, 0);
}

export function totalByStatus(
  items: PartnerPaymentItem[],
): Record<PartnerPaymentStatus, number> {
  const out = {
    owed: 0,
    pending_founder_approval: 0,
    approved: 0,
    on_hold: 0,
  } as Record<PartnerPaymentStatus, number>;
  for (const i of items) out[i.status] += i.amountCents;
  return out;
}

// Items still needing a founder decision.
export function awaitingFounderApproval(
  items: PartnerPaymentItem[],
): PartnerPaymentItem[] {
  return items.filter(
    (i) =>
      !i.founderApproved &&
      (i.status === "owed" || i.status === "pending_founder_approval"),
  );
}

// Guard: nothing may be treated as payable until a founder has approved it.
export function isPayoutAuthorized(item: PartnerPaymentItem): boolean {
  return item.founderApproved && item.status === "approved";
}
