"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Globe, Lock, Eye, FileCheck, Send } from "lucide-react";

const LEFT_PILLARS = [
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
];

const RIGHT_PILLARS = [
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

function Pillar({
  icon: Icon,
  title,
  desc,
  align,
  delay,
  inView,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  align: "left" | "right";
  delay: number;
  inView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: align === "left" ? -18 : 18 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start gap-3 group ${align === "right" ? "flex-row-reverse text-right" : ""}`}
    >
      <div className="w-8 h-8 rounded-lg border border-[#C6A55A]/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-[#C6A55A]/40 transition-colors">
        <Icon className="w-3.5 h-3.5 text-[#C6A55A]/70 group-hover:text-[#C6A55A] transition-colors" />
      </div>
      <div className="min-w-0">
        <h3 className="text-white text-[13px] font-medium mb-1 leading-snug">{title}</h3>
        <p className="text-[#5A5A5A] text-[11px] leading-relaxed group-hover:text-[#6A6A6A] transition-colors">
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

export function MilanoTrustCore() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-full border-t border-[#1A1A1A] bg-[#060608] py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Ambient gold particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#C6A55A]"
            style={{
              width: i % 3 === 0 ? 2 : 1,
              height: i % 3 === 0 ? 2 : 1,
              opacity: 0.08 + (i % 4) * 0.04,
              left: `${5 + (i * 17 + i * i * 3) % 90}%`,
              top: `${8 + (i * 13 + i * 7) % 84}%`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Mobile: header + grid */}
        <div className="lg:hidden">
          <div className="flex flex-col items-center text-center mb-10">
            <div
              className="w-14 h-14 rounded-full border border-[#C6A55A]/30 flex items-center justify-center mb-5"
              style={{ background: "radial-gradient(circle, rgba(198,165,90,0.08) 0%, transparent 70%)" }}
            >
              <span className="font-serif text-[#C6A55A] text-2xl font-medium leading-none">M</span>
            </div>
            <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-[#C6A55A]/60 mb-2">
              Our Platform Principles
            </p>
            <h2 className="font-serif text-2xl text-white font-light mb-2">Milano Trust Core</h2>
            <p className="text-[#6A6A6A] text-xs max-w-xs leading-relaxed">
              Six pillars of deterministic execution for international document success.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...LEFT_PILLARS, ...RIGHT_PILLARS].map((p, i) => (
              <Pillar key={p.title} {...p} align="left" delay={0.07 * i} inView={inView} />
            ))}
          </div>
        </div>

        {/* Desktop: three-column radial split */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-0">
          {/* Left pillars */}
          <div className="flex flex-col gap-8 pr-10">
            {/* Header block on left */}
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mb-2"
            >
              <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-[#C6A55A]/60 mb-2">
                Our Platform Principles
              </p>
              <h2 className="font-serif text-3xl text-white font-light mb-2 leading-tight">
                Milano<br />Trust Core
              </h2>
              <p className="text-[#5A5A5A] text-xs leading-relaxed max-w-[220px]">
                Six pillars of deterministic execution for international document success.
              </p>
            </motion.div>

            {LEFT_PILLARS.map((p, i) => (
              <Pillar key={p.title} {...p} align="left" delay={0.1 + 0.08 * i} inView={inView} />
            ))}
          </div>

          {/* Center medallion */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex-shrink-0 w-[180px] flex items-center justify-center relative"
          >
            {/* Outer glow ring */}
            <div
              className="absolute w-[164px] h-[164px] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(198,165,90,0.07) 0%, transparent 68%)",
                filter: "blur(12px)",
              }}
            />
            {/* Outer decorative ring */}
            <div className="absolute w-[148px] h-[148px] rounded-full border border-[#C6A55A]/08" />
            {/* Mid ring */}
            <div className="absolute w-[126px] h-[126px] rounded-full border border-[#C6A55A]/12" />
            {/* Inner ring */}
            <div className="absolute w-[104px] h-[104px] rounded-full border border-[#C6A55A]/18" />
            {/* Core circle */}
            <div
              className="relative w-[88px] h-[88px] rounded-full border border-[#C6A55A]/35 flex items-center justify-center"
              style={{
                background: "radial-gradient(circle, rgba(198,165,90,0.10) 0%, rgba(6,6,8,0.95) 65%)",
                boxShadow: "0 0 32px rgba(198,165,90,0.10), inset 0 0 20px rgba(198,165,90,0.04)",
              }}
            >
              <span
                className="font-serif text-[#C6A55A] text-4xl font-medium leading-none select-none"
                style={{ textShadow: "0 0 24px rgba(198,165,90,0.4)" }}
              >
                M
              </span>
            </div>
          </motion.div>

          {/* Right pillars */}
          <div className="flex flex-col gap-8 pl-10 justify-end">
            {/* Spacer to align pillars with left side (skip header height) */}
            <div className="mb-2 invisible pointer-events-none select-none" aria-hidden>
              <p className="font-mono text-[9px] tracking-[0.35em] uppercase mb-2">placeholder</p>
              <h2 className="font-serif text-3xl font-light mb-2 leading-tight">
                Milano<br />Trust Core
              </h2>
              <p className="text-xs leading-relaxed max-w-[220px]">Six pillars placeholder text here ok.</p>
            </div>

            {RIGHT_PILLARS.map((p, i) => (
              <Pillar key={p.title} {...p} align="right" delay={0.1 + 0.08 * i} inView={inView} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
