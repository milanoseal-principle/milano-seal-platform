"use client";

import type { ProcurementOpportunity } from "@/lib/government/types";
import {
  classifyOpportunity,
  filterOpenOpportunities,
  summarizePipelineValue,
} from "@/lib/government/procurementOpportunityEngine";

function usd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function ProcurementOpportunityBoard({
  opportunities = [],
}: {
  opportunities?: ProcurementOpportunity[];
}) {
  const open = filterOpenOpportunities(opportunities);
  const totalValue = summarizePipelineValue(opportunities);

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Procurement Opportunity Board
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Internal sample data
        </span>
      </div>

      <div className="mb-4 flex gap-4 text-xs text-stone-400">
        <span>Open: <span className="text-amber-100">{open.length}</span></span>
        <span>Tracked value: <span className="text-amber-100">{usd(totalValue)}</span></span>
      </div>

      {opportunities.length === 0 ? (
        <p className="text-xs text-stone-500">
          No solicitations loaded. Track open bids, RFPs, RFQs, and renewals here.
        </p>
      ) : (
        <div className="space-y-2">
          {opportunities.map((o) => (
            <div
              key={`${o.agency}-${o.title}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs"
            >
              <span className="font-medium text-amber-100">{o.title}</span>
              <span className="text-stone-400">{o.agency}</span>
              <span className="uppercase tracking-[0.14em] text-amber-200/60">{o.type}</span>
              <span className="text-stone-400">{classifyOpportunity(o)}</span>
              <span className="text-stone-500">due {o.deadline}</span>
              <span className="text-amber-100">{usd(o.value)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
