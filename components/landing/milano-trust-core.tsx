"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Shield, Globe, Lock, Eye, FileCheck, Send } from "lucide-react";

const LEFT_PILLARS = [
  {
    icon: Shield,
    title: "Secure Intake",
    desc: "Verified identity & document stage. Every matter begins with structured scope confirmation.",
    href: "/intake",
  },
  {
    icon: Globe,
    title: "Global Document Intelligence",
    desc: "Destination rules, forms & authority requirements reviewed for your specific corridor.",
    href: "/countries",
  },
  {
    icon: Lock,
    title: "Payment-Gated Scheduling",
    desc: "No scheduling until scope & payment are confirmed. Your resources are reserved for your matter only.",
    href: "/process",
  },
];

const RIGHT_PILLARS = [
  {
    icon: Eye,
    title: "Chain-of-Custody Visibility",
    desc: "Track every step from intake to release. Full custody record maintained throughout.",
    href: "/process",
  },
  {
    icon: FileCheck,
    title: "Apostille Coordination",
    desc: "Expert coordination for Hague Convention certification and consular legalization workflows.",
    href: "/services",
  },
  {
    icon: Send,
    title: "International Release",
    desc: "Secure release through approved courier methods and international delivery partners.",
    href: "/services",
  },
];

function Pillar({
  icon: Icon,
  title,
  desc,
  align,
  delay,
  inView,
  href,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  align: "left" | "right";
  delay: number;
  inView: boolean;
  href: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: align === "left" ? -18 : 18 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={href}
        className={`flex items-start gap-3 group ${align === "right" ? "flex-row-reverse text-right" : ""}`}
      >
        <div className="w-8 h-8 rounded-lg border border-[#C6A55A]/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-[#C6A55A]/40 transition-colors">
          <Icon className="w-3.5 h-3.5 text-[#C6A55A]/70 group-hover:text-[#C6A55A] transition-colors" />
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-[#E8DCC0] text-[15px] font-medium mb-1 leading-snug group-hover:text-[#C6A55A] transition-colors">{title}</h3>
          <p className="text-[#8A8A8A] text-[13px] leading-relaxed group-hover:text-[#9A9A9A] transition-colors">
            {desc}
          </p>
        </div>
      </Link>
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
      className="w-full border-t border-[#1A1A1A] bg-[#060608] py-10 px-4 sm:px-6 lg:px-8 overflow-hidden"
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

      <div className="relative max-w-5xl mx-auto">
        {/* Mobile: header + grid */}
        <div className="lg:hidden">
          <div className="flex flex-col items-center text-center mb-10">
            <div
              className="w-14 h-14 rounded-full border border-[#C6A55A]/30 flex items-center justify-center mb-5"
              style={{ background: "radial-gradient(circle, rgba(198,165,90,0.08) 0%, transparent 70%)" }}
            >
              <span className="font-serif text-[#C6A55A] text-2xl font-medium leading-none">M</span>
            </div>
            <p className="font-mono text-[9px] tracking-[0.08em] uppercase text-[#C6A55A]/70 mb-2">
              Our Platform Principles
            </p>
            <h2 className="font-serif text-2xl text-white font-normal mb-2">Milano Trust Core</h2>
            <p className="text-white/55 text-sm max-w-xs leading-relaxed">
              International document matters rarely fail because of complexity alone. They fail because a signature was missed, a certificate was incomplete, an apostille route was misunderstood, a translation was overlooked, or a document packet moved without proper review. The Milano Seal brings structure to that process through secure intake, document review, notarization coordination, apostille/authentication routing, courier custody, and final release support.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...LEFT_PILLARS, ...RIGHT_PILLARS].map((p, i) => (
              <Pillar key={p.title} {...p} align="left" delay={0.07 * i} inView={inView} />
            ))}
          </div>
        </div>

        {/* Desktop: header above, then three-column radial split */}
        <div className="hidden lg:block">
          {/* Header centered above */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-10"
          >
            <p className="font-mono text-[9px] tracking-[0.08em] uppercase text-[#C6A55A]/70 mb-2">
              Our Platform Principles
            </p>
            <h2 className="font-serif text-3xl text-white font-normal mb-2 leading-tight">
              Milano Trust Core
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-2xl mx-auto">
              International document matters rarely fail because of complexity alone. They fail because a signature was missed, a certificate was incomplete, an apostille route was misunderstood, a translation was overlooked, or a document packet moved without proper review. The Milano Seal brings structure to that process through secure intake, document review, notarization coordination, apostille/authentication routing, courier custody, and final release support.
            </p>
          </motion.div>

          {/* Three-column: pillars | medallion | pillars — all vertically centered */}
          <div className="grid grid-cols-[1fr_280px_1fr] items-center gap-0 relative" style={{ minHeight: 280 }}>
            {/* Left pillars */}
            <div className="flex flex-col gap-7 pr-8">
              {LEFT_PILLARS.map((p, i) => (
                <Pillar key={p.title} {...p} align="left" delay={0.1 + 0.08 * i} inView={inView} />
              ))}
            </div>

            {/* Center medallion */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center relative"
              style={{ height: 280 }}
            >
              {/* Glow */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 260, height: 260,
                  background: "radial-gradient(circle, rgba(198,165,90,0.09) 0%, transparent 70%)",
                  filter: "blur(16px)",
                }}
              />
              {/* Connector lines — SVG fan from center orb to each pillar row */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width="280"
                height="280"
                viewBox="0 0 280 280"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ overflow: "visible" }}
              >
                {/* Left connectors: from orb edge (x=75, y=140) to left column edge (x=0) at pillar rows */}
                {[47, 140, 233].map((py, i) => (
                  <line
                    key={`l${i}`}
                    x1={0} y1={py}
                    x2={75} y2={140}
                    stroke="url(#connLeft)"
                    strokeWidth="1"
                    strokeOpacity="0.5"
                  />
                ))}
                {/* Right connectors: from orb edge (x=205, y=140) to right column edge (x=280) at pillar rows */}
                {[47, 140, 233].map((py, i) => (
                  <line
                    key={`r${i}`}
                    x1={205} y1={140}
                    x2={280} y2={py}
                    stroke="url(#connRight)"
                    strokeWidth="1"
                    strokeOpacity="0.5"
                  />
                ))}
                {/* Small node dots at pillar connection points */}
                {[47, 140, 233].map((py, i) => (
                  <circle key={`ld${i}`} cx={0} cy={py} r="2.5" fill="#C6A55A" fillOpacity="0.35" />
                ))}
                {[47, 140, 233].map((py, i) => (
                  <circle key={`rd${i}`} cx={280} cy={py} r="2.5" fill="#C6A55A" fillOpacity="0.35" />
                ))}
                <defs>
                  <linearGradient id="connLeft" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
                    <stop offset="0%" stopColor="#C6A55A" stopOpacity="0" />
                    <stop offset="100%" stopColor="#C6A55A" stopOpacity="0.35" />
                  </linearGradient>
                  <linearGradient id="connRight" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
                    <stop offset="0%" stopColor="#C6A55A" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#C6A55A" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Rings */}
              <div className="absolute w-[240px] h-[240px] rounded-full" style={{ border: "1px solid rgba(198,165,90,0.08)" }} />
              <div className="absolute w-[200px] h-[200px] rounded-full" style={{ border: "1px solid rgba(198,165,90,0.14)" }} />
              <div className="absolute w-[160px] h-[160px] rounded-full" style={{ border: "1px solid rgba(198,165,90,0.22)" }} />
              {/* Core */}
              <div
                className="relative w-[130px] h-[130px] rounded-full border border-[#C6A55A]/40 flex items-center justify-center"
                style={{
                  background: "radial-gradient(circle, rgba(198,165,90,0.13) 0%, rgba(6,6,8,0.97) 70%)",
                  boxShadow: "0 0 48px rgba(198,165,90,0.12), inset 0 0 28px rgba(198,165,90,0.05)",
                }}
              >
                <span
                  className="font-serif text-[#C6A55A] text-5xl font-medium leading-none select-none"
                  style={{ textShadow: "0 0 32px rgba(198,165,90,0.5)" }}
                >
                  M
                </span>
              </div>
            </motion.div>

            {/* Right pillars */}
            <div className="flex flex-col gap-7 pl-8">
              {RIGHT_PILLARS.map((p, i) => (
                <Pillar key={p.title} {...p} align="right" delay={0.1 + 0.08 * i} inView={inView} />
              ))}
            </div>

          </div>
        </div>
      </div>
    </motion.section>
  );
}
