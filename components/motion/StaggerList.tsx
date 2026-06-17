"use client";
import { motion, useReducedMotion } from "framer-motion";
import { staggerContainer, fadeUp } from "./motionPresets";

interface Props { children: React.ReactNode; className?: string; }

export function StaggerList({ children, className }: Props) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.ul initial="hidden" animate="visible" variants={staggerContainer} className={className}>
      {children}
    </motion.ul>
  );
}

export function StaggerItem({ children, className }: Props) {
  const reduced = useReducedMotion();
  if (reduced) return <li className={className}>{children}</li>;
  return (
    <motion.li variants={fadeUp} className={className}>
      {children}
    </motion.li>
  );
}
