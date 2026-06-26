"use client";

import { motion, useReducedMotion } from "framer-motion";

type MilanoPulseOrbProps = {
  className?: string;
};

export function MilanoPulseOrb({ className }: MilanoPulseOrbProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className} />;
  }

  return (
    <motion.div
      className={className}
      animate={{
        opacity: [0.45, 0.8, 0.45],
        scale: [1, 1.035, 1],
      }}
      transition={{
        duration: 3.2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
