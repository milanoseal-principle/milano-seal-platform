"use client";
import { useState } from 'react';

import { motion, AnimatePresence } from "framer-motion";

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";

const STAGES = [
  "Research",
  "Source Capture",
  "Evidence Upload",
  "Partner Confirmation",
  "Promotion Request",
  "Approval",
  "MULTI_SOURCE_CONFIRMED",
];

const CONFIDENCE_LEVELS = [
  "VERIFICATION_REQUIRED",
  "OBSERVED",
  "PARTNER_CONFIRMED",
  "MULTI_SOURCE_CONFIRMED",
];

const SOURCE_TYPES = [
  "Official Website",
  "Government Gazette",
  "Partner Confirmation",
  "Direct Contact",
  "Public Registry",
];

const AUDIT_EVENTS = [
  {
    id: 1,
    text: "Authority record created — VERIFICATION_REQUIRED",
    actor: "Operator",
    date: "2025-01-15 09:14:22",
  },
  {
    id: 2,
    text: "Confidence level set to OBSERVED",
    actor: "Operator",
    date: "2025-01-15 11:32:08",
  },
  {
    id: 3,
    text: "Source added: Official Website",
    actor: "Operator",
    date: "2025-01-15 11:33:45",
  },
  {
    id: 4,
    text: "Research stage marked complete",
    actor: "Operator",
    date: "2025-01-16 14:05:11",
  },
];

const SLA_CHIPS = [
  { label: "Research Due", days: 14 },
  { label: "Partner Confirmation Due", days: 30 },
  { label: "Promotion Review Due", days: 45 },
];

function confidenceForStage(stage: number): number {
  if (stage >= 6) return 3;
  if (stage >= 4) return 2;
  if (stage >= 1) return 1;
  return 0;
}

export default function AuthorityVerifyPage() {
  const [activeStage, setActiveStage] = useState(0);
  const [checkedSources, setCheckedSources] = useState<Set<string>>(new Set());
  const [showRing, setShowRing] = useState(false);

  const currentConfidence = confidenceForStage(activeStage);

  function advanceStage() {
    if (activeStage < STAGES.length - 1) {
      const next = activeStage + 1;
      const nextConf = confidenceForStage(next);
      if (nextConf > currentConfidence) {
        setShowRing(true);
        setTimeout(() => setShowRing(false), 500);
      }
      setActiveStage(next);
    }
  }

  function toggleSource(src: string) {
    setCheckedSources((prev) => {
      const next = new Set(prev);
      if (next.has(src)) next.delete(src);
      else next.add(src);
      return next;
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen p-6 space-y-8"
      style={{ background: "#0A0A0A" }}
    >
      {/* Header */}
      <div>
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-2"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Authority Operations Center / Verification Workbench
        </p>
        <h1 className="text-2xl font-semibold" style={{ color: GOLD }}>
          Authority Verification Workbench
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Confidence promotion workflow — operator-controlled
        </p>
      </div>

      {/* Workflow Pipeline */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-6"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Verification Pipeline
        </p>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {STAGES.map((stage, i) => {
            const isComplete = i < activeStage;
            const isActive = i === activeStage;
            return (
              <div key={stage} className="flex items-center">
                <div className="flex flex-col items-center gap-2 min-w-[80px]">
                  <motion.button
                    onClick={() => setActiveStage(i)}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold border-2"
                    style={{
                      borderColor: isComplete
                        ? EMERALD
                        : isActive
                        ? GOLD
                        : "rgba(255,255,255,0.15)",
                      background: isComplete
                        ? `${EMERALD}22`
                        : isActive
                        ? `${GOLD}22`
                        : "transparent",
                      color: isComplete
                        ? EMERALD
                        : isActive
                        ? GOLD
                        : "rgba(255,255,255,0.25)",
                    }}
                  >
                    {isComplete ? "✓" : i + 1}
                  </motion.button>
                  <span
                    className="text-[9px] font-mono text-center leading-tight"
                    style={{
                      color: isComplete
                        ? EMERALD
                        : isActive
                        ? GOLD
                        : "rgba(255,255,255,0.25)",
                      maxWidth: 72,
                    }}
                  >
                    {stage}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <div
                    className="relative h-[2px] w-8 mx-1 flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    {isComplete && (
                      <motion.div
                        className="absolute inset-0 rounded"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{ background: GOLD, transformOrigin: "left" }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={advanceStage}
            disabled={activeStage >= STAGES.length - 1}
            className="px-4 py-2 rounded text-sm font-mono transition-opacity disabled:opacity-30"
            style={{
              background: `${GOLD}22`,
              border: `1px solid ${GOLD}44`,
              color: GOLD,
            }}
          >
            Advance Stage →
          </button>
          <button
            onClick={() => setActiveStage(0)}
            className="px-4 py-2 rounded text-sm font-mono"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Confidence Promotion Visualizer */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-4"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Confidence Level
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          {CONFIDENCE_LEVELS.map((level, i) => {
            const isActive = i === currentConfidence;
            const isPast = i < currentConfidence;
            return (
              <div key={level} className="flex items-center gap-3">
                <div className="relative">
                  <AnimatePresence>
                    {isActive && showRing && (
                      <motion.div
                        key="ring"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1.4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 rounded border-2 pointer-events-none"
                        style={{ borderColor: GOLD }}
                      />
                    )}
                  </AnimatePresence>
                  <motion.div
                    animate={{
                      borderColor: isActive
                        ? GOLD
                        : isPast
                        ? EMERALD
                        : "rgba(255,255,255,0.1)",
                      background: isActive
                        ? `${GOLD}18`
                        : isPast
                        ? `${EMERALD}18`
                        : "transparent",
                      color: isActive
                        ? GOLD
                        : isPast
                        ? EMERALD
                        : "rgba(255,255,255,0.2)",
                    }}
                    transition={{ duration: 0.4 }}
                    className="px-3 py-1.5 rounded border font-mono text-[10px] tracking-wider"
                  >
                    {level}
                  </motion.div>
                </div>
                {i < CONFIDENCE_LEVELS.length - 1 && (
                  <span style={{ color: "rgba(255,255,255,0.15)" }}>→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Source Vault Panel */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <p
            className="font-mono text-[9px] tracking-[0.32em] uppercase"
            style={{ color: "rgba(198,165,90,0.5)" }}
          >
            Source Vault
          </p>
          <span
            className="font-mono text-xs px-2 py-1 rounded"
            style={{
              background: `${GOLD}18`,
              border: `1px solid ${GOLD}33`,
              color: GOLD,
            }}
          >
            Evidence sources captured: {checkedSources.size}
          </span>
        </div>

        <div
          className="rounded border-2 border-dashed p-4 mb-4 text-center text-xs font-mono"
          style={{
            borderColor: "rgba(212,175,55,0.15)",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          Drop evidence files here — stored in secure vault
        </div>

        <div className="space-y-2">
          {SOURCE_TYPES.map((src) => {
            const checked = checkedSources.has(src);
            return (
              <motion.div
                key={src}
                layout
                className="flex items-center gap-3 p-3 rounded cursor-pointer"
                style={{
                  background: checked ? `${GOLD}0a` : "transparent",
                  border: `1px solid ${
                    checked ? GOLD + "30" : "rgba(255,255,255,0.05)"
                  }`,
                }}
                onClick={() => toggleSource(src)}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: checked ? GOLD : "rgba(255,255,255,0.2)",
                    background: checked ? `${GOLD}33` : "transparent",
                  }}
                >
                  {checked && (
                    <span style={{ color: GOLD, fontSize: 10 }}>✓</span>
                  )}
                </div>
                <AnimatePresence>
                  {checked && (
                    <motion.div
                      initial={{ x: -8, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -8, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: GOLD }}
                    />
                  )}
                </AnimatePresence>
                <span
                  className="text-sm"
                  style={{
                    color: checked
                      ? "rgba(255,255,255,0.85)"
                      : "rgba(255,255,255,0.55)",
                  }}
                >
                  {src}
                </span>
              </motion.div>
            );
          })}
        </div>
        <p
          className="text-[10px] mt-4 font-mono"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Source entries are operator-logged. Documents stored in secure vault.
        </p>
      </div>

      {/* SLA Tracker */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-4"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Verification SLA Tracker
        </p>
        <div className="flex gap-3 flex-wrap">
          {SLA_CHIPS.map((chip) => (
            <div
              key={chip.label}
              className="px-4 py-2 rounded"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <p
                className="text-[9px] font-mono uppercase tracking-widest"
                style={{ color: "rgba(245,158,11,0.6)" }}
              >
                {chip.label}
              </p>
              <p
                className="text-sm font-semibold mt-0.5"
                style={{ color: "#f59e0b" }}
              >
                {chip.days} days
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Trail */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-4"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Audit Trail
        </p>
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {AUDIT_EVENTS.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 py-1.5 border-b"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}
            >
              <span
                className="font-mono text-[10px] flex-shrink-0 pt-0.5"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                {event.date}
              </span>
              <span
                className="font-mono text-[11px]"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {event.text} — {event.actor}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Operator Note */}
      <div
        className="rounded-lg p-4"
        style={{
          background: "rgba(198,165,90,0.04)",
          border: "1px solid rgba(198,165,90,0.12)",
        }}
      >
        <p className="text-xs font-mono" style={{ color: "rgba(198,165,90,0.7)" }}>
          All confidence promotions require operator approval. No automated
          promotions. Evidence is stored in the source vault and never exposed
          to clients or alliance partners.
        </p>
      </div>
    </motion.div>
  );
}
