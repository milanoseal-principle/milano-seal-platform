"use client";

import type { DailyCommandSummary } from "@/lib/founder-os/types";

function usd(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function kindLabel(kind: string): string {
  if (kind === "actual") return "Actual";
  if (kind === "projection") return "Projection — not actual";
  return "Internal sample data — not actual";
}

export function DailyRevenuePanel({ summary }: { summary: DailyCommandSummary }) {
  const isActual = summary.dataKind === "actual";
  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Daily Revenue
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          {kindLabel(summary.dataKind)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-300/10 bg-black/40 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-amber-200/60">
            Revenue booked today
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-100">
            {usd(summary.revenueToday)}
          </p>
          {!isActual && (
            <p className="mt-1 text-[10px] text-stone-500">
              {summary.revenueToday === null
                ? "No confirmed revenue reported"
                : "Illustrative — not actual"}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-amber-300/10 bg-black/40 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-amber-200/60">
            Open quotes
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-100">
            {summary.openQuotes}
          </p>
          <p className="mt-1 text-[10px] text-stone-500">
            {usd(summary.openQuotesValue)} pipeline value
          </p>
        </div>
        <div className="rounded-xl border border-amber-300/10 bg-black/40 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-amber-200/60">
            High-value matters
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-100">
            {summary.highValueMatters}
          </p>
        </div>
      </div>
    </section>
  );
}
