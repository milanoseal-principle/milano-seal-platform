"use client";

import type { CompletionReview } from "@/lib/dispatch/types";
import {
  checklistProgress,
  isReadyForQa,
  outcomeLabel,
} from "@/lib/dispatch/completionReview";

export function CompletionReviewPanel({
  reviews = [],
}: {
  reviews?: CompletionReview[];
}) {
  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Completion Reviews
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Partner-submitted completion checklists. Submission never itself
        authorizes payment.
      </p>

      {reviews.length === 0 ? (
        <p className="rounded-xl border border-amber-300/10 bg-black/40 px-3 py-6 text-center text-xs text-stone-500">
          No completion reviews submitted yet.
        </p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div
              key={r.assignmentId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs"
            >
              <span className="font-mono text-amber-100">{r.assignmentId}</span>
              <span className="text-stone-400">
                {Math.round(checklistProgress(r) * 100)}% checklist
              </span>
              <span className="uppercase tracking-[0.14em] text-amber-200/60">
                {outcomeLabel(r.outcome)}
              </span>
              {isReadyForQa(r) && (
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/5 px-2 py-0.5 text-[10px] text-emerald-200">
                  ready for QA
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
