"use client";

import { getCommodityCodes } from "@/lib/government/commodityCodeRegistry";

export function CommodityCodeRegistry() {
  const codes = getCommodityCodes();

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Commodity / NAICS Code Registry
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Illustrative only. Verify every code against the specific procurement
        portal before selecting categories.
      </p>

      <div className="space-y-2">
        {codes.map((c) => (
          <div
            key={`${c.system}-${c.code}`}
            className="flex items-center justify-between gap-2 rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs"
          >
            <span className="font-mono text-amber-100">{c.code}</span>
            <span className="flex-1 text-stone-300">{c.label}</span>
            <span className="uppercase tracking-[0.14em] text-amber-200/60">{c.system}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
