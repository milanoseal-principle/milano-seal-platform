"use client";

import React, { Children } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";

interface AtlasCountryRevealProps {
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
  countryName?: string;
  hagueMember?: boolean;
  apostilleRequired?: boolean | null;
  routingStatus?: string;
}

export function AtlasCountryReveal({ isVisible, children, className }: AtlasCountryRevealProps) {
  const reduced = useMilanoReducedMotion();
  const childArray = Children.toArray(children);

  if (reduced) {
    return isVisible ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <div className={className}>
          {/* Gold accent line */}
          <svg width="100%" height={2} style={{ display: "block", marginBottom: 8 }}>
            <motion.line
              x1="0"
              y1="1"
              x2="100%"
              y2="1"
              stroke="#D4AF37"
              strokeWidth={1.5}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </svg>

          {/* Staggered children */}
          {childArray.map((child, i) => (
            <motion.div
              key={i}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
            >
              {child}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
