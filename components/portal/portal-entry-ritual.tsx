"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onComplete: () => void;
}

const STEPS = [
  "Verifying matter access",
  "Loading execution status",
  "Confirming payment and scheduling state",
  "Preparing document vault",
  "Ready",
];

const STEP_MS = [380, 380, 400, 340, 220];

function SealMark() {
  const g = "#C6A55A";
  return (
    <svg width={48} height={48} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="46" stroke={g} strokeWidth="1.5" fill="none" opacity={0.6} />
      <path
        d="M60 20 C76 24 80 44 74 60 C68 50 62 45 56 43 C68 39 68 27 60 20Z"
        fill={g}
        opacity={0.85}
      />
      <path
        d="M22,72 L22,28 L50,53"
        stroke={g}
        strokeWidth="5"
        fill="none"
        strokeLinecap="square"
      />
      <path
        d="M78,72 L78,28 L50,53"
        stroke={g}
        strokeWidth="5"
        fill="none"
        strokeLinecap="square"
      />
      <line x1="15" y1="28" x2="29" y2="28" stroke={g} strokeWidth="3" />
      <line x1="15" y1="72" x2="29" y2="72" stroke={g} strokeWidth="3" />
      <line x1="71" y1="28" x2="85" y2="28" stroke={g} strokeWidth="3" />
      <line x1="71" y1="72" x2="85" y2="72" stroke={g} strokeWidth="3" />
    </svg>
  );
}

export function PortalEntryRitual({ onComplete }: Props) {
  const [reached, setReached] = useState(0);

  useEffect(() => {
    let i = 0;
    function advance() {
      if (i >= STEPS.length) {
        setTimeout(onComplete, 420);
        return;
      }
      setTimeout(() => {
        setReached(i + 1);
        i++;
        advance();
      }, STEP_MS[i] ?? 340);
    }
    advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allDone = reached >= STEPS.length;

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(198,165,90,0.05) 0%, #060608 55%)",
      }}
    >
      <div className="flex flex-col items-center w-full max-w-[320px] px-8 select-none">
        {/* Seal logomark */}
        <motion.div
          className="mb-8 relative flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
            className="absolute"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: "1px dashed rgba(198,165,90,0.12)",
            }}
          />
          <SealMark />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <div
            style={{
              fontFamily: "var(--font-playfair, Georgia), serif",
              fontSize: 17,
              fontWeight: 400,
              color: "#fff",
              letterSpacing: "0.03em",
              marginBottom: 5,
            }}
          >
            Secure Matter Access
          </div>
          <div
            style={{
              fontSize: 8,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Preparing private workspace
          </div>
        </motion.div>

        {/* Procedural steps — refined list, no terminal */}
        <div className="w-full space-y-0">
          {STEPS.map((label, idx) => {
            const isDone = reached > idx;
            const isCurrent = reached === idx;
            const isPending = reached < idx;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: isPending ? 0.12 : 1,
                }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom:
                    idx < STEPS.length - 1
                      ? "1px solid rgba(198,165,90,0.06)"
                      : "none",
                }}
              >
                {/* State indicator */}
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isDone
                      ? "rgba(198,165,90,0.14)"
                      : isCurrent
                      ? "transparent"
                      : "transparent",
                    border: isDone
                      ? "1px solid rgba(198,165,90,0.4)"
                      : isCurrent
                      ? "1px solid rgba(198,165,90,0.55)"
                      : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {isDone && (
                    <span
                      style={{
                        color: "#C6A55A",
                        fontSize: 9,
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      ✓
                    </span>
                  )}
                  {isCurrent && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "#C6A55A",
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: isCurrent ? 500 : 400,
                    color: isDone
                      ? "rgba(255,255,255,0.5)"
                      : isCurrent
                      ? "#fff"
                      : "rgba(255,255,255,0.25)",
                    letterSpacing: "0.02em",
                    transition: "color 0.25s ease",
                  }}
                >
                  {label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Completion fade */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                marginTop: 24,
                fontSize: 9,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(198,165,90,0.7)",
                textAlign: "center",
              }}
            >
              Access Granted
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
