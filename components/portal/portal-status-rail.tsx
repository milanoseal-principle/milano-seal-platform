"use client";

// PORTAL-MOTION-01: Premium status rail
// Gold pulse on active step, stagger entrance, payment gate reveal,
// reduced-motion fallback via useReducedMotion().

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

export interface StatusStep {
  keys: string[];
  label: string;
  desc: string;
}

export const MATTER_STEPS: StatusStep[] = [
  {
    keys: ["new", "intake_received"],
    label: "Intake Received",
    desc: "Your matter has been received and is being structured for review.",
  },
  {
    keys: ["under_review", "compliance_review", "needs_info", "compliance_blocked"],
    label: "Under Review",
    desc: "Your document path is being reviewed for execution readiness and international use.",
  },
  {
    keys: ["quoted", "awaiting_payment"],
    label: "Invoice Issued",
    desc: "Your execution proposal is ready. Payment is required before scheduling can begin.",
  },
  {
    keys: ["payment_confirmed"],
    label: "Payment Confirmed",
    desc: "Payment has been confirmed. Scheduling is now unlocked.",
  },
  {
    keys: ["scheduled", "in_execution"],
    label: "In Execution",
    desc: "Your execution session or document handling step is in progress.",
  },
  {
    keys: ["apostille_processing", "courier_ready"],
    label: "Apostille & Packaging",
    desc: "Your document has moved into apostille processing and is being prepared for secure release.",
  },
  {
    keys: ["shipped", "delivered"],
    label: "Delivery",
    desc: "Your document has been released for courier delivery.",
  },
  {
    keys: ["completed", "review_requested", "closed"],
    label: "Matter Closed",
    desc: "Your matter has been completed and all documents released.",
  },
];

export function resolveStepIndex(status: string | null | undefined): number {
  if (!status) return 0;
  const idx = MATTER_STEPS.findIndex((s) => s.keys.includes(status));
  return idx === -1 ? 0 : idx;
}

const GOLD = "#C6A55A";
const GOLD_FAINT = "rgba(198,165,90,0.18)";
const GOLD_MID = "rgba(198,165,90,0.45)";

interface Props {
  matterStatus: string | null | undefined;
  paymentStatus?: string | null;
}

export function PortalStatusRail({ matterStatus, paymentStatus }: Props) {
  const reduced = useReducedMotion();
  const currentIdx = resolveStepIndex(matterStatus);
  const isPaymentGate =
    matterStatus === "awaiting_payment" && paymentStatus !== "paid" && paymentStatus !== "confirmed";

  return (
    <div style={{ position: "relative" }}>
      {MATTER_STEPS.map((step, i) => {
        const done = currentIdx > i;
        const active = currentIdx === i;
        const pending = currentIdx < i;

        return (
          <motion.div
            key={step.label}
            initial={reduced ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reduced ? {} : { duration: 0.3, delay: i * 0.055, ease: "easeOut" }}
            style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 4, position: "relative" }}
          >
            {/* Vertical connector line */}
            {i < MATTER_STEPS.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  top: 28,
                  width: 2,
                  height: 28,
                  background: done ? GOLD : GOLD_FAINT,
                  borderRadius: 1,
                  transition: reduced ? "none" : "background 0.4s ease",
                }}
              />
            )}

            {/* Step dot */}
            <div style={{ position: "relative", flexShrink: 0, width: 28, height: 28, marginTop: 2 }}>
              {/* Gold pulse ring on active step */}
              {active && !reduced && (
                <motion.div
                  animate={{
                    scale: [1, 1.55, 1],
                    opacity: [0.55, 0, 0.55],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    position: "absolute",
                    inset: -4,
                    borderRadius: "50%",
                    border: `1.5px solid ${GOLD}`,
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Core dot */}
              <motion.div
                animate={
                  active && !reduced
                    ? { boxShadow: [`0 0 0 0 ${GOLD_MID}`, `0 0 8px 3px ${GOLD_MID}`, `0 0 0 0 ${GOLD_MID}`] }
                    : {}
                }
                transition={active && !reduced ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : {}}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: done ? 12 : 11,
                  fontWeight: 600,
                  background: done
                    ? GOLD
                    : active
                    ? "rgba(198,165,90,0.12)"
                    : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${done ? GOLD : active ? GOLD : GOLD_FAINT}`,
                  color: done ? "#1a1507" : active ? GOLD : "rgba(255,255,255,0.28)",
                  transition: reduced ? "none" : "background 0.35s, border-color 0.35s, color 0.35s",
                }}
              >
                {done ? "✓" : active ? "●" : i + 1}
              </motion.div>
            </div>

            {/* Label + description */}
            <div style={{ paddingTop: 4, paddingBottom: 18, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : done ? 500 : 400,
                  color: active ? GOLD : done ? "rgba(198,165,90,0.75)" : "rgba(255,255,255,0.3)",
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  letterSpacing: active ? "0.01em" : "normal",
                  transition: reduced ? "none" : "color 0.3s",
                }}
              >
                {step.label}
              </div>

              <AnimatePresence>
                {(active || done) && (
                  <motion.div
                    key={`desc-${i}`}
                    initial={reduced ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={reduced ? {} : { opacity: 0, height: 0 }}
                    transition={reduced ? {} : { duration: 0.28, ease: "easeOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 11.5,
                        color: active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.22)",
                        lineHeight: 1.5,
                      }}
                    >
                      {step.desc}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Payment gate reveal — shown only on awaiting_payment when not yet paid */}
              <AnimatePresence>
                {active && isPaymentGate && step.keys.includes("awaiting_payment") && (
                  <motion.div
                    key="payment-gate"
                    initial={reduced ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? {} : { opacity: 0, y: 4 }}
                    transition={reduced ? {} : { duration: 0.35, delay: 0.15, ease: "easeOut" }}
                    style={{
                      marginTop: 8,
                      padding: "7px 10px",
                      borderRadius: 4,
                      background: "rgba(198,165,90,0.06)",
                      border: `1px solid rgba(198,165,90,0.2)`,
                      fontSize: 11,
                      color: GOLD,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ opacity: 0.7 }}>⬤</span>
                    Payment required to unlock scheduling
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
