"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";
import { WorldMapCanvas } from "@/components/rituals/WorldMapCanvas";

const CHECKLIST = [
  "Verifying operational access",
  "Reviewing active international matters",
  "Syncing apostille coordination queue",
  "Verifying courier release controls",
  "Loading execution infrastructure",
  "Workspace ready",
];

export function MilanoSealEntryRitual({ onComplete }: { onComplete: () => void }) {
  const [step, setStep]           = useState(0);
  const [exiting, setExiting]     = useState(false);
  const [showReady, setShowReady] = useState(false);
  const reduced = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  useEffect(() => {
    const ts: ReturnType<typeof setTimeout>[] = [];
    CHECKLIST.forEach((_, i) => {
      ts.push(setTimeout(() => setStep(i + 1), 420 + i * 390));
    });
    ts.push(setTimeout(() => setShowReady(true), 420 + CHECKLIST.length * 390));
    return () => ts.forEach(clearTimeout);
  }, []);

  const dismiss = useCallback(() => {
    if (!showReady) return;
    setExiting(true);
    setTimeout(onComplete, reduced ? 200 : 800);
  }, [showReady, onComplete, reduced]);

  useEffect(() => {
    if (!showReady) return;
    const t = setTimeout(dismiss, 900);
    return () => clearTimeout(t);
  }, [showReady, dismiss]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [dismiss]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="dash-ritual"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.06, filter: "blur(8px)" }}
          transition={{ duration: reduced ? 0.15 : 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9100] flex flex-col items-center justify-center overflow-hidden cursor-pointer"
          style={{ background: "#060503", paddingTop: "var(--sa-top)", paddingBottom: "var(--sa-bottom)" }}
          onClick={dismiss}
          aria-hidden="true"
        >
          {/* World map canvas */}
          <WorldMapCanvas />

          {/* Radial atmosphere */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 60% 55% at 50% 30%, rgba(212,175,55,0.07) 0%, transparent 70%)",
          }} />

          {/* Seal medallion */}
          <div className="relative flex items-center justify-center mb-7" style={{ width: 220, height: 220 }}>
            {/* Outer orbit rings */}
            <motion.div className="absolute rounded-full" style={{
              inset: 0,
              border: "1.5px dashed rgba(212,175,55,0.38)",
            }} animate={reduced ? {} : { rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} />
            <motion.div className="absolute rounded-full" style={{
              inset: 18,
              border: "1.5px dashed rgba(212,175,55,0.45)",
            }} animate={reduced ? {} : { rotate: -360 }} transition={{ duration: 55, repeat: Infinity, ease: "linear" }} />
            <motion.div className="absolute rounded-full" style={{
              inset: 36,
              border: "2px solid rgba(212,175,55,0.65)",
              boxShadow: "0 0 18px rgba(212,175,55,0.25), inset 0 0 18px rgba(212,175,55,0.08)",
            }} animate={reduced ? {} : { rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />

            {/* Node spheres on primary ring (r=74 from center = inset:36 ring) */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
              const r = 74;
              const x = 110 + r * Math.cos((deg * Math.PI) / 180);
              const y = 110 + r * Math.sin((deg * Math.PI) / 180);
              return (
                <div key={deg} className="absolute rounded-full" style={{
                  width: 18, height: 18,
                  left: x - 9, top: y - 9,
                  background: "radial-gradient(circle at 35% 30%, #f4e5b8 0%, #d4af37 45%, transparent 75%)",
                  boxShadow: "0 0 10px rgba(212,175,55,0.85), 0 0 22px rgba(212,175,55,0.45)",
                }} />
              );
            })}

            {/* Center glow */}
            <div className="absolute rounded-full" style={{
              inset: 36,
              background: "radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)",
              filter: "blur(14px)",
            }} />

            {/* Core disc */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center rounded-full overflow-hidden"
              style={{
                width: 120, height: 120,
                background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, #050503 70%)",
                border: "1px solid rgba(212,175,55,0.45)",
                boxShadow: "0 0 48px rgba(212,175,55,0.18), 0 0 100px rgba(212,175,55,0.08)",
              }}
            >
              <Image
                src="/milano-seal-gold-transparent-512.png"
                alt="The Milano Seal"
                width={88}
                height={88}
                className="object-contain"
                priority
              />
            </motion.div>

            {/* Unlock ping when ready */}
            {showReady && !reduced && (
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{ inset: 0, border: "1px solid rgba(212,175,55,0.35)" }}
                animate={{ scale: [1, 1.18], opacity: [0.6, 0] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "easeOut" }}
              />
            )}
          </div>

          {/* Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-1"
          >
            <p className="font-mono text-[9px] tracking-[0.28em] uppercase mb-2" style={{ color: "rgba(212,175,55,0.45)" }}>
              Operator Workspace
            </p>
            <h1 className="font-serif font-normal tracking-[0.12em] uppercase" style={{
              fontSize: "clamp(1.3rem, 3.5vw, 1.75rem)",
              background: "linear-gradient(105deg, #c6a55a 38%, #f4e5b8 50%, #c6a55a 62%)",
              backgroundSize: "240% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 24px rgba(212,175,55,0.3))",
            }}>
              The Milano Seal™
            </h1>
            <p className="font-mono text-[9px] tracking-[0.25em] uppercase mt-1.5" style={{ color: "rgba(212,175,55,0.5)" }}>
              Sealing Trust With Every Signature™
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center gap-2 mb-5" style={{ width: 280 }}
          >
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.35), transparent)" }} />
            <span style={{ color: "rgba(212,175,55,0.6)", fontSize: 7 }}>◆</span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.35), transparent)" }} />
          </motion.div>

          {/* Checklist */}
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            style={{ width: "min(100%, 340px)", padding: "0 16px" }}
          >
            <p className="font-mono text-center mb-3" style={{ fontSize: 8, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(176,176,176,0.38)" }}>
              Structuring Execution Environment
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {CHECKLIST.map((item, i) => {
                const done = step > i;
                return (
                  <li key={item} style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    fontSize: 12,
                    fontFamily: "system-ui, sans-serif",
                    color: done ? "rgba(212,175,55,0.85)" : "rgba(176,176,176,0.3)",
                    transition: "color 0.4s ease",
                  }}>
                    {/* Connector line */}
                    {i > 0 && (
                      <div style={{
                        position: "absolute",
                        left: 7.5,
                        top: -8,
                        width: 1,
                        height: 8,
                        background: done ? "rgba(212,175,55,0.4)" : "rgba(176,176,176,0.12)",
                        transition: "background 0.4s ease",
                      }} />
                    )}
                    {done
                      ? <CheckCircle2 size={16} style={{ flexShrink: 0, color: "#d4af37" }} />
                      : <Circle size={16} style={{ flexShrink: 0, color: "rgba(176,176,176,0.2)" }} />
                    }
                    <span>{item}</span>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: showReady ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mt-6"
            style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(212,175,55,0.7)" }}
          >
            <ShieldCheck size={14} style={{ color: "#d4af37" }} />
            <span>Workspace Ready</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
