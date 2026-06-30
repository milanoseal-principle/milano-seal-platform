"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export function BootSequence({ progress }: { progress: number }) {
  const lines = [
    { t: 12, text: "AUTHENTICATING OPERATOR CREDENTIALS" },
    { t: 25, text: "SYNCHRONIZING EXECUTION INTELLIGENCE" },
    { t: 40, text: "VALIDATING HAGUE CONVENTION PROTOCOLS" },
    { t: 55, text: "CALIBRATING APOSTILLE COORDINATION ENGINE" },
    { t: 70, text: "LOADING RECEIVING-AUTHORITY DIRECTORIES" },
    { t: 85, text: "ENGAGING TRUST ENGINE — CHAIN OF CUSTODY" },
    { t: 96, text: "COMMAND CENTER READY" },
  ];

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#08080b]"
    >
      <div className="text-center max-w-2xl px-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-10 relative inline-block"
        >
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/20 rotate-slow" />
            <div className="absolute inset-3 rounded-full border border-[#D4AF37]/30 rotate-reverse" style={{ borderStyle: "dashed" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-16 h-16 text-[#D4AF37]" strokeWidth={1.5} style={{ filter: "drop-shadow(0 0 24px rgba(212,175,55,.6))" }} />
            </div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-serif text-6xl font-semibold gold-text mb-2"
        >
          The Milano Seal<sup className="text-2xl ml-1">™</sup>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[10px] text-[#D4AF37]/60 tracking-[0.5em] uppercase font-light mb-12"
        >
          International Document Execution &amp; Apostille Coordination
        </motion.p>

        <div className="w-[420px] max-w-full h-[1px] bg-gray-900/80 mx-auto mb-3 overflow-hidden border-y border-[#D4AF37]/10">
          <div
            className="h-full bg-gradient-to-r from-[#B8960A] via-[#F4E5B8] to-[#B8960A] transition-all duration-150"
            style={{ width: `${progress}%`, boxShadow: "0 0 12px rgba(212,175,55,.8)" }}
          />
        </div>

        <div className="text-[10px] text-[#D4AF37] font-mono tracking-[0.3em] mb-8">
          ESTABLISHING COMMAND INFRASTRUCTURE — {Math.floor(progress)}%
        </div>

        <div className="space-y-1.5 text-left max-w-md mx-auto">
          {lines.map((l, i) => (
            <div
              key={i}
              className={`text-[10px] font-mono tracking-wider transition-all duration-300 ${progress >= l.t ? "text-[#D4AF37]/85" : "text-gray-700"}`}
            >
              {progress >= l.t ? <span className="text-emerald-400 mr-2">✓</span> : <span className="text-gray-700 mr-2">○</span>}
              <span>// {l.text}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
