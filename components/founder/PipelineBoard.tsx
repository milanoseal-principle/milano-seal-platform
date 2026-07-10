"use client";

import type { PipelineItem, PipelineStage } from "@/lib/founder-os/types";

// Shared presentational board used by the channel-specific pipeline panels.
// Pure rendering from supplied items — honest empty state, no fabricated data.

const STAGES: PipelineStage[] = [
  "identified",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
];

function usd(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function PipelineBoard({
  title,
  items = [],
  emptyLabel = "No opportunities tracked.",
}: {
  title: string;
  items?: PipelineItem[];
  emptyLabel?: string;
}) {
  const counts: Record<PipelineStage, number> = {
    identified: 0,
    contacted: 0,
    qualified: 0,
    proposal: 0,
    negotiation: 0,
    won: 0,
    lost: 0,
  };
  for (const i of items) counts[i.stage] = (counts[i.stage] ?? 0) + 1;

  const openValue = items
    .filter((i) => i.stage !== "won" && i.stage !== "lost")
    .reduce(
      (sum, i) => sum + (typeof i.value === "number" && Number.isFinite(i.value) ? i.value : 0),
      0,
    );

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          {title}
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Internal sample data — not actual
        </span>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {STAGES.map((s) => (
          <div key={s} className="rounded-lg border border-amber-300/10 bg-black/40 p-2 text-center">
            <p className="text-[9px] uppercase tracking-[0.1em] text-amber-200/50">{s}</p>
            <p className="mt-1 text-lg font-semibold text-amber-100">{counts[s]}</p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-amber-300/15 bg-black/30 p-4 text-sm text-stone-500">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <div
              key={i.id}
              className="flex items-center justify-between rounded-xl border border-amber-300/10 bg-black/40 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-amber-100">{i.name}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-amber-200/50">
                  {i.stage} · last contact {i.lastContact ?? "never"}
                </p>
              </div>
              <p className="text-sm font-semibold text-amber-100">{usd(i.value)}</p>
            </div>
          ))}
          <p className="mt-3 text-right text-[11px] uppercase tracking-[0.14em] text-amber-200/60">
            Open pipeline value: {usd(openValue)}
          </p>
        </div>
      )}
    </section>
  );
}
