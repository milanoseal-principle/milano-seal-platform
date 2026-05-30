"use client";

import { motion } from "framer-motion";

type GlobalRouteAnimationProps = {
  className?: string;
};

export function GlobalRouteAnimation({ className = "" }: GlobalRouteAnimationProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 420 260"
        fill="none"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M95 145 C155 72 248 72 330 110"
          stroke="rgba(212,175,55,0.42)"
          strokeWidth="1"
          strokeDasharray="4 8"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0.12, 0.5, 0.18] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M95 145 C160 130 235 150 350 170"
          stroke="rgba(212,175,55,0.28)"
          strokeWidth="1"
          strokeDasharray="3 10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0.08, 0.38, 0.12] }}
          transition={{
            duration: 6.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.8
          }}
        />
        <motion.circle
          cx="95"
          cy="145"
          r="3"
          fill="rgba(212,175,55,0.85)"
          animate={{ scale: [1, 1.45, 1], opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
