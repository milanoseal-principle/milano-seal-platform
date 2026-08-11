"use client";

import { BANNED_GOVERNMENT_CLAIMS } from "@/lib/government/governmentSafety";

const RULES = [
  "No claims of government approval or endorsement.",
  "No guaranteed contracts, procurement, awards, or acceptance.",
  "No 'official county/agency/government partner' language.",
  "No legal advice — execution and coordination only.",
  "No fabricated agency clients or past performance.",
  "No fabricated vendor registration status — active only when a verified ID is issued.",
  "Final acceptance always remains subject to the receiving authority.",
];

export function GovernmentSafetyPanel() {
  return (
    <section className="rounded-2xl border border-amber-300/25 bg-black/50 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Government Compliance & Safety
      </h2>

      <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-amber-200/60">
        Operator reminders
      </p>
      <ul className="space-y-1 text-xs text-stone-300">
        {RULES.map((r) => (
          <li key={r}>• {r}</li>
        ))}
      </ul>

      <p className="mb-2 mt-4 text-[11px] uppercase tracking-[0.16em] text-amber-200/60">
        Banned public claims
      </p>
      <div className="flex flex-wrap gap-2">
        {BANNED_GOVERNMENT_CLAIMS.map((c) => (
          <span
            key={c}
            className="rounded-full border border-red-400/25 bg-red-400/5 px-2 py-1 text-[10px] text-red-200"
          >
            {c}
          </span>
        ))}
      </div>
    </section>
  );
}
