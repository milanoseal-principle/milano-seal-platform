"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  "Verifying Partner Credentials...",
  "Syncing Assigned Execution Routes...",
  "Preparing Partner Coordination Workspace...",
  "Loading Secure Exchange Queue...",
  "Preparing Assigned Matter Workspace...",
];

const RITUAL_KEY = "ms_alliance_ritual_seen";

export function AllianceEntryRitual() {
  const [done, setDone] = useState(() => {
    if (typeof window === "undefined") return true;
    return !!sessionStorage.getItem(RITUAL_KEY);
  });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (done) return;
    let i = 0;
    const advance = () => {
      if (i >= STEPS.length) {
        sessionStorage.setItem(RITUAL_KEY, "1");
        setTimeout(() => setDone(true), 300);
        return;
      }
      setStep(i + 1);
      i++;
      setTimeout(advance, 370);
    };
    setTimeout(advance, 200);
  }, [done]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: "rgba(10,8,4,0.98)", paddingTop: "var(--sa-top,0px)", paddingBottom: "var(--sa-bottom,0px)" }}
        >
          <div className="flex flex-col items-center w-full max-w-[280px] px-6 select-none">
            <div className="mb-5 text-center text-sm font-medium text-white/70 tracking-wide">
              The Milano Seal™
            </div>
            <div className="mb-6 text-center font-mono text-[8px] tracking-[0.26em] uppercase text-[#6A5520]">
              ALLIANCE PARTNER PORTAL
            </div>
            <div className="w-full space-y-0">
              {STEPS.map((label, idx) => {
                const isDone = step > idx;
                const isCurrent = step === idx;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3"
                    style={{
                      padding: "7px 0",
                      borderBottom: idx < STEPS.length - 1 ? "1px solid rgba(198,165,90,0.06)" : "none",
                      opacity: idx > step ? 0.12 : 1,
                      transition: "opacity 0.25s ease",
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: isDone ? "1px solid rgba(198,165,90,0.4)" : isCurrent ? "1px solid rgba(198,165,90,0.55)" : "1px solid rgba(255,255,255,0.06)",
                      background: isDone ? "rgba(198,165,90,0.1)" : "transparent",
                    }}>
                      {isDone && <span style={{ color: "#C6A55A", fontSize: 8, fontWeight: 700 }}>✓</span>}
                      {isCurrent && (
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.1, repeat: Infinity }}
                          style={{ width: 4, height: 4, borderRadius: "50%", background: "#C6A55A" }}
                        />
                      )}
                    </div>
                    <span style={{
                      fontSize: 11,
                      color: isDone ? "rgba(255,255,255,0.4)" : isCurrent ? "#fff" : "rgba(255,255,255,0.2)",
                      letterSpacing: "0.015em",
                    }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
