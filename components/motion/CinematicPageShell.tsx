"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { motionTokens, milanoTransitions } from "@/lib/motion/milano-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";

export function CinematicPageShell({ children }: { children: ReactNode }) {
  const reducedMotion = useMilanoReducedMotion();

  return (
    <motion.div
      id="milano-main"
      tabIndex={-1}
      initial={reducedMotion ? false : { opacity: 0, y: motionTokens.distance.subtle }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : milanoTransitions.pageEnter}
      className="min-h-[100dvh] outline-none"
    >
      {children}
    </motion.div>
  );
}
