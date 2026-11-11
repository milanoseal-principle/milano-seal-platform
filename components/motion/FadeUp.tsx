"use client";
import { motion } from "framer-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";
import { fadeUp } from "./motionPresets";

interface Props { children: React.ReactNode; delay?: number; className?: string; }

export function FadeUp({ children, delay = 0, className }: Props) {
  const reduced = useMilanoReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
