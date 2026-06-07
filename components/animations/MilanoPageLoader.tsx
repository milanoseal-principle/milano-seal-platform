"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface MilanoPageLoaderProps {
  complete?: boolean;
}

export function MilanoPageLoader({ complete = false }: MilanoPageLoaderProps) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (complete) {
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [complete]);

  if (reduced) {
    if (!visible) return null;
    return (
      <div
        className="fixed top-0 left-0 right-0 z-50"
        style={{ height: 2, background: "#D4AF37" }}
      />
    );
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50"
          style={{ height: 2, background: "rgba(6,4,2,0.98)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            style={{ height: "100%", background: "#D4AF37", transformOrigin: "left center" }}
            initial={{ scaleX: 0 }}
            animate={complete ? { scaleX: 1 } : { scaleX: 0.75 }}
            transition={
              complete
                ? { duration: 0.2, ease: "easeOut" }
                : { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
            }
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MilanoFullPageLoader() {
  const reduced = useReducedMotion();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(6,4,2,0.98)" }}
    >
      <MilanoPageLoader />
      {reduced ? (
        <svg width={64} height={64} viewBox="0 0 64 64">
          <circle
            cx={32}
            cy={32}
            r={24}
            fill="none"
            stroke="#D4AF37"
            strokeWidth={2}
            strokeDasharray="36 114"
          />
        </svg>
      ) : (
        <motion.svg
          width={64}
          height={64}
          viewBox="0 0 64 64"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity }}
        >
          <circle
            cx={32}
            cy={32}
            r={24}
            fill="none"
            stroke="#D4AF37"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="36 114"
          />
        </motion.svg>
      )}
    </div>
  );
}
