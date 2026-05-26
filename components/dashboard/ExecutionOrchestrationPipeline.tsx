"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

export interface PipelineCounts {
  reviewing_count: number;
  awaiting_payment: number;
  scheduled_count: number;
  in_execution: number;
  apostille_count: number;
  shipped_count: number;
}

interface Props {
  counts: PipelineCounts;
  slaEscalation?: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const DURATION = 0.58;

const STAGES = [
  { key: "INTAKE", label: "Intake\n& Review", countKey: "reviewing_count" as const },
  { key: "PAYMENT", label: "Payment\nGate", countKey: "awaiting_payment" as const, isBlocker: true },
  { key: "SCHEDULING", label: "Scheduling", countKey: "scheduled_count" as const },
  { key: "EXECUTION", label: "Execution", countKey: "in_execution" as const },
  { key: "APOSTILLE", label: "Apostille\n/ Auth", countKey: "apostille_count" as const },
  { key: "COURIER", label: "Courier\nRelease", countKey: "shipped_count" as const },
  { key: "RELEASED", label: "Released", countKey: null },
];

export function ExecutionOrchestrationPipeline({ counts, slaEscalation }: Props) {
  return (
    <div
      className="rounded-sm"
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <span
          className="text-[9px] font-mono uppercase tracking-[0.28em]"
          style={{ color: "rgba(212,175,55,0.5)" }}
        >
          Execution Orchestration Pipeline
        </span>
        {slaEscalation && (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" style={{ color: "#f59e0b" }} />
            <span
              className="text-[8px] font-mono uppercase tracking-[0.14em]"
              style={{ color: "#f59e0b" }}
            >
              SLA Risk
            </span>
          </div>
        )}
      </div>

      {/* Stage strip */}
      <div
        className="px-5 py-4 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex items-stretch gap-0" style={{ minWidth: "max-content" }}>
          {STAGES.map((stage, idx) => {
            const count = stage.countKey ? counts[stage.countKey] : 0;
            const isActive = count > 0;
            const isBlocker = stage.isBlocker && isActive;

            return (
              <div key={stage.key} className="flex items-center">
                {/* Connector */}
                {idx > 0 && (
                  <div
                    className="w-6 h-px flex-shrink-0"
                    style={{
                      background: isActive
                        ? "rgba(212,175,55,0.3)"
                        : "rgba(255,255,255,0.06)",
                    }}
                  />
                )}

                {/* Chip */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ease: EASE, duration: DURATION, delay: idx * 0.06 }}
                  className="relative flex flex-col items-center gap-1 px-3.5 py-2.5 rounded-sm"
                  style={{
                    minWidth: 88,
                    background: isBlocker
                      ? "rgba(245,158,11,0.06)"
                      : isActive
                        ? "rgba(212,175,55,0.05)"
                        : "rgba(255,255,255,0.015)",
                    border: `1px solid ${
                      isBlocker
                        ? "rgba(245,158,11,0.28)"
                        : isActive
                          ? "rgba(212,175,55,0.22)"
                          : "rgba(255,255,255,0.05)"
                    }`,
                  }}
                >
                  {/* Active glow line */}
                  {isActive && (
                    <motion.div
                      animate={{ opacity: [0.25, 0.8, 0.25] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-px left-2 right-2 h-px rounded-full"
                      style={{ background: isBlocker ? "#f59e0b" : "#d4af37" }}
                    />
                  )}

                  {/* Label */}
                  <div
                    className="text-[8px] font-mono uppercase tracking-[0.12em] text-center whitespace-pre-line leading-tight"
                    style={{
                      color: isBlocker
                        ? "#f59e0b"
                        : isActive
                          ? "rgba(212,175,55,0.75)"
                          : "rgba(255,255,255,0.18)",
                    }}
                  >
                    {stage.label}
                  </div>

                  {/* Count */}
                  <div
                    className="text-lg font-light leading-none"
                    style={{
                      fontFamily: "var(--font-playfair), Georgia, serif",
                      color: isBlocker
                        ? "#f59e0b"
                        : isActive
                          ? "#d4af37"
                          : "rgba(255,255,255,0.12)",
                    }}
                  >
                    {count > 0 ? count : "—"}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
