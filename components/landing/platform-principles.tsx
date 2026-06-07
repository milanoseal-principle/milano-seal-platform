"use client";

import { motion } from "framer-motion";

const PRINCIPLES = [
  { num: "01", label: "Secure Intake" },
  { num: "02", label: "Global Document Intelligence" },
  { num: "03", label: "Payment-Gated Scheduling" },
  { num: "04", label: "Chain-of-Custody Visibility" },
  { num: "05", label: "Apostille Coordination" },
  { num: "06", label: "International Release" },
];

export function PlatformPrinciples() {
  return (
    <section className="relative py-20 md:py-28 bg-[#080808] border-t border-[#1A1A1A] overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(198,165,90,0.04) 0%, transparent 65%)" }}
      />
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#6A5520] mb-4">
            Architecture
          </p>
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-3">
            Platform Principles
          </h2>
          <p className="text-white/55 text-sm font-normal">
            Six anchors of deterministic execution.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {PRINCIPLES.map(({ num, label }, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="flex items-start gap-4 bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-5 hover:border-[#C6A55A]/20 transition-colors duration-300"
            >
              <span className="font-mono text-[#C6A55A]/40 text-xl font-medium leading-none flex-shrink-0 mt-0.5">
                {num}
              </span>
              <span className="text-[#B0B0B0] text-sm font-medium leading-snug">
                {label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
