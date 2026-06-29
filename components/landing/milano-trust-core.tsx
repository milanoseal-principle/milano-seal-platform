"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
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

// Deterministic ambient field — no Math.random, stable across server/client render.
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  size: i % 3 === 0 ? 2 : 1,
  opacity: 0.06 + (i % 4) * 0.035,
  left: 4 + ((i * 17 + i * i * 3) % 92),
  top: 6 + ((i * 13 + i * 7) % 86),
  delay: (i % 6) * 0.4,
}));

// Deterministic orbit nodes riding the rings around the core.
const ORBIT_NODES = [
  { angle: 0, radius: 100, size: 3, opacity: 0.7, ring: 0 },
  { angle: 60, radius: 100, size: 2, opacity: 0.45, ring: 0 },
  { angle: 130, radius: 100, size: 2.5, opacity: 0.6, ring: 0 },
  { angle: 210, radius: 80, size: 2.5, opacity: 0.55, ring: 1 },
  { angle: 285, radius: 80, size: 2, opacity: 0.4, ring: 1 },
  { angle: 330, radius: 80, size: 3, opacity: 0.65, ring: 1 },
];

const EASE = [0.16, 1, 0.3, 1] as const;

function Atmosphere({ y }: { y: import("framer-motion").MotionValue<number> }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ y }}
    >
      {/* vertical gold haze */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 50%, rgba(198,165,90,0.05) 0%, transparent 55%)",
        }}
      />
      {/* top/bottom depth */}
      <div
        className="absolute inset-x-0 top-0 h-24"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-24"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}
      />
      {/* deterministic dot field */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[var(--ms-gold)]"
          style={{
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            left: `${p.left}%`,
            top: `${p.top}%`,
          }}
        />
      ))}
    </motion.div>
  );
}

function CinematicConnectors({ inView, reduce }: { inView: boolean; reduce: boolean }) {
  const rows = [47, 140, 233];
  const draw = (i: number) => ({
    initial: reduce
      ? { opacity: 0 }
      : { strokeDashoffset: 220, opacity: 0 },
    animate: inView
      ? reduce
        ? { opacity: 0.5 }
        : { strokeDashoffset: 0, opacity: 0.5 }
      : {},
    transition: { duration: reduce ? 0.4 : 1.1, delay: 0.25 + i * 0.12, ease: EASE },
  });
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width="280"
      height="280"
      viewBox="0 0 280 280"
      fill="none"
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      {rows.map((py, i) => (
        <motion.line
          key={`l${i}`}
          x1={0}
          y1={py}
          x2={75}
          y2={140}
          stroke="url(#connLeft)"
          strokeWidth="1"
          strokeDasharray="220"
          {...draw(i)}
        />
      ))}
      {rows.map((py, i) => (
        <motion.line
          key={`r${i}`}
          x1={205}
          y1={140}
          x2={280}
          y2={py}
          stroke="url(#connRight)"
          strokeWidth="1"
          strokeDasharray="220"
          {...draw(i)}
        />
      ))}
      {rows.map((py, i) => (
        <motion.circle
          key={`ld${i}`}
          cx={0}
          cy={py}
          r="2.5"
          fill="var(--ms-gold)"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 0.4 } : {}}
          transition={{ duration: 0.4, delay: 0.9 + i * 0.1 }}
        />
      ))}
      {rows.map((py, i) => (
        <motion.circle
          key={`rd${i}`}
          cx={280}
          cy={py}
          r="2.5"
          fill="var(--ms-gold)"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 0.4 } : {}}
          transition={{ duration: 0.4, delay: 0.9 + i * 0.1 }}
        />
      ))}
      <defs>
        <linearGradient id="connLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--ms-gold)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--ms-gold)" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="connRight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--ms-gold)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--ms-gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CinematicOrb({ inView, reduce }: { inView: boolean; reduce: boolean }) {
  const spin = (dur: number, dir = 1) =>
    reduce
      ? {}
      : { animate: { rotate: 360 * dir }, transition: { duration: dur, repeat: Infinity, ease: "linear" as const } };

  return (
    <>
      {/* Breathing glow — one activation pulse, then settle */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 260,
          height: 260,
          background: "radial-gradient(circle, rgba(198,165,90,0.12) 0%, transparent 70%)",
          filter: "blur(16px)",
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={
          inView
            ? reduce
              ? { opacity: 0.7, scale: 1 }
              : { opacity: [0, 0.9, 0.6, 0.7], scale: [0.9, 1.04, 1, 1.01] }
            : {}
        }
        transition={{ duration: 2.4, ease: EASE, times: [0, 0.35, 0.7, 1] }}
      />

      <CinematicConnectors inView={inView} reduce={reduce} />

      {/* Outer ring — slow rotate */}
      <motion.div
        className="absolute w-[240px] h-[240px] rounded-full"
        style={{ border: "1px solid rgba(198,165,90,0.08)" }}
        {...spin(70, 1)}
      />
      {/* Orbit nodes ride the outer ring (rotates with it via wrapper) */}
      <motion.div className="absolute w-[240px] h-[240px]" {...spin(70, 1)}>
        {ORBIT_NODES.filter((n) => n.ring === 0).map((n, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[var(--ms-gold)]"
            style={{
              width: n.size,
              height: n.size,
              opacity: n.opacity,
              left: `${50 + (n.radius / 2.4) * Math.cos((n.angle * Math.PI) / 180)}%`,
              top: `${50 + (n.radius / 2.4) * Math.sin((n.angle * Math.PI) / 180)}%`,
              boxShadow: "0 0 6px rgba(198,165,90,0.6)",
            }}
          />
        ))}
      </motion.div>

      {/* Middle ring — counter-rotate slower */}
      <motion.div
        className="absolute w-[200px] h-[200px] rounded-full"
        style={{ border: "1px solid rgba(198,165,90,0.14)" }}
        {...spin(110, -1)}
      />
      <motion.div className="absolute w-[200px] h-[200px]" {...spin(110, -1)}>
        {ORBIT_NODES.filter((n) => n.ring === 1).map((n, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[var(--ms-gold)]"
            style={{
              width: n.size,
              height: n.size,
              opacity: n.opacity,
              left: `${50 + (n.radius / 2) * Math.cos((n.angle * Math.PI) / 180)}%`,
              top: `${50 + (n.radius / 2) * Math.sin((n.angle * Math.PI) / 180)}%`,
              boxShadow: "0 0 6px rgba(198,165,90,0.6)",
            }}
          />
        ))}
      </motion.div>

      {/* Inner ring (static) */}
      <div
        className="absolute w-[160px] h-[160px] rounded-full"
        style={{ border: "1px solid rgba(198,165,90,0.22)" }}
      />

      {/* Slow scan sweep across the orb */}
      {!reduce && (
        <motion.div
          className="absolute w-[200px] h-[200px] rounded-full pointer-events-none"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(198,165,90,0.16) 22deg, transparent 60deg)",
            maskImage: "radial-gradient(circle, black 60%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(circle, black 60%, transparent 72%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Core */}
      <div
        className="relative w-[130px] h-[130px] rounded-full border border-[var(--ms-gold)]/40 flex items-center justify-center"
        style={{
          background: "radial-gradient(circle, rgba(198,165,90,0.14) 0%, rgba(6,6,8,0.97) 70%)",
          boxShadow: "0 0 48px rgba(198,165,90,0.13), inset 0 0 28px rgba(198,165,90,0.06)",
        }}
      >
        {/* specular highlight arc */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,245,220,0.18) 0%, transparent 40%)",
          }}
        />
        <span
          className="relative font-serif text-[var(--ms-gold)] text-5xl font-medium leading-none select-none"
          style={{ textShadow: "0 0 32px rgba(198,165,90,0.5)" }}
        >
          M
        </span>
      </div>
    </>
  );
}

function Pillar({
  icon: Icon,
  title,
  desc,
  align,
  delay,
  inView,
  href,
  reduce,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  align: "left" | "right";
  delay: number;
  inView: boolean;
  href: string;
  reduce: boolean;
}) {
  return (
    <motion.div
      initial={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, x: align === "left" ? -18 : 18, filter: "blur(8px)" }
      }
      animate={
        inView
          ? reduce
            ? { opacity: 1 }
            : { opacity: 1, x: 0, filter: "blur(0px)" }
          : {}
      }
      transition={{ duration: 0.6, delay, ease: EASE }}
      whileHover={reduce ? undefined : { y: -2 }}
    >
      <Link
        href={href}
        className={`flex items-start gap-3 group ${align === "right" ? "flex-row-reverse text-right" : ""}`}
      >
        <div className="w-8 h-8 rounded-lg border border-[var(--ms-gold)]/20 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 group-hover:border-[var(--ms-gold)]/45 group-hover:shadow-[inset_0_0_12px_rgba(198,165,90,0.18)]">
          <Icon className="w-3.5 h-3.5 text-[var(--ms-gold)]/70 group-hover:text-[var(--ms-gold)] transition-colors" />
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-[#E8DCC0] text-[15px] font-medium mb-1 leading-snug group-hover:text-[var(--ms-gold)] transition-colors">
            {title}
          </h3>
          <p className="text-[#8A8A8A] text-[13px] leading-relaxed group-hover:text-[#A89A78] transition-colors">
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

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const orbY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [28, -28]);
  const hazeY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-18, 18]);

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: EASE }}
      className="relative w-full border-t border-[#1A1A1A] bg-[#060608] py-10 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <Atmosphere y={hazeY} />

      <div className="relative max-w-5xl mx-auto">
        {/* Mobile: compact medallion + header + grid */}
        <div className="lg:hidden">
          <div className="flex flex-col items-center text-center mb-10">
            <motion.div
              className="w-14 h-14 rounded-full border border-[var(--ms-gold)]/30 flex items-center justify-center mb-5"
              style={{ background: "radial-gradient(circle, rgba(198,165,90,0.10) 0%, transparent 70%)" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <span className="font-serif text-[var(--ms-gold)] text-2xl font-medium leading-none">M</span>
            </motion.div>
            <p className="font-mono text-[9px] tracking-[0.08em] uppercase text-[var(--ms-gold)]/70 mb-2">
              Our Platform Principles
            </p>
            <h2 className="font-serif text-2xl text-white font-normal mb-2">Milano Trust Core</h2>
            <p className="text-white/55 text-sm max-w-xs leading-relaxed">
              International document matters rarely fail because of complexity alone. They fail because a signature was missed, a certificate was incomplete, an apostille route was misunderstood, a translation was overlooked, or a document packet moved without proper review. The Milano Seal brings structure to that process through secure intake, document review, notarization coordination, apostille/authentication routing, courier custody, and final release support.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...LEFT_PILLARS, ...RIGHT_PILLARS].map((p, i) => (
              <Pillar key={p.title} {...p} align="left" delay={0.07 * i} inView={inView} reduce={reduce} />
            ))}
          </div>
        </div>

        {/* Desktop: staggered header, then radial split with cinematic core */}
        <div className="hidden lg:block">
          <motion.div className="text-center mb-10">
            <motion.p
              className="font-mono text-[9px] tracking-[0.08em] uppercase text-[var(--ms-gold)]/70 mb-2"
              initial={{ opacity: 0, y: -8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: EASE }}
            >
              Our Platform Principles
            </motion.p>
            <motion.h2
              className="font-serif text-3xl text-white font-normal mb-2 leading-tight"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(6px)" }}
              animate={inView ? (reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }) : {}}
              transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
            >
              Milano Trust Core
            </motion.h2>
            <motion.p
              className="text-white/50 text-sm leading-relaxed max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
            >
              International document matters rarely fail because of complexity alone. They fail because a signature was missed, a certificate was incomplete, an apostille route was misunderstood, a translation was overlooked, or a document packet moved without proper review. The Milano Seal brings structure to that process through secure intake, document review, notarization coordination, apostille/authentication routing, courier custody, and final release support.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-[1fr_280px_1fr] items-center gap-0 relative" style={{ minHeight: 280 }}>
            <div className="flex flex-col gap-7 pr-8">
              {LEFT_PILLARS.map((p, i) => (
                <Pillar key={p.title} {...p} align="left" delay={0.3 + 0.1 * i} inView={inView} reduce={reduce} />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
              className="flex items-center justify-center relative"
              style={{ height: 280, y: orbY }}
            >
              <CinematicOrb inView={inView} reduce={reduce} />
            </motion.div>

            <div className="flex flex-col gap-7 pl-8">
              {RIGHT_PILLARS.map((p, i) => (
                <Pillar key={p.title} {...p} align="right" delay={0.3 + 0.1 * i} inView={inView} reduce={reduce} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
