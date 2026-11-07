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
  /** Application readiness gate. The ritual will never release before this is true unless hardTimeoutMs is reached. */
  ready?: boolean;
  /** Minimum time the secure-entry composition remains visible. */
  minimumDurationMs?: number;
  /** Safety release so a failed warmup cannot trap the user indefinitely. */
  hardTimeoutMs?: number;
  /** Keep the overlay mounted after onComplete while router navigation swaps the current route. */
  holdUntilUnmount?: boolean;
}

export function RitualEntryLock({
  eyebrow,
  steps,
  sectionLabel,
  statusText = "Preparing your secure document execution environment.",
  footerText = "SECURE WORKSPACE READY",
  sessionKey,
  onComplete,
  ready = true,
  minimumDurationMs = 3200,
  hardTimeoutMs = 6500,
  holdUntilUnmount = false,
}: RitualEntryLockProps) {
  const [completedCount, setCompletedCount] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [cinematicReady, setCinematicReady] = useState(false);
  const [hardTimeoutReached, setHardTimeoutReached] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [gone, setGone] = useState(false);
  const [reduced, setReduced] = useState(false);
  const dismissedRef = useRef(false);
  const navigationFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  const releaseReady = cinematicReady && (ready || hardTimeoutReached);

  useEffect(() => {
    if (sessionKey && typeof window !== "undefined") {
      try {
        if (window.sessionStorage.getItem(sessionKey)) {
          setGone(true);
          return;
        }
      } catch {
        setGone(true);
      }
    }
  }, [sessionKey]);

  useEffect(
    () => () => {
      if (navigationFallbackRef.current) clearTimeout(navigationFallbackRef.current);
    },
    [],
  );

  const persistSession = useCallback(() => {
    if (!sessionKey || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(sessionKey, "1");
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }
  }, [sessionKey]);

  const dismiss = useCallback(() => {
    if (dismissedRef.current || !releaseReady) return;
    dismissedRef.current = true;
    persistSession();

    if (holdUntilUnmount && onComplete) {
      // Navigation starts while this full-screen cover stays mounted. The route
      // swap unmounts it, preventing the source page or destination shell from
      // flashing underneath the cinematic transition.
      onComplete();
      navigationFallbackRef.current = setTimeout(() => {
        setExiting(true);
        setTimeout(() => setGone(true), reduced ? 150 : 450);
      }, 2500);
      return;
    }

    setExiting(true);
    setTimeout(
      () => {
        setGone(true);
        onComplete?.();
      },
      reduced ? 200 : 700,
    );
  }, [holdUntilUnmount, onComplete, persistSession, reduced, releaseReady]);

  useEffect(() => {
    if (gone) return;
    if (sessionKey && typeof window !== "undefined") {
      try {
        if (window.sessionStorage.getItem(sessionKey)) return;
      } catch {
        // Continue without session persistence when storage is unavailable.
      }
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setShowContent(true), reduced ? 50 : 400));

    steps.forEach((_, index) => {
      timers.push(
        setTimeout(
          () => setCompletedCount((count) => Math.min(steps.length, count + 1)),
          reduced ? 150 + index * 80 : 1600 + index * 380,
        ),
      );
    });

    const visualSequenceMs = reduced ? 500 : 1600 + steps.length * 380 + 500;
    const minimumReleaseMs = Math.max(minimumDurationMs, visualSequenceMs);
    timers.push(setTimeout(() => setCinematicReady(true), minimumReleaseMs));
    timers.push(setTimeout(() => setHardTimeoutReached(true), Math.max(hardTimeoutMs, minimumReleaseMs)));

    return () => timers.forEach(clearTimeout);
  }, [gone, hardTimeoutMs, minimumDurationMs, reduced, sessionKey, steps]);

  useEffect(() => {
    if (!releaseReady || dismissedRef.current) return;
    const timer = setTimeout(() => dismiss(), reduced ? 120 : 500);
    return () => clearTimeout(timer);
  }, [dismiss, reduced, releaseReady]);

  useEffect(() => {
    if (!releaseReady) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismiss, releaseReady]);

  if (gone) return null;

  return (
    <AnimatePresence>
      {!exiting && (
        <>
          <style>{`
            @keyframes ritualEntrance {
              0%   { opacity: 0; transform: scale(0.985); }
              65%  { opacity: 1; transform: scale(1.005); }
              100% { opacity: 1; transform: scale(1.0); }
            }
            @media (prefers-reduced-motion: reduce) {
              .ritual-entry-lock-root { animation: none !important; opacity: 1 !important; }
            }
          `}</style>
          <motion.div
            key="ritual-entry-lock"
            className="ritual-entry-lock-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.035, filter: "blur(8px)" }}
            transition={{ duration: reduced ? 0.15 : 0.65, ease: [0.16, 1, 0.3, 1] }}
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
              cursor: releaseReady ? "pointer" : "default",
              paddingTop: "var(--sa-top, 0px)",
              paddingBottom: "var(--sa-bottom, 0px)",
              animation: reduced ? "none" : "ritualEntrance 0.55s cubic-bezier(0.22,1,0.36,1) both",
            }}
            onClick={() => releaseReady && dismiss()}
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
              animate={reduced ? {} : { opacity: [0.8, 1, 0.85] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
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
              initial={reduced ? {} : { opacity: 0, scale: 0.92, y: 18, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: reduced ? 0.15 : 1.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: 20, position: "relative", zIndex: 1 }}
            >
              <RitualMedallion reduced={reduced} />
            </motion.div>

            <motion.div
              initial={reduced ? {} : { opacity: 0, y: 8 }}
              animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: reduced ? 0.1 : 0.55, ease: "easeOut" }}
              style={{ textAlign: "center", marginBottom: 8, position: "relative", zIndex: 1 }}
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
                    "linear-gradient(105deg, var(--ms-gold) 38%, #f4e5b8 50%, var(--ms-gold) 62%)",
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
                style={{ display: "flex", alignItems: "center", gap: 8, width: 260, margin: "8px auto" }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)",
                  }}
                />
                <span style={{ color: "rgba(212,175,55,0.55)", fontSize: 7 }}>◆</span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)",
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
                {hardTimeoutReached && !ready
                  ? "Secure entry prepared. Loading the authenticated workspace…"
                  : statusText}
              </p>
            </motion.div>

            <motion.div
              initial={reduced ? {} : { opacity: 0, y: 6 }}
              animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
              transition={{ duration: reduced ? 0.1 : 0.5, delay: reduced ? 0 : 0.1, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}
            >
              <RitualProgressRail label={sectionLabel} reduced={reduced} />
              <div style={{ width: "min(100%, 340px)", padding: "0 16px" }}>
                <RitualChecklist items={steps} completedCount={completedCount} />
              </div>
            </motion.div>

            <motion.div
              animate={{ opacity: releaseReady ? 1 : 0 }}
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
        </>
      )}
    </AnimatePresence>
  );
}
