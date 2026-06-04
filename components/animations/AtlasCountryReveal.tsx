"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface AtlasCountryRevealProps {
  isVisible: boolean;
  countryName: string;
  hagueMember: boolean;
  apostilleRequired: boolean | null;
  routingStatus: "ACTIVE" | "MANUAL_REVIEW" | "UNKNOWN";
  children?: React.ReactNode;
}

const ROUTING_CONFIG = {
  ACTIVE: { label: "Active Route", color: "#C5A059", bg: "rgba(197,160,89,0.12)", border: "rgba(197,160,89,0.4)" },
  MANUAL_REVIEW: { label: "Manual Review", color: "#D97706", bg: "rgba(217,119,6,0.12)", border: "rgba(217,119,6,0.4)" },
  UNKNOWN: { label: "Status Unknown", color: "#64748B", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)" },
};

function HaguePill({ member }: { member: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "20px",
        fontSize: "10px",
        fontFamily: "ui-monospace, 'SF Mono', monospace",
        fontWeight: 500,
        letterSpacing: "0.04em",
        background: member ? "rgba(63,164,122,0.12)" : "rgba(100,116,139,0.12)",
        border: `1px solid ${member ? "rgba(63,164,122,0.4)" : "rgba(100,116,139,0.3)"}`,
        color: member ? "#3FA47A" : "#64748B",
        userSelect: "none",
      }}
    >
      {member ? "Hague Member" : "Non-Hague"}
    </span>
  );
}

function RoutingPill({ status }: { status: "ACTIVE" | "MANUAL_REVIEW" | "UNKNOWN" }) {
  const cfg = ROUTING_CONFIG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "20px",
        fontSize: "10px",
        fontFamily: "ui-monospace, 'SF Mono', monospace",
        fontWeight: 500,
        letterSpacing: "0.04em",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        userSelect: "none",
      }}
    >
      {cfg.label}
    </span>
  );
}

export function AtlasCountryReveal({
  isVisible,
  countryName,
  hagueMember,
  apostilleRequired,
  routingStatus,
  children,
}: AtlasCountryRevealProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [accentDone, setAccentDone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Reset accent draw when panel closes/reopens
  useEffect(() => {
    if (!isVisible) {
      setAccentDone(false);
    }
  }, [isVisible]);

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.05,
        delayChildren: reducedMotion ? 0 : 0.2,
      },
    },
  };

  const childItem = {
    initial: { opacity: 0, y: reducedMotion ? 0 : 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : {
                  enter: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                  exit: { duration: 0.2, ease: "easeIn" },
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }
          }
          style={{
            background: "rgba(8,9,13,0.96)",
            border: "1px solid rgba(197,160,89,0.2)",
            borderRadius: "12px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Gold top accent line draws left to right */}
          <div
            style={{
              position: "relative",
              height: "2px",
              background: "rgba(197,160,89,0.1)",
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                background: "linear-gradient(90deg, #C5A059 0%, #D4AF37 60%, rgba(212,175,55,0.4) 100%)",
                originX: 0,
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.15 }
              }
              onAnimationComplete={() => setAccentDone(true)}
            />
          </div>

          {/* Content */}
          <motion.div
            style={{ padding: "16px 18px 14px" }}
            variants={staggerChildren}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Country name */}
            <motion.h3
              variants={childItem}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "18px",
                fontWeight: 600,
                color: "#FFFFFF",
                margin: "0 0 10px 0",
                letterSpacing: "-0.01em",
              }}
            >
              {countryName}
            </motion.h3>

            {/* Status pills row */}
            <motion.div
              variants={childItem}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "10px",
              }}
            >
              <HaguePill member={hagueMember} />
              <RoutingPill status={routingStatus} />
              {apostilleRequired !== null && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: "20px",
                    fontSize: "10px",
                    fontFamily: "ui-monospace, 'SF Mono', monospace",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    background: apostilleRequired
                      ? "rgba(197,160,89,0.12)"
                      : "rgba(100,116,139,0.12)",
                    border: `1px solid ${apostilleRequired ? "rgba(197,160,89,0.4)" : "rgba(100,116,139,0.3)"}`,
                    color: apostilleRequired ? "#C5A059" : "#64748B",
                    userSelect: "none",
                  }}
                >
                  {apostilleRequired ? "Apostille Required" : "No Apostille"}
                </span>
              )}
            </motion.div>

            {/* Children with stagger */}
            {children && (
              <motion.div
                variants={childItem}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            )}

            {/* Governance disclaimer */}
            <motion.p
              variants={childItem}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
              style={{
                margin: "10px 0 0 0",
                fontSize: "9px",
                fontFamily: "ui-monospace, 'SF Mono', monospace",
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.03em",
                lineHeight: 1.5,
              }}
            >
              Requirements verified at intake. Route subject to operator confirmation.
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
