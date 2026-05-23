"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  onComplete: () => void;
}

export function PortalEntryRitual({ onComplete }: Props) {
  const [step, setStep] = useState(0);

  const items = [
    { label: "Verifying matter access", ms: 350 },
    { label: "Loading document status", ms: 350 },
    { label: "Reviewing payment and scheduling status", ms: 350 },
    { label: "Preparing document vault", ms: 300 },
    { label: "Ready", ms: 200 },
  ];

  useEffect(() => {
    let i = 0;
    function next() {
      if (i < items.length) {
        setTimeout(() => {
          setStep((s) => s + 1);
          i++;
          next();
        }, items[i].ms);
      } else {
        setTimeout(onComplete, 350);
      }
    }
    next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060608]"
      style={{
        background:
          "radial-gradient(100% 100% at 50% 0%, rgba(212,175,55,0.04) 0%, #060608 70%)",
      }}
    >
      <div className="flex flex-col items-center max-w-xs w-full px-6 text-center select-none">
        {/* Logomark — subtle gold glow */}
        <div className="relative mb-7 flex items-center justify-center w-16 h-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border border-[#D4AF37]/10 rounded-full border-dashed"
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)",
            }}
          />
          <span className="relative z-10 text-[#D4AF37] text-xl font-serif">
            ⚜️
          </span>
        </div>

        <h1 className="font-serif text-xl font-medium text-white tracking-wide mb-1">
          Secure Matter Access
        </h1>
        <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 mb-6">
          Preparing your private document workspace
        </p>

        {/* Checklist */}
        <div className="w-full bg-[#0c0c12] border border-gray-900 rounded-sm p-4 text-left font-mono space-y-2">
          {items.map((item, idx) => {
            const isDone = step > idx;
            const isCurrent = step === idx;
            return (
              <div
                key={idx}
                className={`text-xs flex items-center gap-2.5 transition-all duration-300 ${
                  isDone
                    ? "text-gray-400"
                    : isCurrent
                      ? "text-[#D4AF37]"
                      : "text-gray-700"
                }`}
              >
                <span className="w-3 text-[10px] flex-shrink-0 text-center font-bold">
                  {isDone ? (
                    <span className="text-emerald-500">✓</span>
                  ) : isCurrent ? (
                    <span className="animate-ping inline-block text-[8px]">
                      ○
                    </span>
                  ) : (
                    <span>·</span>
                  )}
                </span>
                <span
                  className={`font-sans text-[11px] ${isCurrent ? "font-medium text-white" : ""}`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
