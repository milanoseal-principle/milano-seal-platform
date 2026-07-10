"use client";

import type {
  AbandonedIntake,
  AcquisitionFunnelStage,
  FounderReviewItem,
  FunnelStageCount,
  ReferralCapture,
} from "@/lib/acquisition/types";
import { LeadScoreCard } from "./LeadScoreCard";
import { DynamicCTA } from "./DynamicCTA";
import { ReferralSourcePanel } from "./ReferralSourcePanel";
import { AbandonedIntakeQueue } from "./AbandonedIntakeQueue";
import { FounderReviewQueue } from "./FounderReviewQueue";

const FUNNEL_ORDER: { stage: AcquisitionFunnelStage; label: string }[] = [
  { stage: "visitor", label: "Visitor" },
  { stage: "intake_started", label: "Intake Started" },
  { stage: "intake_completed", label: "Intake Completed" },
  { stage: "quoted", label: "Quoted" },
  { stage: "payment_confirmed", label: "Payment Confirmed" },
];

export interface AcquisitionCommandCenterProps {
  funnel?: FunnelStageCount[];
  referrals?: ReferralCapture[];
  abandoned?: AbandonedIntake[];
  founderReview?: FounderReviewItem[];
  isSample?: boolean;
}

export function AcquisitionCommandCenter({
  funnel = [],
  referrals = [],
  abandoned = [],
  founderReview = [],
  isSample = false,
}: AcquisitionCommandCenterProps) {
  const countFor = (stage: AcquisitionFunnelStage): number =>
    funnel.find((f) => f.stage === stage)?.count ?? 0;

  const hasFunnelData = funnel.some((f) => f.count > 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
            Acquisition Funnel
          </h2>
          <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
            {isSample
              ? "Internal sample data"
              : hasFunnelData
                ? "Live"
                : "No data yet"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {FUNNEL_ORDER.map(({ stage, label }) => (
            <div
              key={stage}
              className="rounded-xl border border-amber-300/10 bg-black/40 p-3"
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-amber-200/60">
                {label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-100">
                {countFor(stage)}
              </p>
            </div>
          ))}
        </div>

        {!hasFunnelData && !isSample && (
          <p className="mt-4 text-xs text-stone-500">
            No funnel activity recorded yet. Visitor → intake → quote → payment
            counts populate here as real activity is tracked.
          </p>
        )}

        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-300">
          Payment Gate Status: ENFORCED
        </p>
        <p className="mt-1 text-[11px] leading-5 text-stone-500">
          Execution is never scheduled until a quote is reviewed, accepted, and
          payment is confirmed.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <LeadScoreCard />
        <DynamicCTA />
      </div>

      <ReferralSourcePanel captures={referrals} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AbandonedIntakeQueue intakes={abandoned} />
        <FounderReviewQueue items={founderReview} />
      </div>
    </div>
  );
}
