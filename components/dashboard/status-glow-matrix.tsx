"use client";

import { motion } from "framer-motion";

interface PipelineCounts {
  reviewing_count: number;
  awaiting_payment: number;
  scheduled_count: number;
  in_execution: number;
  apostille_count: number;
  shipped_count: number;
}

interface StatusGlowMatrixProps {
  counts: PipelineCounts;
}

const STAGES = [
  { key: "intake", label: "Intake", field: "reviewing_count" as const },
  { key: "review", label: "Review", field: "reviewing_count" as const },
  { key: "compliance", label: "Compliance", field: null },
  { key: "billing", label: "Billing", field: "awaiting_payment" as const },
  { key: "settled", label: "Settled", field: null },
  { key: "allocated", label: "Allocated", field: "scheduled_count" as const },
  { key: "dispatched", label: "Dispatched", field: "scheduled_count" as const },
  { key: "execution", label: "Execution", field: "in_execution" as const },
  { key: "apostille", label: "Apostille", field: "apostille_count" as const },
  { key: "consular", label: "Consular", field: "apostille_count" as const },
  { key: "transit", label: "Transit", field: "shipped_count" as const },
  { key: "delivered", label: "Delivered", field: "shipped_count" as const },
] as const;

function nodeLoad(stage: (typeof STAGES)[number], counts: PipelineCounts): number {
  if (stage.field === null) return 0;
  return counts[stage.field] ?? 0;
}

function glowColor(load: number): { ring: string; dot: string; label: string } {
  if (load === 0)
    return {
      ring: "rgba(55,65,81,0.35)",
      dot: "#374151",
      label: "#6b7280",
    };
  if (load <= 2)
    return {
      ring: "rgba(212,175,55,0.45)",
      dot: "#d4af37",
      label: "#d4af37",
    };
  return {
    ring: "rgba(245,158,11,0.6)",
    dot: "#f59e0b",
    label: "#f59e0b",
  };
}

export function StatusGlowMatrix({ counts }: StatusGlowMatrixProps) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-card/60 backdrop-blur-sm p-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-gold font-medium mb-4">
        Pipeline Load
      </p>
      <div className="grid grid-cols-6 gap-3 sm:grid-cols-12">
        {STAGES.map((stage, i) => {
          const load = nodeLoad(stage, counts);
          const colors = glowColor(load);
          return (
            <motion.div
              key={stage.key}
              className="flex flex-col items-center gap-1.5"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative flex items-center justify-center">
                {load > 0 && (
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      width: 28,
                      height: 28,
                      background: colors.ring,
                      filter: "blur(6px)",
                    }}
                    animate={{ opacity: [0.4, 0.85, 0.4] }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.12,
                    }}
                  />
                )}
                <div
                  className="relative w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: colors.dot }}
                />
              </div>
              <span
                className="text-[9px] font-mono leading-none text-center"
                style={{ color: colors.label }}
              >
                {stage.label}
              </span>
              {load > 0 && (
                <span
                  className="text-[9px] font-mono leading-none"
                  style={{ color: colors.dot }}
                >
                  {load}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
