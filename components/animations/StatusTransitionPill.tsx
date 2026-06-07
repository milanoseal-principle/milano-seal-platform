"use client";

<<<<<<< HEAD
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Lock, AlertCircle } from "lucide-react";

export interface StatusTransitionPillProps {
  status: string;
  size?: "sm" | "md";
  animate?: boolean;
}

interface StatusConfig {
  label: string;
  bg: string;
  border: string;
  color: string;
  icon?: React.ReactNode;
  pulse?: boolean;
  leftAccent?: boolean;
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusConfig(status: string): StatusConfig {
  const s = status.toLowerCase();

  if (s === "awaiting_payment") {
    return {
      label: "Awaiting Payment",
      bg: "rgba(217,119,6,0.12)",
      border: "rgba(217,119,6,0.5)",
      color: "#D97706",
      icon: <Clock size={12} strokeWidth={2} />,
    };
  }
  if (s === "payment_failed") {
    return {
      label: "Payment Failed",
      bg: "rgba(220,38,38,0.12)",
      border: "rgba(220,38,38,0.5)",
      color: "#DC2626",
      icon: <AlertCircle size={12} strokeWidth={2} />,
    };
  }
  if (s === "paid" || s === "payment_confirmed") {
    return {
      label: "Payment Confirmed",
      bg: "rgba(63,164,122,0.12)",
      border: "rgba(63,164,122,0.5)",
      color: "#3FA47A",
      icon: <CheckCircle2 size={12} strokeWidth={2} />,
    };
  }
  if (s === "intake_review") {
    return {
      label: "Intake Review",
      bg: "rgba(217,119,6,0.12)",
      border: "rgba(217,119,6,0.5)",
      color: "#D97706",
      icon: <Clock size={12} strokeWidth={2} />,
    };
  }
  if (s === "scheduled") {
    return {
      label: "Scheduled",
      bg: "rgba(197,160,89,0.12)",
      border: "rgba(197,160,89,0.5)",
      color: "#C5A059",
      icon: <Clock size={12} strokeWidth={2} />,
    };
  }
  if (s === "in_execution") {
    return {
      label: "In Execution",
      bg: "rgba(197,160,89,0.12)",
      border: "rgba(197,160,89,0.5)",
      color: "#C5A059",
      pulse: true,
    };
  }
  if (s === "apostille") {
    return {
      label: "Apostille",
      bg: "rgba(197,160,89,0.12)",
      border: "rgba(197,160,89,0.5)",
      color: "#C5A059",
    };
  }
  if (s === "shipped" || s === "in_transit") {
    return {
      label: "In Transit",
      bg: "rgba(71,100,140,0.14)",
      border: "rgba(71,100,140,0.5)",
      color: "#7FAFD4",
    };
  }
  if (s === "delivered") {
    return {
      label: "Delivered · Pending Release",
      bg: "rgba(217,119,6,0.12)",
      border: "rgba(217,119,6,0.5)",
      color: "#D97706",
      leftAccent: true,
    };
  }
  if (s === "completed" || s === "paid_and_released") {
    return {
      label: "Completed",
      bg: "rgba(63,164,122,0.12)",
      border: "rgba(63,164,122,0.5)",
      color: "#3FA47A",
      icon: <CheckCircle2 size={12} strokeWidth={2} />,
    };
  }
  if (s === "blocked" || s === "on_hold") {
    return {
      label: "Blocked",
      bg: "rgba(220,38,38,0.12)",
      border: "rgba(220,38,38,0.5)",
      color: "#DC2626",
      icon: <Lock size={12} strokeWidth={2} />,
    };
  }
  if (s === "escalated") {
    return {
      label: "Escalated",
      bg: "rgba(217,119,6,0.12)",
      border: "rgba(217,119,6,0.5)",
      color: "#D97706",
      icon: <Lock size={12} strokeWidth={2} />,
    };
  }
  if (s === "cancelled") {
    return {
      label: "Cancelled",
      bg: "rgba(100,116,139,0.12)",
      border: "rgba(100,116,139,0.4)",
      color: "#64748B",
    };
  }

  return {
    label: formatStatusLabel(status),
    bg: "rgba(100,116,139,0.12)",
    border: "rgba(100,116,139,0.4)",
    color: "#94A3B8",
  };
}

export function StatusTransitionPill({
  status,
  size = "md",
  animate = true,
}: StatusTransitionPillProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const cfg = getStatusConfig(status);
  const shouldAnimate = animate && !reducedMotion;

  const padding = size === "sm" ? "2px 7px" : "3px 10px";
  const fontSize = size === "sm" ? "10px" : "11px";
  const gap = size === "sm" ? "4px" : "5px";

  const containerStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap,
    padding,
    fontSize,
    fontFamily: "ui-monospace, 'SF Mono', monospace",
    fontWeight: 500,
    letterSpacing: "0.03em",
    borderRadius: "20px",
    border: `1px solid ${cfg.border}`,
    background: cfg.bg,
    color: cfg.color,
    borderLeft: cfg.leftAccent ? `3px solid ${cfg.color}` : undefined,
    transition: shouldAnimate
      ? "background 250ms ease, border-color 250ms ease, color 250ms ease"
      : "none",
    whiteSpace: "nowrap",
    position: "relative",
    overflow: "hidden",
    lineHeight: 1.4,
  };

  return (
    <>
      {cfg.pulse && shouldAnimate && (
        <style>{`
          @keyframes milano-border-pulse {
            0%   { box-shadow: 0 0 0 0 rgba(197,160,89,0.45); }
            60%  { box-shadow: 0 0 0 5px rgba(197,160,89,0); }
            100% { box-shadow: 0 0 0 5px rgba(197,160,89,0); }
=======
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
>>>>>>> claude/funny-maxwell-hlxQN
          }
        `}</style>
      )}
      <AnimatePresence mode="wait">
        <motion.span
          key={status}
<<<<<<< HEAD
          style={containerStyle}
          initial={shouldAnimate ? { opacity: 0, y: 4 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldAnimate ? { opacity: 0, y: -4 } : { opacity: 1, y: 0 }}
          transition={{ duration: shouldAnimate ? 0.2 : 0 }}
          className={cfg.pulse && shouldAnimate ? "milano-exec-pulse" : undefined}
        >
          {cfg.pulse && shouldAnimate && (
            <style>{`
              .milano-exec-pulse {
                animation: milano-border-pulse 3s ease-out 1;
              }
            `}</style>
          )}
          {cfg.icon && (
            <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              {cfg.icon}
            </span>
          )}
          {cfg.label}
=======
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
>>>>>>> claude/funny-maxwell-hlxQN
        </motion.span>
      </AnimatePresence>
    </>
  );
}
