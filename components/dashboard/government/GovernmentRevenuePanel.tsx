"use client";

import type { GovernmentRevenueStream } from "@/lib/government/types";

const STREAMS: { stream: GovernmentRevenueStream; label: string }[] = [
  { stream: "one_time_engagement", label: "One-time engagement" },
  { stream: "master_service_agreement", label: "Master service agreement" },
  { stream: "blanket_purchase_agreement", label: "Blanket purchase agreement" },
  { stream: "annual_contract", label: "Annual contract" },
  { stream: "emergency_contract", label: "Emergency contract" },
  { stream: "on_call_services", label: "On-call services" },
  { stream: "task_orders", label: "Task orders" },
  { stream: "department_retainer", label: "Department retainer" },
];

function usd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function GovernmentRevenuePanel({
  byStream = {},
}: {
  byStream?: Partial<Record<GovernmentRevenueStream, number>>;
}) {
  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Government Revenue Streams
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Internal sample data
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STREAMS.map(({ stream, label }) => (
          <div key={stream} className="rounded-xl border border-amber-300/10 bg-black/40 p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-amber-200/60">{label}</p>
            <p className="mt-1 text-lg font-semibold text-amber-100">
              {usd(byStream[stream] ?? 0)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
