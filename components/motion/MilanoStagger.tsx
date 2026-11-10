"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";
import { stagger } from "./motionPresets";

type MilanoStaggerProps = {
  children: ReactNode;
  className?: string;
};

export function MilanoStagger({ children, className }: MilanoStaggerProps) {
  const reduceMotion = useMilanoReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}
