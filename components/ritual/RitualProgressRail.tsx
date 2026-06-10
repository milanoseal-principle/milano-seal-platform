"use client";

import { motion } from "framer-motion";

interface RitualProgressRailProps {
  label: string;
  reduced?: boolean;
}

export function RitualProgressRail({ label, reduced }: RitualProgressRailProps) {
  return (
    <div
      style={{
        width: "min(100%, 340px)",
        padding: "0 16px",
        marginBottom: 12,
      }}
    >
      {/* Rail */}
      <div
        style={{
          position: "relative",
          height: 2,
          background: "linear-gradient(90deg, rgba(212,175,55,0.08), rgba(212,175,55,0.45) 40%, rgba(244,229,184,0.6) 50%, rgba(212,175,55,0.45) 60%, rgba(212,175,55,0.08))",
          borderRadius: 2,
          overflow: "visible",
        }}
      >
        {/* Traveling light */}
        {!reduced && (
          <motion.div
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              width: 32,
              height: 12,
              background: "radial-gradient(ellipse at center, rgba(244,229,184,0.9) 0%, rgba(212,175,55,0.45) 40%, transparent 70%)",
              filter: "blur(3px)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
            animate={{ left: ["-5%", "105%"] }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 0.4,
            }}
          />
        )}
      </div>

      {/* Tick marks */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 3,
          paddingLeft: 2,
          paddingRight: 2,
        }}
      >
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            style={{
              width: 1,
              height: 3,
              background: i % 6 === 0 ? "rgba(212,175,55,0.45)" : "rgba(212,175,55,0.18)",
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Label */}
      <p
        style={{
          fontFamily: "monospace",
          fontSize: 8,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(212,175,55,0.45)",
          textAlign: "center",
          marginTop: 6,
          marginBottom: 0,
        }}
      >
        {label}
      </p>
    </div>
  );
}
