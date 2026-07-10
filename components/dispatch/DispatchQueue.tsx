"use client";

import type { DispatchJob } from "@/lib/dispatch/types";
import { prioritizeQueue } from "@/lib/dispatch/dispatchQueue";

export function DispatchQueue({
  jobs = [],
}: {
  jobs?: DispatchJob[];
}) {
  const ordered = prioritizeQueue(jobs);

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Dispatch Queue
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Jobs awaiting an offer to an independent partner. Only opaque references
        are shown — never internal matter details or storage paths.
      </p>

      {ordered.length === 0 ? (
        <p className="rounded-xl border border-amber-300/10 bg-black/40 px-3 py-6 text-center text-xs text-stone-500">
          No jobs in the queue.
        </p>
      ) : (
        <div className="space-y-2">
          {ordered.map((j) => (
            <div
              key={j.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs"
            >
              <span className="font-mono text-amber-100">{j.reference}</span>
              <span className="text-stone-400">{j.region}</span>
              <span className="flex-1 text-stone-500">{j.capability}</span>
              <span className="uppercase tracking-[0.14em] text-amber-200/60">
                {j.priority} · {j.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
