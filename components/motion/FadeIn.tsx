"use client";
import { motion, useReducedMotion } from "framer-motion";
import { fadeIn } from "./motionPresets";

interface Props { children: React.ReactNode; delay?: number; className?: string; }

export function FadeIn({ children, delay = 0, className }: Props) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ ...fadeIn, visible: { ...fadeIn.visible, transition: { ...fadeIn.visible.transition, delay } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
