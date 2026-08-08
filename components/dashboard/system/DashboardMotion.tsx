"use client";

// Cinematic-but-restrained motion primitives for the dashboard. framer-motion is
// already a dependency. All motion respects prefers-reduced-motion (reduced =
// instant opacity only), never blocks data, and causes no layout shift.

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { motionTokens } from "@/lib/motion/milano-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";

/** Page/section entry: gentle fade + slight rise (180–260ms). */
export function Reveal({
  children,
  delay = 0,
  y = 8,
  className,
  ...rest
}: { children: ReactNode; delay?: number; y?: number; className?: string } & HTMLMotionProps<"div">) {
  const reduced = useMilanoReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : motionTokens.duration.fast, ease: motionTokens.easing.standard, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container — children using <StaggerItem> reveal in sequence (~70ms). */
export function Stagger({
  children,
  className,
  step = 0.07,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
}) {
  const reduced = useMilanoReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduced ? 0 : step } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 8,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const reduced = useMilanoReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduced ? { opacity: 0 } : { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: reduced ? 0 : motionTokens.duration.fast, ease: motionTokens.easing.standard },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
