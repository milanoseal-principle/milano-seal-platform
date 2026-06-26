"use client";
import { motion, useReducedMotion } from "framer-motion";
import { slideRight } from "./motionPresets";

interface Props { children: React.ReactNode; delay?: number; className?: string; }

export function SlideRight({ children, delay = 0, className }: Props) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ ...slideRight, visible: { ...slideRight.visible, transition: { ...slideRight.visible.transition, delay } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
