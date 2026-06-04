"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; pulse?: boolean }> = {
  new: { label: "NEW", color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)" },
  intake_review: { label: "INTAKE REVIEW", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  awaiting_payment: { label: "AWAITING PAYMENT", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  payment_failed: { label: "PAYMENT FAILED", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
  open: { label: "OPEN", color: "#D4AF37", bg: "rgba(212,175,55,0.12)", border: "rgba(212,175,55,0.3)" },
  scheduled: { label: "SCHEDULED", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
  in_execution: { label: "IN EXECUTION", color: "#D4AF37", bg: "rgba(212,175,55,0.12)", border: "rgba(212,175,55,0.5)", pulse: true },
  compliance_review: { label: "COMPLIANCE REVIEW", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  apostille: { label: "APOSTILLE", color: "#D4AF37", bg: "rgba(212,175,55,0.12)", border: "rgba(212,175,55,0.3)" },
  shipped: { label: "SHIPPED", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
  delivered: { label: "DELIVERED", color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
  released: { label: "RELEASED", color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
  on_hold: { label: "ON HOLD", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  cancelled: { label: "CANCELLED", color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" },
  completed: { label: "COMPLETED", color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
};

const SIZE_MAP = {
  sm: { px: "px-2 py-0.5", text: "text-[9px]", tracking: "tracking-widest" },
  md: { px: "px-3 py-1", text: "text-[10px]", tracking: "tracking-widest" },
  lg: { px: "px-4 py-1.5", text: "text-xs", tracking: "tracking-widest" },
};

interface StatusTransitionPillProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function StatusTransitionPill({ status, size = "md" }: StatusTransitionPillProps) {
  const reduced = useReducedMotion();
  const mapping = STATUS_MAP[status] ?? {
    label: status.toUpperCase().replace(/_/g, " "),
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.08)",
    border: "rgba(148,163,184,0.2)",
  };
  const sz = SIZE_MAP[size];

  return (
    <>
      {mapping.pulse && !reduced && (
        <style>{`
          @keyframes status-pulse {
            0% { box-shadow: 0 0 0 0 rgba(212,175,55,0.4); }
            50% { box-shadow: 0 0 0 4px rgba(212,175,55,0.15); }
            100% { box-shadow: 0 0 0 0 transparent; }
          }
        `}</style>
      )}
      <AnimatePresence mode="wait">
        <motion.span
          key={status}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`inline-flex items-center rounded-full font-mono uppercase whitespace-nowrap ${sz.px} ${sz.text} ${sz.tracking}`}
          style={{
            color: mapping.color,
            background: mapping.bg,
            border: `1px solid ${mapping.border}`,
            animation: mapping.pulse && !reduced ? "status-pulse 1.2s ease-out 1" : undefined,
          }}
        >
          {mapping.label}
        </motion.span>
      </AnimatePresence>
    </>
  );
}
