"use client";

import { useEffect, useReducedMotion } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SIZE_DIMS = { sm: 64, md: 96, lg: 128 };

interface TrustConfirmSealProps {
  event: string;
  size?: "sm" | "md" | "lg";
  onComplete?: () => void;
}

export function TrustConfirmSeal({ event, size = "md", onComplete }: TrustConfirmSealProps) {
  const reduced = useReducedMotion();
  const dim = SIZE_DIMS[size];
  const r = (dim / 2) * 0.8;
  const cx = dim / 2;
  const cy = dim / 2;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    if (reduced) {
      onComplete?.();
      return;
    }
    const t = setTimeout(() => onComplete?.(), 1100);
    return () => clearTimeout(t);
  }, [event, reduced, onComplete]);

  if (reduced) {
    return (
      <div className="flex flex-col items-center gap-2">
        <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#D4AF37" strokeWidth={2} />
          <polyline
            points={`${cx - r * 0.35},${cy} ${cx - r * 0.1},${cy + r * 0.3} ${cx + r * 0.4},${cy - r * 0.25}`}
            fill="none"
            stroke="#D4AF37"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-mono text-[10px] tracking-widest uppercase text-[#D4AF37]">{event}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} style={{ overflow: "visible" }}>
        {/* Circle draw */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#D4AF37"
          strokeWidth={2}
          strokeLinecap="round"
          style={{ pathLength: 0, rotate: -90, originX: `${cx}px`, originY: `${cy}px` }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          strokeDasharray={circumference}
        />
        {/* Checkmark */}
        <motion.polyline
          points={`${cx - r * 0.35},${cy} ${cx - r * 0.1},${cy + r * 0.3} ${cx + r * 0.4},${cy - r * 0.25}`}
          fill="none"
          stroke="#D4AF37"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.2 }}
        />
      </svg>
      <motion.span
        className="font-mono text-[10px] tracking-widest uppercase text-[#D4AF37]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.2 }}
      >
        {event}
      </motion.span>
    </div>
  );
}
