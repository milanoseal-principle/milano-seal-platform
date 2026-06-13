"use client";

import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";

interface PipelineStageItem {
  name: string;
  count: number;
}

interface PipelineApiResponse {
  stages: PipelineStageItem[];
}

// Canonical stage display order matching Milano Seal state machine
const STAGES = [
  { key: "INTAKE", label: "INTAKE" },
  { key: "REVIEW", label: "REVIEW" },
  { key: "PRICING", label: "QUOTED" },
  { key: "PAYMENT", label: "AWAITING PAYMENT" },
  { key: "SCHEDULE", label: "SCHEDULED" },
  { key: "EXECUTION", label: "IN EXECUTION" },
  { key: "APOSTILLE", label: "APOSTILLE" },
  { key: "DELIVERY", label: "IN TRANSIT" },
  { key: "COMPLETE", label: "COMPLETED" },
] as const;

type StageKey = typeof STAGES[number]["key"];

const GOLD = "#C6A55A";
const EASE = [0.16, 1, 0.3, 1] as const;

function CountUp({ value, delay }: { value: number; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay }}
    >
      {value}
    </motion.span>
  );
}

export function ExecutionStatusRail() {
  const { data, isLoading } = useApi<PipelineApiResponse>("/api/dashboard/pipeline");

  // Build a lookup from the API's stages array
  const countMap: Record<string, number> = {};
  for (const s of data?.stages ?? []) {
    countMap[s.name] = s.count;
  }

  const totalMatters = STAGES.reduce((sum, s) => sum + (countMap[s.key] ?? 0), 0);

  // Determine "active" — most loaded non-completed stage
  const activeKey: StageKey = STAGES.slice(0, -1).reduce(
    (best, s) => ((countMap[s.key] ?? 0) > (countMap[best.key] ?? 0) ? s : best),
    STAGES[0]
  ).key;

  return (
    <div
      className="rounded-sm overflow-x-auto"
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.08)",
        scrollbarWidth: "none",
      }}
    >
      <div
        className="px-5 py-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <span
          className="text-[9px] font-mono uppercase tracking-[0.28em]"
          style={{ color: "rgba(212,175,55,0.5)" }}
        >
          Execution Status Rail
        </span>
      </div>

      {!isLoading && totalMatters === 0 ? (
        <div className="px-5 py-6">
          <p
            className="text-[11px] font-mono"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            No active matters in pipeline.
          </p>
        </div>
      ) : (
        <div className="px-5 py-4" style={{ minWidth: "max-content" }}>
          <div className="flex items-end gap-0">
            {STAGES.map((stage, idx) => {
              const count = countMap[stage.key] ?? 0;
              const isCompleted = stage.key === "COMPLETE";
              const isActive = stage.key === activeKey && count > 0;
              const isDimmed = isCompleted;

              return (
                <div key={stage.key} className="flex items-center">
                  {idx > 0 && (
                    <div
                      className="w-4 h-px"
                      style={{
                        background: isActive
                          ? "rgba(198,165,90,0.4)"
                          : "rgba(255,255,255,0.06)",
                      }}
                    />
                  )}
                  <div className="flex flex-col items-center gap-1.5 px-3 py-2">
                    <div
                      className="text-[7px] font-mono uppercase tracking-[0.1em] text-center whitespace-nowrap"
                      style={{
                        color: isActive
                          ? GOLD
                          : isDimmed
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {stage.label}
                    </div>
                    <div
                      className="text-xl font-light leading-none"
                      style={{
                        fontFamily: "var(--font-playfair), Georgia, serif",
                        color: isActive
                          ? GOLD
                          : isDimmed
                            ? "rgba(255,255,255,0.15)"
                            : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {isLoading ? (
                        <span style={{ color: "rgba(255,255,255,0.1)" }}>—</span>
                      ) : (
                        <CountUp value={count} delay={idx * 0.055} />
                      )}
                    </div>
                    {isActive && (
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: GOLD }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
