"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";

type MilanoTimelineMotionProps = {
  children: ReactNode;
  className?: string;
};

export function MilanoTimelineMotion({
  children,
  className,
}: MilanoTimelineMotionProps) {
  const reduceMotion = useMilanoReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
