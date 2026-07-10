"use client";

import { countBySource } from "@/lib/acquisition/referralCapture";
import type { LeadSource, ReferralCapture } from "@/lib/acquisition/types";

const SOURCE_ORDER: LeadSource[] = [
  "referral",
  "attorney_network",
  "university_partner",
  "healthcare_partner",
  "immigration_professional",
  "airport_emergency",
  "organic_search",
  "direct",
  "paid",
  "unknown",
];

export function ReferralSourcePanel({
  captures = [],
}: {
  captures?: ReferralCapture[];
}) {
  const counts = countBySource(captures);

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Referral Sources
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          {captures.length === 0 ? "No data yet" : `${captures.length} captured`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {SOURCE_ORDER.map((source) => (
          <div
            key={source}
            className="rounded-xl border border-amber-300/10 bg-black/40 p-3"
          >
            <p className="text-[10px] uppercase tracking-[0.16em] text-amber-200/60">
              {source.replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-xl font-semibold text-amber-100">
              {counts[source]}
            </p>
          </div>
        ))}
      </div>

      {captures.length === 0 && (
        <p className="mt-4 text-xs text-stone-500">
          No referral sources captured yet. Classified sources appear here as
          intakes are tracked.
        </p>
      )}
    </section>
  );
}
