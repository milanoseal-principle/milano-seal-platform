"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";
import { softScale, panelTransition } from "./motionPresets";

type MilanoPanelProps = {
  children: ReactNode;
  className?: string;
};

export function MilanoPanel({ children, className }: MilanoPanelProps) {
  const reduceMotion = useMilanoReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={softScale}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4 }}
      transition={panelTransition}
    >
      {children}
    </motion.div>
  );
}
