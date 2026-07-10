"use client";

import type { CountryRecord } from "@/lib/jurisdictions/types";
import { classifyHague } from "@/lib/jurisdictions/hagueStatus";
import { VERIFY_BEFORE_EXECUTION_CAPTION } from "@/lib/jurisdictions/jurisdictionSafety";

const STATUS_LABEL: Record<string, string> = {
  member: "Hague member (illustrative)",
  non_member: "Non-member (illustrative)",
  unknown: "Unknown — manual review",
};

export function HagueStatusPanel({ countries }: { countries: CountryRecord[] }) {
  return (
    <section className="rounded-2xl border border-amber-300/25 bg-black/50 p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Hague Apostille Status
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        {VERIFY_BEFORE_EXECUTION_CAPTION}
      </p>
      <ul className="space-y-2 text-xs text-stone-300">
        {countries.map((c) => {
          const h = classifyHague(c);
          return (
            <li
              key={c.iso + c.name}
              className="flex items-center justify-between gap-3 rounded-lg border border-amber-300/10 bg-black/30 px-3 py-2"
            >
              <span className="font-medium text-amber-100">
                {c.name} <span className="text-stone-500">({c.iso})</span>
              </span>
              <span className="flex items-center gap-2">
                <span>{STATUS_LABEL[h.status]}</span>
                {h.requiresManualReview && (
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/5 px-2 py-0.5 text-[10px] text-amber-200">
                    review
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
