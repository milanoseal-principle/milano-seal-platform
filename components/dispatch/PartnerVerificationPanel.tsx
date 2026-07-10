"use client";

import type { PartnerVerification } from "@/lib/dispatch/types";
import {
  REQUIRED_CHECKS,
  clearedChecks,
  isFullyVerified,
  verificationProgress,
} from "@/lib/dispatch/partnerVerification";

export function PartnerVerificationPanel({
  verifications = [],
}: {
  verifications?: PartnerVerification[];
}) {
  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Partner Verification
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Required checks: {REQUIRED_CHECKS.join(", ")}. Verification never
        guarantees future assignments.
      </p>

      {verifications.length === 0 ? (
        <p className="rounded-xl border border-amber-300/10 bg-black/40 px-3 py-6 text-center text-xs text-stone-500">
          No verifications in progress.
        </p>
      ) : (
        <div className="space-y-2">
          {verifications.map((v) => (
            <div
              key={v.partnerId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs"
            >
              <span className="font-mono text-amber-100">{v.partnerId}</span>
              <span className="flex-1 text-stone-400">
                {clearedChecks(v).length}/{REQUIRED_CHECKS.length} cleared ·{" "}
                {Math.round(verificationProgress(v) * 100)}%
              </span>
              <span
                className={
                  isFullyVerified(v)
                    ? "rounded-full border border-emerald-400/25 bg-emerald-400/5 px-2 py-0.5 text-[10px] text-emerald-200"
                    : "rounded-full border border-amber-400/25 bg-amber-400/5 px-2 py-0.5 text-[10px] text-amber-200"
                }
              >
                {isFullyVerified(v) ? "verified" : "in progress"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
