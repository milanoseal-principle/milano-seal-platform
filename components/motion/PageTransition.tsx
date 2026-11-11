"use client";
import { motion } from "framer-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";
import { fadeIn } from "./motionPresets";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduced = useMilanoReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
      {children}
    </motion.div>
  );
}
