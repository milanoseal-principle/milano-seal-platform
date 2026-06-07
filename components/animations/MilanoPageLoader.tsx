"use client";

import { useEffect, useState } from "react";
<<<<<<< HEAD
import { motion } from "framer-motion";

export interface MilanoPageLoaderProps {
  mode?: "bar" | "full";
  label?: string;
}

export function MilanoPageLoader({ mode = "bar", label }: MilanoPageLoaderProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const shouldAnimate = !reducedMotion;

  return (
    <>
      {/* Gold progress bar — fixed top */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          zIndex: 9999,
          background: "rgba(0,0,0,0.1)",
          pointerEvents: "none",
        }}
      >
        <motion.div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, #C5A059 0%, #D4AF37 100%)",
            transformOrigin: "left center",
          }}
          initial={{ width: shouldAnimate ? "0%" : "75%" }}
          animate={{ width: "75%" }}
          transition={
            shouldAnimate
              ? { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
              : { duration: 0 }
          }
        />
      </div>

      {/* Full mode: centered spinner */}
      {mode === "full" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            pointerEvents: "none",
          }}
        >
          {/* Spinning ring with M inside */}
          <div style={{ position: "relative", width: "52px", height: "52px" }}>
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "1.5px solid transparent",
                borderTopColor: "rgba(197,160,89,0.6)",
                borderRightColor: "rgba(197,160,89,0.2)",
              }}
              animate={shouldAnimate ? { rotate: 360 } : {}}
              transition={
                shouldAnimate
                  ? { duration: 2, repeat: Infinity, ease: "linear" }
                  : {}
              }
            />
            {/* Inner ring faint */}
            <div
              style={{
                position: "absolute",
                inset: "6px",
                borderRadius: "50%",
                border: "1px solid rgba(197,160,89,0.1)",
              }}
            />
            {/* M mark */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "16px",
                fontWeight: 600,
                color: "rgba(197,160,89,0.7)",
                letterSpacing: "-0.02em",
                userSelect: "none",
              }}
            >
              M
            </div>
          </div>

          {/* Optional label */}
          {label && (
            <span
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "10px",
                fontFamily: "ui-monospace, 'SF Mono', monospace",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
          )}
        </div>
      )}
    </>
=======
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
>>>>>>> claude/funny-maxwell-hlxQN
  );
}
