"use client";

import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";

interface PipelineData {
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

const STAGES = [
  { key: "intake" as const, label: "INTAKE" },
  { key: "review" as const, label: "REVIEW" },
  { key: "awaiting_payment" as const, label: "AWAITING PAYMENT" },
  { key: "scheduled" as const, label: "SCHEDULED" },
  { key: "execution" as const, label: "EXECUTION" },
  { key: "apostille" as const, label: "APOSTILLE" },
  { key: "transit" as const, label: "TRANSIT" },
  { key: "delivered" as const, label: "DELIVERED" },
  { key: "completed" as const, label: "COMPLETED" },
];

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
  const { data, isLoading } = useApi<PipelineData>("/api/dashboard/pipeline");

  const counts: PipelineData = data ?? {
    intake: 0, review: 0, awaiting_payment: 0, scheduled: 0,
    execution: 0, apostille: 0, transit: 0, delivered: 0, completed: 0,
  };

  // Determine "active" — most loaded non-completed stage
  const activeKey = STAGES.slice(0, -1).reduce(
    (best, s) => (counts[s.key] > counts[best.key] ? s : best),
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

      <div className="px-5 py-4" style={{ minWidth: "max-content" }}>
        <div className="flex items-end gap-0">
          {STAGES.map((stage, idx) => {
            const count = counts[stage.key];
            const isCompleted = stage.key === "completed";
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
    </div>
  );
}
