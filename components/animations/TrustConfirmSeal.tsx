"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export interface TrustConfirmSealProps {
  event: "payment_confirmed" | "release_approved" | "matter_completed" | "booking_confirmed";
  size?: "sm" | "md" | "lg";
  onComplete?: () => void;
}

const EVENT_LABELS: Record<TrustConfirmSealProps["event"], string> = {
  payment_confirmed: "Payment Confirmed",
  release_approved: "Released & Sealed",
  matter_completed: "Matter Completed",
  booking_confirmed: "Execution Scheduled",
};

const CHECKMARK_COLOR: Record<TrustConfirmSealProps["event"], string> = {
  payment_confirmed: "#3FA47A",
  release_approved: "#C5A059",
  matter_completed: "#3FA47A",
  booking_confirmed: "#3FA47A",
};

const SIZE_MAP = {
  sm: { container: 64, ring: 24, stroke: 2, checkScale: 0.55, labelSize: "9px" },
  md: { container: 96, ring: 36, stroke: 2.5, checkScale: 0.75, labelSize: "10px" },
  lg: { container: 128, ring: 48, stroke: 3, checkScale: 1, labelSize: "11px" },
};

export function TrustConfirmSeal({
  event,
  size = "md",
  onComplete,
}: TrustConfirmSealProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setShowCheck(true);
      setShowLabel(true);
      onComplete?.();
      return;
    }

    const t1 = setTimeout(() => setShowCheck(true), 600);
    const t2 = setTimeout(() => setShowLabel(true), 900);
    const t3 = setTimeout(() => onComplete?.(), 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [reducedMotion, onComplete]);

  const dims = SIZE_MAP[size];
  const cx = dims.container / 2;
  const r = dims.ring;
  const circumference = 2 * Math.PI * r;
  const svgSize = dims.container;
  const checkColor = CHECKMARK_COLOR[event];

  const checkPath = `M ${cx - r * 0.35} ${cx} L ${cx - r * 0.08} ${cx + r * 0.28} L ${cx + r * 0.4} ${cx - r * 0.28}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        userSelect: "none",
      }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        fill="none"
        aria-hidden="true"
      >
        {/* Background ring (faint) */}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          stroke="rgba(197,160,89,0.15)"
          strokeWidth={dims.stroke}
        />

        {/* Animated gold ring */}
        <motion.circle
          cx={cx}
          cy={cx}
          r={r}
          stroke="#C5A059"
          strokeWidth={dims.stroke}
          strokeLinecap="round"
          fill="none"
          style={{ pathLength: 0 }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
          }
          strokeDasharray={circumference}
          transform={`rotate(-90, ${cx}, ${cx})`}
        />

        {/* Checkmark */}
        <motion.path
          d={checkPath}
          stroke={checkColor}
          strokeWidth={dims.stroke + 0.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={showCheck ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
          style={{ transformOrigin: `${cx}px ${cx}px` }}
        />
      </svg>

      {/* Label */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={showLabel ? { opacity: 1 } : { opacity: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
        style={{
          color: "rgba(255,255,255,0.75)",
          fontSize: dims.labelSize,
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {EVENT_LABELS[event]}
      </motion.span>
    </div>
  );
}
