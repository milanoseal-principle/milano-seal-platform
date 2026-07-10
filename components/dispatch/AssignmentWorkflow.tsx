"use client";

import type { Assignment } from "@/lib/dispatch/types";
import { isActive } from "@/lib/dispatch/assignmentWorkflow";

export function AssignmentWorkflow({
  assignments = [],
}: {
  assignments?: Assignment[];
}) {
  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Assignment Workflow
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Every assignment is an OFFER first. Independent partners may accept or
        decline — assignments are never guaranteed.
      </p>

      {assignments.length === 0 ? (
        <p className="rounded-xl border border-amber-300/10 bg-black/40 px-3 py-6 text-center text-xs text-stone-500">
          No assignment offers yet.
        </p>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs"
            >
              <span className="font-mono text-amber-100">{a.jobId}</span>
              <span className="text-stone-400">{a.partnerId}</span>
              <span className="uppercase tracking-[0.14em] text-amber-200/60">{a.state}</span>
              {isActive(a) && (
                <span className="rounded-full border border-amber-400/25 bg-amber-400/5 px-2 py-0.5 text-[10px] text-amber-200">
                  open offer
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
