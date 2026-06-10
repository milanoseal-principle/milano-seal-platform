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

    ts.push(setTimeout(() => setShowContent(true), 350));

    steps.forEach((_, i) => {
      ts.push(
        setTimeout(() => {
          setCompletedCount((c) => c + 1);
        }, 1200 + i * 340)
      );
    });

    const allStepsDone = 1200 + steps.length * 340 + 450;
    ts.push(setTimeout(() => setReadyForExit(true), allStepsDone));
    ts.push(setTimeout(() => dismiss(), allStepsDone + 1100));

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
            paddingTop: "max(18px, env(safe-area-inset-top))",
            paddingBottom: "max(18px, env(safe-area-inset-bottom))",
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
              width: 520,
              height: "72%",
              background:
                "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(231,200,120,0.18) 0%, rgba(198,166,91,0.07) 35%, transparent 72%)",
              pointerEvents: "none",
            }}
            animate={reduced ? {} : { opacity: [0.78, 1, 0.82] }}
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
                "radial-gradient(ellipse 58% 58% at 50% 37%, transparent 38%, rgba(5,5,7,0.72) 100%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              width: "min(94vw, 920px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <motion.div
              initial={
                reduced ? {} : { opacity: 0, scale: 0.92, y: 18, filter: "blur(10px)" }
              }
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: reduced ? 0.15 : 1.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ marginBottom: 4, position: "relative", zIndex: 1 }}
            >
              <RitualMedallion reduced={reduced} />
            </motion.div>

            <motion.div
              initial={reduced ? {} : { opacity: 0, y: 8 }}
              animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: reduced ? 0.1 : 0.55, ease: "easeOut" }}
              style={{
                textAlign: "center",
                marginTop: -10,
                marginBottom: 18,
                position: "relative",
                zIndex: 1,
              }}
            >
              {eyebrow && (
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: "rgba(212,175,55,0.5)",
                    marginBottom: 8,
                  }}
                >
                  {eyebrow}
                </p>
              )}

              <h1
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontWeight: "normal",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontSize: "clamp(2.5rem, 5.6vw, 4.7rem)",
                  lineHeight: 0.95,
                  background:
                    "linear-gradient(105deg, #a87822 18%, #f4e5b8 46%, #c6a55a 70%, #8a5f1d 100%)",
                  backgroundSize: "240% 100%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 24px rgba(212,175,55,0.28))",
                  margin: 0,
                  whiteSpace: "nowrap",
                }}
              >
                The Milano Seal™
              </h1>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "min(72vw, 560px)",
                  margin: "18px auto 14px",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.44), transparent)" }} />
                <span style={{ color: "rgba(212,175,55,0.7)", fontSize: 9 }}>◆</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.44), transparent)" }} />
              </div>

              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "clamp(0.68rem, 1.15vw, 0.92rem)",
                  letterSpacing: "0.42em",
                  textTransform: "uppercase",
                  color: "rgba(231,200,120,0.72)",
                  margin: 0,
                }}
              >
                Sealing Trust With Every Signature™
              </p>

              <p
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "clamp(1rem, 1.55vw, 1.35rem)",
                  color: "rgba(255,255,255,0.82)",
                  marginTop: 30,
                  marginBottom: 0,
                }}
              >
                {statusText}
              </p>
            </motion.div>

            <motion.div
              initial={reduced ? {} : { opacity: 0, y: 6 }}
              animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
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
                width: "min(92vw, 620px)",
              }}
            >
              <RitualProgressRail label={sectionLabel} reduced={reduced} />
              <div style={{ width: "min(100%, 560px)", padding: "0 20px" }}>
                <RitualChecklist items={steps} completedCount={completedCount} />
              </div>
            </motion.div>

            <motion.div
              animate={{ opacity: readyForExit ? 1 : 0 }}
              transition={{ duration: reduced ? 0.1 : 0.5 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                marginTop: 24,
                fontSize: "clamp(0.75rem, 1.35vw, 1rem)",
                fontFamily: "monospace",
                letterSpacing: "0.42em",
                textTransform: "uppercase",
                color: "rgba(231,200,120,0.82)",
                position: "relative",
                zIndex: 1,
                width: "min(92vw, 720px)",
              }}
            >
              <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.38))" }} />
              <ShieldCheck size={24} style={{ color: "#d4af37", flexShrink: 0 }} />
              <span>{footerText}</span>
              <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(212,175,55,0.38), transparent)" }} />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
