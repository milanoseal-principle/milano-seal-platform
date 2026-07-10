"use client";

import type { PipelineItem } from "@/lib/founder-os/types";

const HIGH_VALUE_THRESHOLD = 5000;

function usd(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function HighValueMatterQueue({
  items = [],
  threshold = HIGH_VALUE_THRESHOLD,
}: {
  items?: PipelineItem[];
  threshold?: number;
}) {
  const matters = items
    .filter(
      (i) =>
        i.stage !== "won" &&
        i.stage !== "lost" &&
        typeof i.value === "number" &&
        Number.isFinite(i.value) &&
        (i.value as number) >= threshold,
    )
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          High-Value Matter Queue
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Internal sample data — not actual
        </span>
      </div>

      {matters.length === 0 ? (
        <p className="rounded-xl border border-dashed border-amber-300/15 bg-black/30 p-4 text-sm text-stone-500">
          No open matters at or above {usd(threshold)}.
        </p>
      ) : (
        <div className="space-y-2">
          {matters.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-xl border border-amber-300/10 bg-black/40 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-amber-100">{m.name}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-amber-200/50">
                  {m.channel} · {m.stage}
                </p>
              </div>
              <p className="text-sm font-semibold text-amber-100">{usd(m.value)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
