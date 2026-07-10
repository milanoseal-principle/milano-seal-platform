"use client";

import type { AvailabilitySlot } from "@/lib/dispatch/types";
import { openSlots, slotsByPartner } from "@/lib/dispatch/availability";

export function AvailabilityBoard({
  slots = [],
}: {
  slots?: AvailabilitySlot[];
}) {
  const byPartner = slotsByPartner(slots);
  const partnerIds = Object.keys(byPartner);

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Availability Board
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Self-declared openness to receive offers. Open slots are not a promise
        of work; booked slots are not a guarantee of pay.
      </p>

      {partnerIds.length === 0 ? (
        <p className="rounded-xl border border-amber-300/10 bg-black/40 px-3 py-6 text-center text-xs text-stone-500">
          No availability posted yet.
        </p>
      ) : (
        <div className="space-y-2">
          {partnerIds.map((pid) => (
            <div
              key={pid}
              className="flex items-center justify-between gap-2 rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs"
            >
              <span className="font-mono text-amber-100">{pid}</span>
              <span className="text-amber-200/60">
                {openSlots(byPartner[pid]).length} open · {byPartner[pid].length} total
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
