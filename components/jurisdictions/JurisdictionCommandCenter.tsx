"use client";

import type { CountryRecord, ManualReviewFlag } from "@/lib/jurisdictions/types";
import { VERIFY_BEFORE_EXECUTION_CAPTION } from "@/lib/jurisdictions/jurisdictionSafety";

// Top-of-page summary for the Jurisdictions command center. Presentational —
// renders counts from the passed registry. All figures are illustrative.

export function JurisdictionCommandCenter({
  countries,
  flags,
}: {
  countries: CountryRecord[];
  flags: ManualReviewFlag[];
}) {
  const members = countries.filter((c) => c.hagueStatus === "member").length;
  const unknown = countries.filter((c) => c.hagueStatus === "unknown").length;
  const needsReview = countries.filter((c) => c.requiresManualReview).length;
  const blockers = flags.filter((f) => f.severity === "blocker").length;

  const tiles = [
    { label: "Countries", value: countries.length },
    { label: "Hague members (illustrative)", value: members },
    { label: "Unknown status", value: unknown },
    { label: "Flagged for review", value: needsReview },
    { label: "Active blockers", value: blockers },
  ];

  return (
    <section className="rounded-2xl border border-amber-300/25 bg-black/50 p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Jurisdiction Command Center
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Illustrative operational intelligence. {VERIFY_BEFORE_EXECUTION_CAPTION}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-lg border border-amber-300/10 bg-black/30 px-3 py-3"
          >
            <div className="text-xl font-semibold text-amber-100">{t.value}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-stone-400">
              {t.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
