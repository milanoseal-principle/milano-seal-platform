"use client";

import type { FounderReviewItem } from "@/lib/acquisition/types";

const STATUS_COLOR: Record<string, string> = {
  pending: "text-amber-200",
  reviewed: "text-emerald-300",
  dismissed: "text-stone-500",
};

const BAND_COLOR: Record<string, string> = {
  hot: "text-emerald-300",
  warm: "text-amber-200",
  cold: "text-stone-400",
};

export function FounderReviewQueue({
  items = [],
}: {
  items?: FounderReviewItem[];
}) {
  const pending = items.filter((i) => i.status === "pending").length;

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Founder Review Queue
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          {pending} pending
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-stone-500">
          No items awaiting founder review. High-priority leads flagged for a
          human look appear here.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2.5 text-xs text-stone-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-amber-100">{item.title}</span>
                <span
                  className={`uppercase tracking-[0.14em] ${STATUS_COLOR[item.status]}`}
                >
                  {item.status}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                <span className="uppercase tracking-[0.14em] text-amber-200/60">
                  {item.vertical.replace(/_/g, " ")}
                </span>
                <span className={BAND_COLOR[item.leadScore.band]}>
                  Score {item.leadScore.score} · {item.leadScore.band}
                </span>
              </div>
              {item.note && <p className="mt-1 text-stone-500">{item.note}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
