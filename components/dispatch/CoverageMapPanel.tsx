"use client";

import type { CoverageArea } from "@/lib/dispatch/types";
import { coveredRegions, partnersInRegion } from "@/lib/dispatch/coverageMap";

export function CoverageMapPanel({
  areas = [],
}: {
  areas?: CoverageArea[];
}) {
  const regions = coveredRegions(areas);

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Coverage Map
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Coverage reflects where independent partners are willing to receive
        offers. It never obligates the network to send work.
      </p>

      {regions.length === 0 ? (
        <p className="rounded-xl border border-amber-300/10 bg-black/40 px-3 py-6 text-center text-xs text-stone-500">
          No coverage areas declared yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {regions.map((r) => (
            <div
              key={r}
              className="flex items-center justify-between gap-2 rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs"
            >
              <span className="text-stone-300">{r}</span>
              <span className="text-amber-200/60">
                {partnersInRegion(areas, r).length} partner(s)
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
