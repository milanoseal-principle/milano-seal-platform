"use client";

import { flagAbandoned, hoursSince } from "@/lib/acquisition/abandonedIntake";
import type { AbandonedIntake } from "@/lib/acquisition/types";

export function AbandonedIntakeQueue({
  intakes = [],
}: {
  intakes?: AbandonedIntake[];
}) {
  const stalled = flagAbandoned(intakes);

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Abandoned Intake Queue
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          {stalled.length} stalled
        </span>
      </div>

      {stalled.length === 0 ? (
        <p className="text-xs text-stone-500">
          No stalled intakes. Intakes inactive beyond the threshold appear here.
        </p>
      ) : (
        <div className="space-y-2">
          {stalled.map((i) => (
            <div
              key={i.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs text-stone-300"
            >
              <span className="font-medium text-amber-100">
                {i.clientLabel ?? "Unnamed intake"}
              </span>
              <span className="uppercase tracking-[0.14em] text-amber-200/60">
                {i.vertical.replace(/_/g, " ")}
              </span>
              <span className="uppercase tracking-[0.14em] text-stone-500">
                {i.stage.replace(/_/g, " ")}
              </span>
              <span className="font-mono text-stone-500">
                {Math.round(hoursSince(i.lastActivityAt))}h idle
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
