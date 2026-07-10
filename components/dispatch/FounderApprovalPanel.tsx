"use client";

import type { PartnerPaymentItem } from "@/lib/dispatch/types";
import {
  awaitingFounderApproval,
  totalPendingApproval,
  usd,
} from "@/lib/dispatch/partnerPaymentQueue";
import { DISPATCH_OPERATOR_RULES } from "@/lib/dispatch/dispatchSafety";

export function FounderApprovalPanel({
  items = [],
}: {
  items?: PartnerPaymentItem[];
}) {
  const pending = awaitingFounderApproval(items);

  return (
    <section className="rounded-2xl border border-amber-300/25 bg-black/50 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Founder Approval
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Partner payouts never proceed automatically. A founder must review and
        approve each item before any payment is initiated elsewhere. This panel
        does not move money and does not touch Wise.
      </p>

      <p className="mb-4 rounded-xl border border-amber-300/20 bg-black/40 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-amber-200/70">
        Pending decisions: {pending.length} · {usd(totalPendingApproval(items))}
      </p>

      <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-amber-200/60">
        Operator reminders
      </p>
      <ul className="space-y-1 text-xs text-stone-300">
        {DISPATCH_OPERATOR_RULES.map((r) => (
          <li key={r}>• {r}</li>
        ))}
      </ul>
    </section>
  );
}
