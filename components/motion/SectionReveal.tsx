"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens, milanoTransitions } from "@/lib/motion/milano-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
};

export function SectionReveal({ children, className }: SectionRevealProps) {
  const reducedMotion = useMilanoReducedMotion();

  return (
    <motion.div
      className={cn("ms-section-reveal", className)}
      initial={reducedMotion ? false : { opacity: 0, y: motionTokens.distance.standard }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={reducedMotion ? { duration: 0 } : milanoTransitions.sectionEnter}
    >
      {children}
    </motion.div>
  );
}

