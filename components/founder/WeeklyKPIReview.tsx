"use client";

import type { KpiSnapshot } from "@/lib/founder-os/types";

function fmt(value: number | null, unit: KpiSnapshot["unit"]): string {
  if (value === null || !Number.isFinite(value)) return "—";
  if (unit === "usd") return "$" + Math.round(value).toLocaleString("en-US");
  if (unit === "percent") return `${Math.round(value)}%`;
  return String(value);
}

export function WeeklyKPIReview({ kpis = [] }: { kpis?: KpiSnapshot[] }) {
  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Weekly KPI Review
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Actuals vs. targets · targets are projections, not actuals
        </span>
      </div>

      {kpis.length === 0 ? (
        <p className="rounded-xl border border-dashed border-amber-300/15 bg-black/30 p-4 text-sm text-stone-500">
          No KPIs measured yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-amber-300/10 bg-black/40 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-amber-200/60">{k.label}</p>
              <p className="mt-1 text-xl font-semibold text-amber-100">
                {fmt(k.actual, k.unit)}
              </p>
              <p className="mt-1 text-[10px] text-stone-500">
                {k.actual === null ? "not yet measured" : k.dataKind === "actual" ? "actual" : "sample — not actual"}
                {k.target !== null && ` · target ${fmt(k.target, k.unit)} (projection)`}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
