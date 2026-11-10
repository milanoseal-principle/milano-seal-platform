"use client";
import { motion } from "framer-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";
import { ease } from "./motionPresets";

interface Props { children: React.ReactNode; delay?: number; className?: string; }

export function ScaleIn({ children, delay = 0, className }: Props) {
  const reduced = useMilanoReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.4, ease: ease.smooth, delay } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
