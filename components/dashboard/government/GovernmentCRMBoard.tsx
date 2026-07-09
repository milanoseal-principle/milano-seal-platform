"use client";

import type { GovernmentCrmRecord, GovernmentPipelineStage } from "@/lib/government/types";
import { countByStage } from "@/lib/government/governmentCrmEngine";

const STAGES: GovernmentPipelineStage[] = [
  "prospect",
  "vendor_registered",
  "capability_statement_sent",
  "meeting_requested",
  "opportunity_identified",
  "bid_submitted",
  "shortlisted",
  "awarded",
  "renewal",
  "lost",
];

export function GovernmentCRMBoard({
  records = [],
}: {
  records?: GovernmentCrmRecord[];
}) {
  const counts = countByStage(records);

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Government CRM Board
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Internal sample data
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {STAGES.map((stage) => (
          <div
            key={stage}
            className="rounded-xl border border-amber-300/10 bg-black/40 p-3"
          >
            <p className="text-[10px] uppercase tracking-[0.16em] text-amber-200/60">
              {stage.replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-xl font-semibold text-amber-100">{counts[stage]}</p>
          </div>
        ))}
      </div>

      {records.length === 0 ? (
        <p className="mt-4 text-xs text-stone-500">
          No CRM records loaded. Agencies appear here once tracked.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {records.map((r) => (
            <div
              key={`${r.agency}-${r.solicitation_number}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs text-stone-300"
            >
              <span className="font-medium text-amber-100">{r.agency}</span>
              <span>{r.department}</span>
              <span className="uppercase tracking-[0.14em] text-amber-200/60">
                {r.status.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
