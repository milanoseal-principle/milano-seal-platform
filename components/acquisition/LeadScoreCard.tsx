"use client";

import { scoreLead } from "@/lib/acquisition/leadScoring";
import type { LeadScoringInput } from "@/lib/acquisition/types";

const BAND_COLOR: Record<string, string> = {
  hot: "text-emerald-300",
  warm: "text-amber-200",
  cold: "text-stone-400",
};

export function LeadScoreCard({ input }: { input?: LeadScoringInput }) {
  const sample: LeadScoringInput = input ?? {
    vertical: "attorney",
    urgency: "priority",
    documentComplexity: "moderate",
    source: "referral",
    hasReferralCode: true,
    destinationCountry: "Italy",
  };

  const result = scoreLead(sample);

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Lead Score
        </h2>
        {!input && (
          <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
            Internal sample data
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-semibold text-amber-100">{result.score}</span>
        <span
          className={`text-xs font-semibold uppercase tracking-[0.2em] ${BAND_COLOR[result.band]}`}
        >
          {result.band}
        </span>
      </div>

      <ul className="mt-4 space-y-1 text-xs text-stone-400">
        {result.reasons.map((r) => (
          <li key={r}>• {r}</li>
        ))}
      </ul>

      <p className="mt-4 text-[11px] leading-5 text-stone-500">
        Score is an internal prioritization aid only. It is not a prediction or
        promise of any outcome, acceptance, or approval.
      </p>
    </section>
  );
}
