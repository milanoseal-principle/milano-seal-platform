"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { WorldMapCanvas } from "@/components/rituals/WorldMapCanvas";
import { RitualMedallion } from "@/components/ritual/RitualMedallion";
import { RitualProgressRail } from "@/components/ritual/RitualProgressRail";
import { RitualChecklist } from "@/components/ritual/RitualChecklist";

interface RitualEntryLockProps {
  eyebrow?: string;
  steps: string[];
  sectionLabel: string;
  statusText?: string;
  footerText?: string;
  sessionKey?: string;
  onComplete?: () => void;
}

export function RitualEntryLock({
  eyebrow,
  steps,
  sectionLabel,
  statusText = "Preparing your secure document execution environment.",
  footerText = "SECURE WORKSPACE READY",
  sessionKey,
  onComplete,
}: RitualEntryLockProps) {
  const [completedCount, setCompletedCount] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [readyForExit, setReadyForExit] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [gone, setGone] = useState(false);
  const dismissedRef = useRef<boolean>(false);

  const reduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  useEffect(() => {
    if (sessionKey && typeof sessionStorage !== "undefined") {
      if (sessionStorage.getItem(sessionKey)) {
        setGone(true);
        return;
      }
    }
  }, [sessionKey]);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    if (sessionKey && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(sessionKey, "1");
    }
    setExiting(true);
    setTimeout(
      () => {
        setGone(true);
        onComplete?.();
      },
      reduced ? 200 : 700
    );
  }, [sessionKey, onComplete, reduced]);

  useEffect(() => {
    if (gone) return;
    if (sessionKey && typeof sessionStorage !== "undefined") {
      if (sessionStorage.getItem(sessionKey)) return;
    }

    const ts: ReturnType<typeof setTimeout>[] = [];

    ts.push(setTimeout(() => setShowContent(true), 400));

    steps.forEach((_, i) => {
      ts.push(
        setTimeout(() => {
          setCompletedCount((c) => c + 1);
        }, 1600 + i * 380)
      );
    });

    const allStepsDone = 1600 + steps.length * 380 + 500;
    ts.push(setTimeout(() => setReadyForExit(true), allStepsDone));
    ts.push(setTimeout(() => dismiss(), allStepsDone + 800));

    return () => ts.forEach(clearTimeout);
  }, [gone, steps, sessionKey, dismiss]);

  useEffect(() => {
    if (!readyForExit) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [readyForExit, dismiss]);

  if (gone) return null;

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="ritual-entry-lock"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={
            reduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 1.035, filter: "blur(8px)" }
          }
          transition={{
            duration: reduced ? 0.15 : 0.65,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            background: "#050507",
            cursor: readyForExit ? "pointer" : "default",
            paddingTop: "var(--sa-top, 0px)",
            paddingBottom: "var(--sa-bottom, 0px)",
          }}
          onClick={() => readyForExit && dismiss()}
          aria-hidden="true"
        >
          <WorldMapCanvas />

          <motion.div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 280,
              height: "60%",
              background:
                "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(212,175,55,0.09) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
            animate={reduced ? {} : { opacity: [0.8, 1.0, 0.85] }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 70% 65% at 50% 40%, transparent 40%, rgba(5,5,7,0.75) 100%)",
              pointerEvents: "none",
            }}
          />

          <motion.div
            initial={
              reduced ? {} : { opacity: 0, scale: 0.92, y: 18, filter: "blur(10px)" }
            }
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: reduced ? 0.15 : 1.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ marginBottom: 20, position: "relative", zIndex: 1 }}
          >
            <RitualMedallion reduced={reduced} />
          </motion.div>

          <motion.div
            initial={reduced ? {} : { opacity: 0, y: 8 }}
            animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: reduced ? 0.1 : 0.55, ease: "easeOut" }}
            style={{
              textAlign: "center",
              marginBottom: 8,
              position: "relative",
              zIndex: 1,
            }}
          >
            {eyebrow && (
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(212,175,55,0.45)",
                  marginBottom: 6,
                }}
              >
                {eyebrow}
              </p>
            )}

            <h1
              style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontWeight: "normal",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
                background:
                  "linear-gradient(105deg, #c6a55a 38%, #f4e5b8 50%, #c6a55a 62%)",
                backgroundSize: "240% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 22px rgba(212,175,55,0.28))",
                margin: 0,
              }}
            >
              The Milano Seal™
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: 260,
                margin: "8px auto",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)",
                }}
              />
              <span style={{ color: "rgba(212,175,55,0.55)", fontSize: 7 }}>
                ◆
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)",
                }}
              />
            </div>

            <p
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.45)",
                margin: 0,
              }}
            >
              Sealing Trust With Every Signature™
            </p>

            <p
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 13,
                color: "rgba(255,255,255,0.35)",
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              {statusText}
            </p>
          </motion.div>

          <motion.div
            initial={reduced ? {} : { opacity: 0, y: 6 }}
            animate={
              showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }
            }
            transition={{
              duration: reduced ? 0.1 : 0.5,
              delay: reduced ? 0 : 0.1,
              ease: "easeOut",
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <RitualProgressRail label={sectionLabel} reduced={reduced} />
            <div style={{ width: "min(100%, 340px)", padding: "0 16px" }}>
              <RitualChecklist items={steps} completedCount={completedCount} />
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: readyForExit ? 1 : 0 }}
            transition={{ duration: reduced ? 0.1 : 0.5 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 24,
              fontSize: 9,
              fontFamily: "monospace",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "rgba(212,175,55,0.7)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <ShieldCheck size={14} style={{ color: "#d4af37" }} />
            <span>{footerText}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
