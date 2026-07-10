"use client";

import type { PartnerPaymentItem } from "@/lib/dispatch/types";
import {
  awaitingFounderApproval,
  totalPendingApproval,
  usd,
} from "@/lib/dispatch/partnerPaymentQueue";

export function PartnerPaymentQueue({
  items = [],
}: {
  items?: PartnerPaymentItem[];
}) {
  const pending = awaitingFounderApproval(items);

  return (
    <section className="rounded-2xl border border-amber-300/25 bg-black/50 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Partner Payment Queue
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Tracking list only. This never processes payments and never touches
        Wise. Every item requires explicit founder approval before any payout.
        No auto-pay.
      </p>

      <p className="mb-3 rounded-xl border border-amber-300/20 bg-black/40 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-amber-200/70">
        Awaiting founder approval: {usd(totalPendingApproval(items))} · {pending.length} item(s)
      </p>

      {items.length === 0 ? (
        <p className="rounded-xl border border-amber-300/10 bg-black/40 px-3 py-6 text-center text-xs text-stone-500">
          No partner payments accrued yet.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <div
              key={i.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs"
            >
              <span className="font-mono text-amber-100">{i.partnerId}</span>
              <span className="text-stone-400">{usd(i.amountCents)} {i.currency}</span>
              <span className="uppercase tracking-[0.14em] text-amber-200/60">{i.status}</span>
              <span
                className={
                  i.founderApproved
                    ? "rounded-full border border-emerald-400/25 bg-emerald-400/5 px-2 py-0.5 text-[10px] text-emerald-200"
                    : "rounded-full border border-red-400/25 bg-red-400/5 px-2 py-0.5 text-[10px] text-red-200"
                }
              >
                {i.founderApproved ? "approved" : "needs founder approval"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
