"use client";

import type { PipelineItem } from "@/lib/founder-os/types";

function usd(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function PendingQuotesPanel({ quotes = [] }: { quotes?: PipelineItem[] }) {
  const total = quotes.reduce(
    (sum, q) => sum + (typeof q.value === "number" && Number.isFinite(q.value) ? q.value : 0),
    0,
  );

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Pending Quotes
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Internal sample data — not actual
        </span>
      </div>

      {quotes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-amber-300/15 bg-black/30 p-4 text-sm text-stone-500">
          No pending quotes.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between rounded-xl border border-amber-300/10 bg-black/40 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-amber-100">{q.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-amber-200/50">
                    {q.channel} · {q.stage}
                  </p>
                </div>
                <p className="text-sm font-semibold text-amber-100">{usd(q.value)}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-right text-[11px] uppercase tracking-[0.14em] text-amber-200/60">
            Total pipeline value: {usd(total)}
          </p>
        </>
      )}
    </section>
  );
}
