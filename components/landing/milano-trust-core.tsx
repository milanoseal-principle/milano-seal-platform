"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Globe, Lock, Eye, FileCheck, Send } from "lucide-react";

const PILLARS = [
  {
    icon: Shield,
    title: "Secure Intake",
    desc: "Verified identity & document stage. Every matter begins with structured scope confirmation.",
  },
  {
    icon: Globe,
    title: "Global Document Intelligence",
    desc: "Destination rules, forms & authority requirements reviewed for your specific corridor.",
  },
  {
    icon: Lock,
    title: "Payment-Gated Scheduling",
    desc: "No scheduling until scope & payment are confirmed. Your resources are reserved for your matter only.",
  },
  {
    icon: Eye,
    title: "Chain-of-Custody Visibility",
    desc: "Track every step from intake to release. Full custody record maintained throughout.",
  },
  {
    icon: FileCheck,
    title: "Apostille Coordination",
    desc: "Expert coordination for Hague Convention certification and consular legalization workflows.",
  },
  {
    icon: Send,
    title: "International Release",
    desc: "Secure release through approved courier methods and international delivery partners.",
  },
];

export function MilanoTrustCore() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-full border-t border-[#1A1A1A] bg-[#060608] py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          {/* Gold M emblem */}
          <div className="w-14 h-14 rounded-full border border-[#C6A55A]/30 flex items-center justify-center mb-6"
            style={{ background: "radial-gradient(circle, rgba(198,165,90,0.08) 0%, transparent 70%)" }}>
            <span className="font-serif text-[#C6A55A] text-2xl font-medium leading-none">M</span>
          </div>
          <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-[#C6A55A]/60 mb-3">
            Our Platform Principles
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-light mb-3">
            Milano Trust Core
          </h2>
          <p className="text-[#6A6A6A] text-sm max-w-md leading-relaxed">
            Six pillars of deterministic execution for international document success.
          </p>
        </div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-xl border border-[#1A1A1A] bg-[#080808] p-5 hover:border-[#C6A55A]/20 transition-colors duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg border border-[#C6A55A]/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-[#C6A55A]/40 transition-colors">
                    <Icon className="w-3.5 h-3.5 text-[#C6A55A]/70 group-hover:text-[#C6A55A] transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-medium mb-1.5 leading-snug">
                      {p.title}
                    </h3>
                    <p className="text-[#5A5A5A] text-xs leading-relaxed group-hover:text-[#6A6A6A] transition-colors">
                      {p.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
