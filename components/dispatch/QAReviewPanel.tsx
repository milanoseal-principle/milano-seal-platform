"use client";

import type { QaReview } from "@/lib/dispatch/types";
import { averageQaScore, QA_PASS_THRESHOLD } from "@/lib/dispatch/qaReview";

export function QAReviewPanel({
  reviews = [],
}: {
  reviews?: QaReview[];
}) {
  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        QA Review
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Internal quality assurance. Internal notes are never shown to partners.
        A passing QA review does not by itself release payment.
      </p>

      {reviews.length === 0 ? (
        <p className="rounded-xl border border-amber-300/10 bg-black/40 px-3 py-6 text-center text-xs text-stone-500">
          No QA reviews recorded yet.
        </p>
      ) : (
        <>
          <p className="mb-2 text-[11px] text-amber-200/60">
            Average QA score: {averageQaScore(reviews)} (pass ≥ {QA_PASS_THRESHOLD})
          </p>
          <div className="space-y-2">
            {reviews.map((r) => (
              <div
                key={r.assignmentId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs"
              >
                <span className="font-mono text-amber-100">{r.assignmentId}</span>
                <span className="text-stone-400">score {r.score}</span>
                <span className="uppercase tracking-[0.14em] text-amber-200/60">{r.outcome}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
