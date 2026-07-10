"use client";

import type { RevenueRecord } from "@/lib/founder-os/types";
import { monthlyReview } from "@/lib/founder-os/revenueReview";

function usd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function MonthlyRevenueReview({ records = [] }: { records?: RevenueRecord[] }) {
  const periods = monthlyReview(records);

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Monthly Revenue Review
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Rows marked sample/projection are not actual
        </span>
      </div>

      {periods.length === 0 ? (
        <p className="rounded-xl border border-dashed border-amber-300/15 bg-black/30 p-4 text-sm text-stone-500">
          No revenue records.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.14em] text-amber-200/50">
                <th className="pb-2 pr-4">Month</th>
                <th className="pb-2 pr-4">Total</th>
                <th className="pb-2 pr-4">Records</th>
                <th className="pb-2 pr-4">Average</th>
                <th className="pb-2">Basis</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.periodKey} className="border-t border-amber-300/10">
                  <td className="py-2 pr-4 text-amber-100">{p.periodKey}</td>
                  <td className="py-2 pr-4 text-amber-100">{usd(p.total)}</td>
                  <td className="py-2 pr-4 text-stone-400">{p.count}</td>
                  <td className="py-2 pr-4 text-stone-400">{usd(p.average)}</td>
                  <td className="py-2 text-[10px] uppercase tracking-[0.12em] text-stone-500">
                    {p.actualOnly ? "actual" : p.dataKind === "projection" ? "projection — not actual" : "sample — not actual"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
