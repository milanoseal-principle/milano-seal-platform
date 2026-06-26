"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, routeTransition } from "./motionPresets";

type MilanoRevealProps = {
  children: ReactNode;
  className?: string;
};

export function MilanoReveal({ children, className }: MilanoRevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={routeTransition}
    >
      {children}
    </motion.div>
  );
}
