"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";
import { routeTransition } from "./motionPresets";

type MilanoRouteTransitionProps = {
  children: ReactNode;
  className?: string;
};

export function MilanoRouteTransition({
  children,
  className,
}: MilanoRouteTransitionProps) {
  const reduceMotion = useMilanoReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.main
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={routeTransition}
    >
      {children}
    </motion.main>
  );
}
