"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

const HOME_SESSION_KEY = "milano_ritual_home_seen";

const HOME_STEPS = [
  "Verifying secure workspace",
  "Preparing Global Document Intelligence",
  "Reviewing execution pathway",
  "Checking payment-gated scheduling",
  "Structuring chain-of-custody visibility",
  "Ready for review",
];

const ease = [0.16, 1, 0.3, 1] as const;

function HomepageLiveRitualScene({
  reduced,
  completedCount,
  sectionLabel,
  statusText,
  footerText,
}: {
  reduced: boolean;
  completedCount: number;
  sectionLabel: string;
  statusText: string;
  footerText: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "min(100vw, 941px)",
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "clamp(24px, 3.2vh, 54px) clamp(18px, 4vw, 58px)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-8%",
          zIndex: 0,
          opacity: reduced ? 0.38 : 0.72,
          pointerEvents: "none",
        }}
      >
        <WorldMapCanvas />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.32 } : { opacity: [0.22, 0.56, 0.3] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(78vw, 760px)",
          height: "48vh",
          zIndex: 1,
          pointerEvents: "none",
          mixBlendMode: "screen",
          background:
            "radial-gradient(ellipse at top, rgba(255,222,145,0.42), rgba(212,175,55,0.13) 38%, transparent 78%)",
        }}
      />

      <motion.div
        initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.72, y: 12, filter: "blur(16px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: reduced ? 0.1 : 1.05, delay: reduced ? 0 : 0.55, ease }}
        style={{
          position: "relative",
          zIndex: 2,
          marginTop: "clamp(4px, 1.2vh, 18px)",
        }}
      >
        <RitualMedallion reduced={reduced} />
      </motion.div>

      <motion.div
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 18, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: reduced ? 0.1 : 0.9, delay: reduced ? 0 : 1.35, ease }}
        style={{
          position: "relative",
          zIndex: 3,
          textAlign: "center",
          width: "100%",
          marginTop: "clamp(-18px, -1.2vh, -4px)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            fontWeight: 400,
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            fontSize: "clamp(2.35rem, 7.4vw, 5rem)",
            lineHeight: 0.96,
            margin: 0,
            whiteSpace: "nowrap",
            color: "#e6c878",
            textShadow: "0 3px 10px rgba(0,0,0,0.95), 0 0 20px rgba(212,175,55,0.22)",
          }}
        >
          THE MILANO SEAL™
        </h1>

        <motion.div
          initial={reduced ? { scaleX: 1, opacity: 1 } : { scaleX: 0.3, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: reduced ? 0.1 : 0.65, delay: reduced ? 0 : 1.7, ease }}
          style={{
            width: "min(76vw, 760px)",
            height: 1,
            margin: "clamp(14px, 2.2vh, 24px) auto clamp(8px, 1.3vh, 14px)",
            background:
              "linear-gradient(90deg, transparent, rgba(244,229,184,0.78), transparent)",
            position: "relative",
            transformOrigin: "50% 50%",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 10,
              height: 10,
              transform: "translate(-50%, -50%) rotate(45deg)",
              border: "1px solid rgba(244,229,184,0.9)",
              background: "#050507",
              boxShadow: "0 0 12px rgba(212,175,55,0.42)",
            }}
          />
        </motion.div>

        <motion.p
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.1 : 0.7, delay: reduced ? 0 : 1.9, ease }}
          style={{
            margin: 0,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "clamp(0.72rem, 2vw, 1.05rem)",
            letterSpacing: "0.43em",
            textTransform: "uppercase",
            color: "rgba(244,229,184,0.9)",
            textShadow: "0 0 14px rgba(212,175,55,0.28)",
          }}
        >
          SEALING TRUST WITH EVERY SIGNATURE™
        </motion.p>
      </motion.div>

      <motion.p
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.1 : 0.7, delay: reduced ? 0 : 2.2, ease }}
        style={{
          position: "relative",
          zIndex: 3,
          margin: "clamp(34px, 5vh, 62px) 0 clamp(14px, 2vh, 24px)",
          fontFamily: "system-ui, sans-serif",
          fontSize: "clamp(1rem, 2.5vw, 1.35rem)",
          color: "rgba(255,255,255,0.88)",
          textAlign: "center",
        }}
      >
        {statusText}
      </motion.p>

      <motion.div
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.1 : 0.75, delay: reduced ? 0 : 2.45, ease }}
        style={{
          position: "relative",
          zIndex: 3,
          width: "min(78vw, 650px)",
        }}
      >
        <RitualProgressRail label={sectionLabel} reduced={reduced} />
      </motion.div>

      <motion.div
        initial={reduced ? { opacity: 1 } : { opacity: 0, x: -22, filter: "blur(8px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        transition={{ duration: reduced ? 0.1 : 0.9, delay: reduced ? 0 : 3.1, ease }}
        style={{
          position: "relative",
          zIndex: 3,
          width: "min(76vw, 560px)",
          marginTop: "clamp(12px, 2vh, 24px)",
        }}
      >
        <RitualChecklist items={HOME_STEPS} completedCount={Math.min(completedCount, 3)} />
      </motion.div>

      <motion.div
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.1 : 0.75, delay: reduced ? 0 : 3.95, ease }}
        style={{
          position: "relative",
          zIndex: 3,
          width: "min(82vw, 760px)",
          marginTop: "auto",
          paddingBottom: "clamp(10px, 2vh, 24px)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            marginBottom: 18,
          }}
        >
          <span
            style={{
              flex: 1,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.55))",
            }}
          />
          <ShieldCheck size={34} style={{ color: "#d4af37", filter: "drop-shadow(0 0 10px rgba(212,175,55,0.35))" }} />
          <span
            style={{
              flex: 1,
              height: 1,
              background: "linear-gradient(90deg, rgba(212,175,55,0.55), transparent)",
            }}
          />
        </div>

        <p
          style={{
            margin: 0,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            letterSpacing: "0.48em",
            textTransform: "uppercase",
            fontSize: "clamp(1rem, 3vw, 1.45rem)",
            color: "#e6c878",
            textShadow: "0 0 18px rgba(212,175,55,0.28)",
          }}
        >
          {footerText}
        </p>
      </motion.div>
    </div>
  );
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
  const [reduced, setReduced] = useState(false);
  const dismissedRef = useRef(false);

  const isHomepageRitual = sessionKey === HOME_SESSION_KEY;
  const activeSteps = isHomepageRitual ? HOME_STEPS : steps;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);

    const onChange = () => setReduced(media.matches);
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (sessionKey && sessionStorage.getItem(sessionKey)) {
      setGone(true);
    }
  }, [sessionKey]);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;

    dismissedRef.current = true;

    if (sessionKey) {
      sessionStorage.setItem(sessionKey, "1");
    }

    setExiting(true);

    setTimeout(() => {
      setGone(true);
      onComplete?.();
    }, reduced ? 160 : 520);
  }, [sessionKey, onComplete, reduced]);

  useEffect(() => {
    if (gone) return;

    if (sessionKey && sessionStorage.getItem(sessionKey)) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setShowContent(true), 350));

    const completeLimit = isHomepageRitual ? 3 : activeSteps.length;

    for (let i = 0; i < completeLimit; i += 1) {
      timers.push(setTimeout(() => setCompletedCount((count) => count + 1), 1200 + i * 340));
    }

    const allStepsDone = isHomepageRitual ? 4850 : 1200 + activeSteps.length * 340 + 450;

    timers.push(setTimeout(() => setReadyForExit(true), allStepsDone));
    timers.push(setTimeout(() => dismiss(), allStepsDone + 1200));

    return () => timers.forEach(clearTimeout);
  }, [activeSteps.length, dismiss, gone, isHomepageRitual, sessionKey]);

  useEffect(() => {
    if (!readyForExit) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [readyForExit, dismiss]);

  if (gone) return null;

  if (isHomepageRitual) {
    return (
      <AnimatePresence>
        {!exiting && (
          <motion.div
            key="ritual-home-live-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.018, filter: "blur(7px)" }}
            transition={{ duration: reduced ? 0.12 : 0.55, ease }}
            onClick={() => readyForExit && dismiss()}
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9100,
              overflow: "hidden",
              background: "#050507",
              cursor: readyForExit ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HomepageLiveRitualScene
              reduced={reduced}
              completedCount={completedCount}
              sectionLabel="Structuring secure matter environment"
              statusText={statusText}
              footerText={footerText}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="ritual-entry-lock"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.035, filter: "blur(8px)" }}
          transition={{ duration: reduced ? 0.15 : 0.65, ease }}
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

          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse 58% 58% at 50% 37%, transparent 38%, rgba(5,5,7,0.72) 100%)",
              pointerEvents: "none",
            }}
          />

          <motion.div
            initial={reduced ? {} : { opacity: 0, scale: 0.92, y: 18, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: reduced ? 0.15 : 1.1, ease }}
            style={{ marginBottom: 18, position: "relative", zIndex: 1 }}
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
                color: "#d4af37",
                margin: 0,
              }}
            >
              The Milano Seal™
            </h1>

            <p
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.45)",
                margin: "10px 0 0",
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
            animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: reduced ? 0.1 : 0.5, delay: reduced ? 0 : 0.1, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}
          >
            <RitualProgressRail label={sectionLabel} reduced={reduced} />

            <div style={{ width: "min(100%, 340px)", padding: "0 16px" }}>
              <RitualChecklist items={activeSteps} completedCount={completedCount} />
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
