"use client";

import { useApi } from "@/hooks/useApi";

interface PipelineApiData {
  intake: number;
  review: number;
  awaiting_payment: number;
  scheduled: number;
  execution: number;
  apostille: number;
  transit: number;
  delivered: number;
  completed: number;
}

const STAGES: { label: string; key: keyof PipelineApiData }[] = [
  { label: "INTAKE", key: "intake" },
  { label: "REVIEW", key: "review" },
  { label: "PRICING", key: "review" },
  { label: "PAYMENT", key: "awaiting_payment" },
  { label: "SCHEDULE", key: "scheduled" },
  { label: "EXECUTION", key: "execution" },
  { label: "APOSTILLE", key: "apostille" },
  { label: "DELIVERY", key: "delivered" },
  { label: "COMPLETE", key: "completed" },
];

export function ExecutionPipeline() {
  const { data, isLoading } = useApi<PipelineApiData>("/api/dashboard/pipeline");

  return (
    <div
      className="rounded-lg border border-white/[0.06] p-5"
      style={{ background: "rgba(3,3,5,0.90)" }}
    >
      <p className="font-mono text-[9px] tracking-[0.32em] uppercase text-[#C6A55A]/50 mb-5">
        Execution Pipeline
      </p>
      <div className="overflow-x-auto">
        <div className="flex items-start gap-0 min-w-max">
          {STAGES.map((stage, idx) => {
            const count = data ? (data[stage.key] ?? 0) : 0;
            const active = count > 0;
            return (
              <div key={stage.label} className="flex items-center">
                <div className="flex flex-col items-center gap-2 px-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border text-xs font-semibold transition-colors ${
                      active
                        ? "border-[#C6A55A] bg-[#C6A55A]/10 text-[#C6A55A]"
                        : "border-white/10 bg-white/[0.03] text-[#9A9A9A]/40"
                    }`}
                  >
                    {isLoading ? (
                      <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
                    ) : (
                      <span>{count}</span>
                    )}
                  </div>
                  <span
                    className={`font-mono text-[8px] tracking-[0.18em] uppercase ${
                      active ? "text-[#C6A55A]/70" : "text-[#9A9A9A]/30"
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
                {idx < STAGES.length - 1 && (
                  <div className="w-6 h-px bg-white/[0.06] mt-[-18px]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
