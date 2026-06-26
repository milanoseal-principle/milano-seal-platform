"use client";
import { motion, useReducedMotion } from "framer-motion";
import { fadeIn } from "./motionPresets";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
      {children}
    </motion.div>
  );
}
