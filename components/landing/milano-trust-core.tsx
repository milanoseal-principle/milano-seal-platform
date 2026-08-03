"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Image from "next/image";
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


const MOBILE_TRUST_PRINCIPLES = [
  {
    icon: Shield,
    title: "Secure Intake",
    desc: "Every matter begins with structured scope and document review.",
  },
  {
    icon: Globe,
    title: "Global Document Intelligence",
    desc: "Destination and receiving-authority requirements are reviewed for the specific corridor.",
  },
  {
    icon: Lock,
    title: "Payment-Gated Scheduling",
    desc: "Scheduling remains locked until scope and payment are confirmed.",
  },
  {
    icon: Eye,
    title: "Chain-of-Custody Visibility",
    desc: "Key document and delivery milestones remain visible from intake through release.",
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

// Orbiting custody nodes that ride the rings around the Trust Core medallion.
// { angle°, radius px from center, dot size px, opacity }.
const ORBIT_NODES = [
  { angle: 18, radius: 116, size: 3, opacity: 0.7 },
  { angle: 96, radius: 116, size: 2, opacity: 0.45 },
  { angle: 162, radius: 116, size: 2.5, opacity: 0.6 },
  { angle: 240, radius: 92, size: 2.5, opacity: 0.55 },
  { angle: 300, radius: 92, size: 2, opacity: 0.4 },
  { angle: 348, radius: 92, size: 3, opacity: 0.65 },
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
        <div className="w-8 h-8 rounded-lg border border-[var(--ms-gold)]/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-[var(--ms-gold)]/40 transition-colors">
          <Icon className="w-3.5 h-3.5 text-[var(--ms-gold)]/70 group-hover:text-[var(--ms-gold)] transition-colors" />
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-[#E8DCC0] text-[15px] font-medium mb-1 leading-snug group-hover:text-[var(--ms-gold)] transition-colors">{title}</h3>
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
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full overflow-hidden border-t border-[#1A1A1A] bg-[#060608] px-5 py-14 sm:px-6 lg:px-8 lg:py-10"
    >
      {/* Ambient gold particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[var(--ms-gold)]"
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
        {/* Mobile: cinematic Trust Core summary */}
        <div className="lg:hidden">
          <div className="flex flex-col items-center text-center">
            <motion.div
              className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[var(--ms-gold)]/35"
              style={{ background: "radial-gradient(circle, rgba(198,165,90,0.14) 0%, rgba(6,6,8,0.96) 72%)" }}
              animate={reduce ? undefined : { boxShadow: ["0 0 18px rgba(198,165,90,0.12)", "0 0 34px rgba(198,165,90,0.26)", "0 0 18px rgba(198,165,90,0.12)"] }}
              transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-[-10px] rounded-full border border-[var(--ms-gold)]/15"
                animate={reduce ? undefined : { rotate: 360 }}
                transition={reduce ? undefined : { duration: 28, repeat: Infinity, ease: "linear" }}
              />
              <motion.span
                aria-hidden="true"
                className="absolute inset-[-18px] rounded-full border border-[var(--ms-gold)]/10"
                animate={reduce ? undefined : { rotate: -360 }}
                transition={reduce ? undefined : { duration: 44, repeat: Infinity, ease: "linear" }}
              />
              {!reduce && (
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-[-14px] rounded-full"
                  style={{
                    background: "conic-gradient(from 0deg, transparent 0deg, rgba(198,165,90,0.18) 32deg, transparent 74deg)",
                    maskImage: "radial-gradient(circle, transparent 52%, black 58%, black 68%, transparent 74%)",
                    WebkitMaskImage: "radial-gradient(circle, transparent 52%, black 58%, black 68%, transparent 74%)",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                />
              )}
              <Image src="/milano-seal-core-brain-feather.png" alt="The Milano Seal Trust Core medallion" width={64} height={64} className="relative h-16 w-16 rounded-full object-contain drop-shadow-[0_0_22px_rgba(198,165,90,0.32)]" />
            </motion.div>
            <p className="mb-2 font-mono text-[13px] uppercase tracking-[0.16em] text-[var(--ms-gold)]/75">
              Our Platform Principles
            </p>
            <h2 className="font-serif text-3xl leading-tight text-white">Milano Trust Core</h2>
            <p className="mt-4 max-w-[34rem] text-base leading-7 text-white/62">
              International document matters require more than a signature. The Milano Seal coordinates intake, execution review, apostille or authentication routing, custody, and release through one controlled matter workflow.
            </p>
          </div>

          <div className="mt-8 grid gap-4">
            {MOBILE_TRUST_PRINCIPLES.map((principle, i) => {
              const Icon = principle.icon;
              return (
                <motion.div
                  key={principle.title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--ms-gold)]/15 bg-white/[0.025] p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--ms-gold)]/20 bg-[var(--ms-gold)]/[0.055]">
                    <Icon className="h-4 w-4 text-[var(--ms-gold)]/80" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="text-[1.25rem] font-semibold leading-tight text-[#E8DCC0]">{principle.title}</h3>
                    <p className="mt-1 text-base leading-7 text-white/56">{principle.desc}</p>
                  </div>
                </motion.div>
              );
            })}
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
            <p className="font-mono text-[9px] tracking-[0.08em] uppercase text-[var(--ms-gold)]/70 mb-2">
              Our Platform Principles
            </p>
            <h2 className="font-serif text-3xl text-white font-normal mb-2 leading-tight">
              Six Review Pillars
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
              {/* Glow — activation pulse then slow breathe */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 280, height: 280,
                  background: "radial-gradient(circle, rgba(198,165,90,0.16) 0%, transparent 70%)",
                  filter: "blur(20px)",
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={
                  inView
                    ? reduce
                      ? { opacity: 0.75 }
                      : { opacity: [0, 1, 0.62, 0.78, 0.66], scale: [0.9, 1.06, 1, 1.03, 1] }
                    : {}
                }
                transition={
                  reduce
                    ? { duration: 0.6 }
                    : { duration: 6, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }
                }
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
                  <circle key={`ld${i}`} cx={0} cy={py} r="2.5" fill="var(--ms-gold)" fillOpacity="0.35" />
                ))}
                {[47, 140, 233].map((py, i) => (
                  <circle key={`rd${i}`} cx={280} cy={py} r="2.5" fill="var(--ms-gold)" fillOpacity="0.35" />
                ))}
                <defs>
                  <linearGradient id="connLeft" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
                    <stop offset="0%" stopColor="var(--ms-gold)" stopOpacity="0" />
                    <stop offset="100%" stopColor="var(--ms-gold)" stopOpacity="0.35" />
                  </linearGradient>
                  <linearGradient id="connRight" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
                    <stop offset="0%" stopColor="var(--ms-gold)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--ms-gold)" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Rings — slowly rotating orbital system */}
              {[
                { d: 240, o: 0.08, dur: 90, dir: 1 },
                { d: 200, o: 0.14, dur: 130, dir: -1 },
                { d: 160, o: 0.22, dur: 60, dir: 1 },
              ].map((r, i) => (
                <motion.div
                  key={`ring${i}`}
                  className="absolute rounded-full"
                  style={{ width: r.d, height: r.d, border: `1px solid rgba(198,165,90,${r.o})` }}
                  animate={reduce ? undefined : { rotate: r.dir * 360 }}
                  transition={reduce ? undefined : { duration: r.dur, repeat: Infinity, ease: "linear" }}
                />
              ))}

              {/* Orbiting custody nodes — the constellation of dots that ride the rings */}
              <motion.div
                className="absolute"
                style={{ width: 240, height: 240 }}
                animate={reduce ? undefined : { rotate: 360 }}
                transition={reduce ? undefined : { duration: 90, repeat: Infinity, ease: "linear" }}
              >
                {ORBIT_NODES.map((n, i) => (
                  <span
                    key={i}
                    className="absolute rounded-full bg-[var(--ms-gold)]"
                    style={{
                      width: n.size,
                      height: n.size,
                      opacity: n.opacity,
                      left: `${50 + (n.radius / 240) * 100 * Math.cos((n.angle * Math.PI) / 180)}%`,
                      top: `${50 + (n.radius / 240) * 100 * Math.sin((n.angle * Math.PI) / 180)}%`,
                      marginLeft: -n.size / 2,
                      marginTop: -n.size / 2,
                      boxShadow: "0 0 6px rgba(198,165,90,0.6)",
                    }}
                  />
                ))}
              </motion.div>

              {/* Counter-rotating inner node ring for depth */}
              <motion.div
                className="absolute"
                style={{ width: 200, height: 200 }}
                animate={reduce ? undefined : { rotate: -360 }}
                transition={reduce ? undefined : { duration: 130, repeat: Infinity, ease: "linear" }}
              >
                {ORBIT_NODES.slice(0, 3).map((n, i) => (
                  <span
                    key={`inner${i}`}
                    className="absolute rounded-full bg-[var(--ms-gold)]"
                    style={{
                      width: 2,
                      height: 2,
                      opacity: 0.5,
                      left: `${50 + (78 / 200) * 100 * Math.cos(((n.angle + 40) * Math.PI) / 180)}%`,
                      top: `${50 + (78 / 200) * 100 * Math.sin(((n.angle + 40) * Math.PI) / 180)}%`,
                      marginLeft: -1,
                      marginTop: -1,
                      boxShadow: "0 0 5px rgba(198,165,90,0.6)",
                    }}
                  />
                ))}
              </motion.div>

              {/* Compass axis — faint cross lines through the orbit */}
              <div aria-hidden="true" className="absolute" style={{ width: 240, height: 240 }}>
                <div
                  className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
                  style={{ background: "linear-gradient(to bottom, transparent, rgba(198,165,90,0.16), transparent)" }}
                />
                <div
                  className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2"
                  style={{ background: "linear-gradient(to right, transparent, rgba(198,165,90,0.16), transparent)" }}
                />
              </div>

              {/* Scan highlight — slow rotating radar sweep */}
              {!reduce && (
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 200,
                    height: 200,
                    background:
                      "conic-gradient(from 0deg, transparent 0deg, rgba(198,165,90,0.16) 24deg, transparent 64deg)",
                    maskImage: "radial-gradient(circle, black 58%, transparent 72%)",
                    WebkitMaskImage: "radial-gradient(circle, black 58%, transparent 72%)",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                />
              )}

              {/* Core */}
              <div
                className="relative w-[130px] h-[130px] rounded-full border border-[var(--ms-gold)]/40 flex items-center justify-center"
                style={{
                  background: "radial-gradient(circle, rgba(198,165,90,0.13) 0%, rgba(6,6,8,0.97) 70%)",
                  boxShadow: "0 0 48px rgba(198,165,90,0.12), inset 0 0 28px rgba(198,165,90,0.05)",
                }}
              >
                <Image
                  src="/milano-seal-core-brain-feather.png"
                  alt="The Milano Seal Trust Core medallion"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full object-contain drop-shadow-[0_0_28px_rgba(198,165,90,0.35)]"
                  priority={false}
                />
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
