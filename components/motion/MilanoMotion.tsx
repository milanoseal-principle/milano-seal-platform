"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MILANO_EASE, MILANO_MOTION, MILANO_STATE_TONES, type MilanoStateTone } from "@/lib/motion/milanoMotionPresets";

export function MilanoReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: MILANO_MOTION.revealY, filter: "blur(7px)" }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: reduce ? 0.01 : MILANO_MOTION.deliberate, delay: reduce ? 0 : delay, ease: MILANO_EASE }}
    >
      {children}
    </motion.div>
  );
}

export function MilanoStagger({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduce ? 0 : MILANO_MOTION.stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function MilanoStaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 10 },
        visible: reduce ? { opacity: 1 } : { opacity: 1, y: 0 },
      }}
      transition={{ duration: reduce ? 0.01 : MILANO_MOTION.standard, ease: MILANO_EASE }}
    >
      {children}
    </motion.div>
  );
}

export function MilanoStatusPulse({
  tone = "active",
  className = "",
}: {
  tone?: MilanoStateTone;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const palette = MILANO_STATE_TONES[tone];
  return (
    <motion.span
      aria-hidden="true"
      className={`inline-block h-2 w-2 rounded-full ${className}`}
      style={{ backgroundColor: palette.border, boxShadow: `0 0 14px ${palette.glow}` }}
      animate={reduce ? undefined : { opacity: [0.55, 1, 0.55], scale: [1, 1.22, 1] }}
      transition={reduce ? undefined : { duration: MILANO_MOTION.statusPulse, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function MilanoStateFrame({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: MilanoStateTone;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const palette = MILANO_STATE_TONES[tone];
  return (
    <motion.div
      className={className}
      style={{ borderColor: palette.border }}
      whileHover={reduce ? undefined : { y: -2, boxShadow: `0 18px 55px ${palette.glow}` }}
      transition={{ duration: MILANO_MOTION.fast, ease: MILANO_EASE }}
    >
      {children}
    </motion.div>
  );
}

export function MilanoSealConfirm({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: [0.985, 1.012, 1] }}
      transition={{ duration: reduce ? 0.01 : 0.7, ease: MILANO_EASE }}
    >
      {children}
    </motion.div>
  );
}
