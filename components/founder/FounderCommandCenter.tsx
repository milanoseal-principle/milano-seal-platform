"use client";

import type { DailyCommandSummary } from "@/lib/founder-os/types";

const card = "rounded-2xl border border-amber-300/15 bg-black/50 p-4";

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className={card}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-amber-100">{value}</p>
      {hint && <p className="mt-1 text-[10px] text-stone-500">{hint}</p>}
    </div>
  );
}

function usd(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function FounderCommandCenter({ summary }: { summary: DailyCommandSummary }) {
  const revenueHint =
    summary.dataKind === "actual"
      ? undefined
      : summary.revenueToday === null
        ? "no confirmed revenue"
        : "sample — not actual";

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Founder Command Center · {summary.date}
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          {summary.dataKind === "actual" ? "Actual" : "Internal sample data"}
        </span>
      </div>

      <p className="mb-4 rounded-xl border border-amber-300/20 bg-black/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-amber-200/70">
        {summary.headline}
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Metric label="revenue_today" value={usd(summary.revenueToday)} hint={revenueHint} />
        <Metric label="open_quotes" value={String(summary.openQuotes)} />
        <Metric label="follow_ups_due" value={String(summary.followUpsDue)} />
        <Metric label="follow_ups_overdue" value={String(summary.followUpsOverdue)} />
        <Metric label="high_value_matters" value={String(summary.highValueMatters)} />
        <Metric label="content_due" value={String(summary.contentDue)} />
      </div>
    </section>
  );
}
