"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { stagger } from "./motionPresets";

type MilanoStaggerProps = {
  children: ReactNode;
  className?: string;
};

export function MilanoStagger({ children, className }: MilanoStaggerProps) {
  const reduceMotion = useReducedMotion();

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
