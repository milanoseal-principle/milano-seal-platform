"use client";

import type { TrustScore } from "@/lib/dispatch/types";

export function TrustScorePanel({
  scores = [],
}: {
  scores?: TrustScore[];
}) {
  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Trust Scores
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Trust scores inform which independent partners are offered work first.
        They never guarantee assignments or income.
      </p>

      {scores.length === 0 ? (
        <p className="rounded-xl border border-amber-300/10 bg-black/40 px-3 py-6 text-center text-xs text-stone-500">
          No trust scores computed yet.
        </p>
      ) : (
        <div className="space-y-2">
          {scores.map((s) => (
            <div
              key={s.partnerId}
              className="rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-amber-100">{s.partnerId}</span>
                <span className="text-amber-100">
                  {s.score} · <span className="uppercase text-amber-200/60">{s.band}</span>
                </span>
              </div>
              <p className="mt-1 text-stone-500">{s.reasons.join(" · ")}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
