"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CHECKLIST = [
  "Verifying secure workspace",
  "Preparing Global Document Intelligence",
  "Reviewing execution status",
  "Checking payment-gated scheduling",
  "Preparing chain-of-custody view",
  "Ready for review",
];

export function MilanoSealEntryRitual({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < CHECKLIST.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 350);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => onComplete(), 400);
      return () => clearTimeout(t);
    }
  }, [step, onComplete]);

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-[#060608] flex flex-col items-center justify-center gap-6"
      style={{ paddingTop: "var(--sa-top)", paddingBottom: "var(--sa-bottom)" }}
    >
      {/* Gold halo ring */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="border border-[#D4AF37]/20 rounded-full border-dashed absolute inset-0"
        />
        <div className="bg-gradient-to-b from-[#D4AF37]/5 to-transparent blur-sm absolute inset-0 rounded-full" />
        <span className="text-2xl text-[#D4AF37] relative z-10">⚜️</span>
      </div>

      {/* Title */}
      <div className="text-center space-y-1">
        <h1 className="font-serif text-2xl text-white">The Milano Seal™</h1>
        <p className="text-[9px] uppercase tracking-[0.25em] text-gray-500">
          Preparing secure operator workspace
        </p>
      </div>

      {/* Checklist card */}
      <div className="bg-[#0c0c12] border border-gray-900 rounded-sm p-4 font-mono w-72">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-gray-400">Pre-Flight Review</span>
          <span className="text-[8px] uppercase tracking-wider text-[#D4AF37]">
            PREPARING WORKSPACE
          </span>
        </div>
        <div className="space-y-2">
          {CHECKLIST.map((item, idx) => {
            const isDone = step > idx;
            const isCurrent = step === idx;
            return (
              <div key={idx} className="flex items-center gap-2 text-[11px]">
                {isDone ? (
                  <span className="text-emerald-500 w-3 flex-shrink-0">✓</span>
                ) : isCurrent ? (
                  <span className="relative w-3 flex-shrink-0 flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#D4AF37] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#D4AF37]" />
                  </span>
                ) : (
                  <span className="text-gray-700 w-3 flex-shrink-0">·</span>
                )}
                <span
                  className={
                    isDone
                      ? "text-gray-400"
                      : isCurrent
                        ? "text-[#D4AF37] font-medium"
                        : "text-gray-700"
                  }
                >
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
