"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  Globe2,
  LockKeyhole,
  GitBranch,
  Stamp,
  Send,
  ArrowRight,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

// Trust Core intelligence medallion — the brain/M hybrid. Used ONLY here to
// signify document intelligence, routing, and controlled-release judgment. The
// official Milano Seal crest (orb-v2) remains the global brand mark in the
// header, footer, portal, and formal materials.
const MILANO_CREST = "/brand/milano-seal-core-brain-feather.png";

const LEFT_PRINCIPLES = [
  { index: "01", icon: ShieldCheck, title: "Secure Intake", desc: "Verified identity, document stage, and scope before the matter begins.", href: "/intake" },
  { index: "02", icon: Globe2, title: "Global Document Intelligence", desc: "Destination rules, forms, and authority requirements reviewed by corridor.", href: "/countries" },
  { index: "03", icon: LockKeyhole, title: "Payment-Gated Scheduling", desc: "Scheduling opens only after scope and payment confirmation.", href: "/process" },
];

const RIGHT_PRINCIPLES = [
  { index: "04", icon: GitBranch, title: "Chain-of-Custody Visibility", desc: "Every custody movement is tracked from intake to release.", href: "/process" },
  { index: "05", icon: Stamp, title: "Apostille Coordination", desc: "Apostille and authentication routing coordinated by jurisdiction.", href: "/services/apostille" },
  { index: "06", icon: Send, title: "International Release", desc: "Final packets release through approved courier and delivery controls.", href: "/learn/international-document-courier" },
];

// Deterministic — no Math.random, stable across server/client render.
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  size: i % 4 === 0 ? 2 : 1,
  opacity: 0.05 + (i % 4) * 0.03,
  left: 4 + ((i * 19 + i * i * 5) % 92),
  top: 6 + ((i * 11 + i * 9) % 88),
}));

const ORBIT_NODES = [
  { angle: 18, radius: 116, size: 3, opacity: 0.7 },
  { angle: 96, radius: 116, size: 2, opacity: 0.45 },
  { angle: 162, radius: 116, size: 2.5, opacity: 0.6 },
  { angle: 240, radius: 92, size: 2.5, opacity: 0.55 },
  { angle: 300, radius: 92, size: 2, opacity: 0.4 },
  { angle: 348, radius: 92, size: 3, opacity: 0.65 },
];

function Atmosphere({ y }: { y: import("framer-motion").MotionValue<number> }) {
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ y }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 75% at 50% 42%, rgba(198,165,90,0.07) 0%, transparent 56%)" }} />
      {/* corridor / map line texture */}
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          background:
            "linear-gradient(rgba(198,165,90,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(198,165,90,0.03) 1px, transparent 1px)",
          backgroundSize: "62px 62px, 62px 62px",
          maskImage: "radial-gradient(72% 62% at 50% 48%, black, transparent)",
          WebkitMaskImage: "radial-gradient(72% 62% at 50% 48%, black, transparent)",
        }}
      />
      {/* vignette */}
      <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 180px 40px rgba(0,0,0,0.7)" }} />
      <div className="absolute inset-x-0 top-0 h-28" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)" }} />
      <div className="absolute inset-x-0 bottom-0 h-28" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }} />
      {PARTICLES.map((p, i) => (
        <span key={i} className="absolute rounded-full bg-[var(--ms-gold)]" style={{ width: p.size, height: p.size, opacity: p.opacity, left: `${p.left}%`, top: `${p.top}%` }} />
      ))}
    </motion.div>
  );
}

function CenterCore({ inView, reduce, compact = false }: { inView: boolean; reduce: boolean; compact?: boolean }) {
  const d = compact ? 0.66 : 1;
  const spin = reduce ? {} : { animate: { rotate: 360 }, transition: { duration: 90, repeat: Infinity, ease: "linear" as const } };
  const spinRev = reduce ? {} : { animate: { rotate: -360 }, transition: { duration: 130, repeat: Infinity, ease: "linear" as const } };
  const crestSize = Math.round(118 * d);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: 250 * d, height: 250 * d }}
      initial={{ opacity: 0, scale: 0.86, filter: "blur(6px)" }}
      animate={inView ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
    >
      {/* radial glow — activation pulse then breathe */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 280 * d, height: 280 * d, background: "radial-gradient(circle, rgba(198,165,90,0.16) 0%, transparent 70%)", filter: "blur(20px)" }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={inView ? (reduce ? { opacity: 0.75 } : { opacity: [0, 1, 0.62, 0.74], scale: [0.9, 1.06, 1, 1.01] }) : {}}
        transition={{ duration: 2.6, ease: EASE, times: [0, 0.35, 0.7, 1] }}
      />
      {/* multi-layer rings */}
      <motion.div className="absolute rounded-full" style={{ width: 240 * d, height: 240 * d, border: "1px solid rgba(198,165,90,0.10)" }} {...spin} />
      <motion.div className="absolute rounded-full" style={{ width: 188 * d, height: 188 * d, border: "1px solid rgba(198,165,90,0.18)" }} {...spinRev} />
      {/* orbiting custody nodes (ride the outer ring) */}
      <motion.div className="absolute" style={{ width: 240 * d, height: 240 * d }} {...spin}>
        {ORBIT_NODES.map((n, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[var(--ms-gold)]"
            style={{
              width: n.size, height: n.size, opacity: n.opacity,
              left: `${50 + (n.radius / (250 * d) * 100 * d) * Math.cos((n.angle * Math.PI) / 180)}%`,
              top: `${50 + (n.radius / (250 * d) * 100 * d) * Math.sin((n.angle * Math.PI) / 180)}%`,
              boxShadow: "0 0 6px rgba(198,165,90,0.6)",
            }}
          />
        ))}
      </motion.div>
      {/* compass axis */}
      <div aria-hidden="true" className="absolute" style={{ width: 240 * d, height: 240 * d }}>
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2" style={{ background: "linear-gradient(to bottom, transparent, rgba(198,165,90,0.16), transparent)" }} />
        <div className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2" style={{ background: "linear-gradient(to right, transparent, rgba(198,165,90,0.16), transparent)" }} />
      </div>
      {/* scan highlight */}
      {!reduce && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 200 * d, height: 200 * d,
            background: "conic-gradient(from 0deg, transparent 0deg, rgba(198,165,90,0.16) 24deg, transparent 64deg)",
            maskImage: "radial-gradient(circle, black 58%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(circle, black 58%, transparent 72%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        />
      )}
      {/* core medallion with official crest + gold rim light */}
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: 150 * d, height: 150 * d,
          background: "radial-gradient(circle, rgba(198,165,90,0.12) 0%, rgba(6,6,8,0.96) 72%)",
          border: "1px solid rgba(198,165,90,0.4)",
          boxShadow: "0 0 52px rgba(198,165,90,0.16), inset 0 0 26px rgba(198,165,90,0.07)",
        }}
      >
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,245,220,0.16) 0%, transparent 46%)" }} />
        <Image
          src={MILANO_CREST}
          alt="Trust Core intelligence medallion"
          width={crestSize}
          height={crestSize}
          priority={false}
          className="relative select-none"
          style={{ filter: "drop-shadow(0 0 16px rgba(198,165,90,0.4))" }}
        />
      </div>
    </motion.div>
  );
}

function Connectors({ inView, reduce }: { inView: boolean; reduce: boolean }) {
  // Core sits at (150,170) in this 300x340 stage. Lines fan to the three card rows
  // on each side and extend past the stage edge (x<0 / x>300) into the column gap so
  // they visually meet the flanking cards. overflow:visible lets them bleed out.
  const CX = 150;
  const CY = 170;
  const rows = [54, 170, 286];
  // left endpoint x=-44, right endpoint x=344 — curved via a control point near the core.
  const leftPaths = rows.map((y) => `M ${CX} ${CY} C ${CX - 70} ${CY}, ${20} ${y}, ${-44} ${y}`);
  const rightPaths = rows.map((y) => `M ${CX} ${CY} C ${CX + 70} ${CY}, ${280} ${y}, ${344} ${y}`);

  const draw = (i: number) => ({
    initial: reduce ? { opacity: 0 } : { pathLength: 0, opacity: 0 },
    animate: inView ? (reduce ? { opacity: 0.5 } : { pathLength: 1, opacity: 0.5 }) : {},
    transition: { duration: reduce ? 0.4 : 1.15, delay: 0.45 + i * 0.12, ease: EASE },
  });

  const allPaths = [...leftPaths, ...rightPaths];

  return (
    <svg className="absolute inset-0 pointer-events-none" width="300" height="340" viewBox="0 0 300 340" fill="none" style={{ overflow: "visible" }} aria-hidden="true">
      {leftPaths.map((d, i) => (
        <motion.path key={`lp${i}`} d={d} stroke="url(#cL)" strokeWidth="1.25" strokeLinecap="round" {...draw(i)} />
      ))}
      {rightPaths.map((d, i) => (
        <motion.path key={`rp${i}`} d={d} stroke="url(#cR)" strokeWidth="1.25" strokeLinecap="round" {...draw(i)} />
      ))}

      {/* live "flow" pulse travelling outward along each wire (skipped on reduced motion) */}
      {!reduce &&
        allPaths.map((d, i) => (
          <motion.path
            key={`flow${i}`}
            d={d}
            stroke="rgba(255,245,220,0.85)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="3 150"
            initial={{ strokeDashoffset: 0, opacity: 0 }}
            animate={inView ? { strokeDashoffset: -153, opacity: [0, 0.9, 0] } : {}}
            transition={{ duration: 2.6, repeat: Infinity, delay: 1.6 + i * 0.25, ease: "linear" }}
          />
        ))}

      {/* endpoint glow nodes where each wire meets a card */}
      {rows.map((y, i) => (
        <motion.circle key={`ld${i}`} cx={-44} cy={y} r="3" fill="var(--ms-gold)" initial={{ opacity: 0, scale: 0 }} animate={inView ? { opacity: 0.55, scale: 1 } : {}} transition={{ duration: 0.4, delay: 1.2 + i * 0.1 }} style={{ filter: "drop-shadow(0 0 5px rgba(198,165,90,0.7))" }} />
      ))}
      {rows.map((y, i) => (
        <motion.circle key={`rd${i}`} cx={344} cy={y} r="3" fill="var(--ms-gold)" initial={{ opacity: 0, scale: 0 }} animate={inView ? { opacity: 0.55, scale: 1 } : {}} transition={{ duration: 0.4, delay: 1.2 + i * 0.1 }} style={{ filter: "drop-shadow(0 0 5px rgba(198,165,90,0.7))" }} />
      ))}

      <defs>
        <linearGradient id="cL" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--ms-gold)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--ms-gold)" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="cR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--ms-gold)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--ms-gold)" stopOpacity="0.05" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PrincipleCard({
  principle,
  align,
  inView,
  reduce,
  index,
}: {
  principle: { index: string; icon: React.ElementType; title: string; desc: string; href: string };
  align: "left" | "right";
  inView: boolean;
  reduce: boolean;
  index: number;
}) {
  const Icon = principle.icon;
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: align === "left" ? -16 : 16, filter: "blur(8px)" }}
      animate={inView ? (reduce ? { opacity: 1 } : { opacity: 1, x: 0, filter: "blur(0px)" }) : {}}
      transition={{ duration: 0.6, delay: 0.22 + index * 0.1, ease: EASE }}
      whileHover={reduce ? undefined : { y: -2 }}
      className="group relative rounded-2xl p-[1px] transition-shadow duration-300"
      style={{
        background:
          "linear-gradient(150deg, rgba(198,165,90,0.5) 0%, rgba(198,165,90,0.12) 30%, rgba(198,165,90,0.04) 60%, rgba(198,165,90,0.22) 100%)",
      }}
    >
      <Link
        href={principle.href}
        aria-label={`${principle.title} — learn more`}
        className="relative block h-full rounded-2xl p-5 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)]/60"
        style={{
          background: "linear-gradient(180deg, rgba(12,12,14,0.92) 0%, rgba(7,7,8,0.86) 100%)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: "0 18px 46px rgba(0,0,0,0.45)",
        }}
      >
        {/* inner gold corner highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-70 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: align === "right"
            ? "radial-gradient(120% 90% at 100% 0%, rgba(198,165,90,0.10), transparent 45%)"
            : "radial-gradient(120% 90% at 0% 0%, rgba(198,165,90,0.10), transparent 45%)" }}
        />
        <div className={`relative flex items-start gap-3.5 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--ms-gold)]/25 transition-all duration-300 group-hover:border-[var(--ms-gold)]/50 group-hover:shadow-[inset_0_0_14px_rgba(198,165,90,0.18)]">
            <Icon className="h-4 w-4 text-[var(--ms-gold)]/75 transition-colors group-hover:text-[var(--ms-gold)]" />
          </div>
          <div className="min-w-0">
            <div className={`mb-1 flex items-baseline gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
              <span className="font-mono text-[9px] tracking-[0.2em] text-[var(--ms-gold)]/45">{principle.index}</span>
              <h3 className="font-serif text-[15px] font-medium leading-snug text-[#E8DCC0] transition-colors group-hover:text-[var(--ms-gold)]">{principle.title}</h3>
            </div>
            <p className="text-[13px] leading-relaxed text-white/58">{principle.desc}</p>
            <span className={`mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ms-gold)]/0 transition-colors duration-300 group-hover:text-[var(--ms-gold)]/70 ${align === "right" ? "flex-row-reverse" : ""}`}>
              View <ArrowRight className="h-2.5 w-2.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function MilanoTrustCore() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const hazeY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-18, 18]);
  const coreY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [26, -26]);

  return (
    <section ref={ref} className="relative w-full overflow-hidden border-t border-[var(--ms-gold)]/12 bg-[#050506] py-16 px-4 sm:px-6 lg:px-8">
      <Atmosphere y={hazeY} />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center">
          <motion.p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ms-gold)]/70" initial={{ opacity: 0, y: -8 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, ease: EASE }}>
            Our Platform Principles
          </motion.p>
          <motion.h2
            className="font-serif text-3xl font-normal leading-tight text-white sm:text-4xl"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(6px)" }}
            animate={inView ? (reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }) : {}}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
          >
            Milano Trust Core
          </motion.h2>
          <motion.p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/55" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.7, delay: 0.22, ease: EASE }}>
            Every matter follows a structured sequence. Nothing moves out of order. Nothing skips a gate.
          </motion.p>
        </div>

        {/* Mobile: crest medallion + gold spine + stacked cards */}
        <div className="mt-12 lg:hidden">
          <div className="mb-10 flex justify-center">
            <CenterCore inView={inView} reduce={reduce} compact />
          </div>
          <div className="relative flex flex-col gap-4 pl-1">
            <div aria-hidden="true" className="absolute left-[14px] top-2 bottom-2 w-px" style={{ background: "linear-gradient(to bottom, transparent, rgba(198,165,90,0.25), transparent)" }} />
            {[...LEFT_PRINCIPLES, ...RIGHT_PRINCIPLES].map((p, i) => (
              <PrincipleCard key={p.index} principle={p} align="left" inView={inView} reduce={reduce} index={i} />
            ))}
          </div>
        </div>

        {/* Desktop: spacious flanking layout around the cinematic crest core */}
        <div className="mt-16 hidden lg:grid grid-cols-[1fr_320px_1fr] items-center gap-x-12">
          <div className="flex flex-col gap-8">
            {LEFT_PRINCIPLES.map((p, i) => (
              <PrincipleCard key={p.index} principle={p} align="left" inView={inView} reduce={reduce} index={i} />
            ))}
          </div>
          <motion.div className="relative flex items-center justify-center" style={{ height: 340, y: coreY }}>
            <Connectors inView={inView} reduce={reduce} />
            <CenterCore inView={inView} reduce={reduce} />
          </motion.div>
          <div className="flex flex-col gap-8">
            {RIGHT_PRINCIPLES.map((p, i) => (
              <PrincipleCard key={p.index} principle={p} align="right" inView={inView} reduce={reduce} index={i} />
            ))}
          </div>
        </div>

        {/* CTA row */}
        <motion.div className="mt-14 flex flex-col items-center gap-3 sm:flex-row sm:justify-center" initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.4, ease: EASE }}>
          <Link
            href="/intake"
            className="group relative inline-flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-lg px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a1206] transition-all duration-300 hover:shadow-[0_0_28px_rgba(198,165,90,0.45)] sm:w-auto"
            style={{
              background: "linear-gradient(180deg, #ECD79A 0%, #D4B76A 46%, #C6A55A 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.25), 0 8px 22px rgba(198,165,90,0.25)",
            }}
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden="true" />
            <span className="relative">Begin Secure Intake</span>
            <ArrowRight className="relative h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/countries"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-[var(--ms-gold)]/35 bg-black/30 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ms-gold)]/85 transition-colors hover:border-[var(--ms-gold)]/60 hover:bg-[var(--ms-gold)]/[0.07] hover:text-[var(--ms-gold)] sm:w-auto"
          >
            Explore Global Document Intelligence
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
