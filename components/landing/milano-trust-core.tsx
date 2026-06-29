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

const LEFT_PRINCIPLES = [
  {
    index: "01",
    icon: ShieldCheck,
    title: "Secure Intake",
    desc: "Verified identity, document stage, and scope before the matter begins.",
  },
  {
    index: "02",
    icon: Globe2,
    title: "Global Document Intelligence",
    desc: "Destination rules, forms, and authority requirements reviewed by corridor.",
  },
  {
    index: "03",
    icon: LockKeyhole,
    title: "Payment-Gated Scheduling",
    desc: "Scheduling opens only after scope and payment confirmation.",
  },
];

const RIGHT_PRINCIPLES = [
  {
    index: "04",
    icon: GitBranch,
    title: "Chain-of-Custody Visibility",
    desc: "Every custody movement is tracked from intake to release.",
  },
  {
    index: "05",
    icon: Stamp,
    title: "Apostille Coordination",
    desc: "Apostille and authentication routing coordinated by jurisdiction.",
  },
  {
    index: "06",
    icon: Send,
    title: "International Release",
    desc: "Final packets release through approved courier and delivery controls.",
  },
];

// Deterministic ambient field — stable across server/client render (no Math.random).
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  size: i % 4 === 0 ? 2 : 1,
  opacity: 0.05 + (i % 4) * 0.03,
  left: 4 + ((i * 19 + i * i * 5) % 92),
  top: 6 + ((i * 11 + i * 9) % 88),
}));

function Atmosphere({ y }: { y: import("framer-motion").MotionValue<number> }) {
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ y }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 45%, rgba(198,165,90,0.05) 0%, transparent 58%)",
        }}
      />
      {/* faint world-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          background:
            "linear-gradient(rgba(198,165,90,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(198,165,90,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px, 64px 64px",
          maskImage: "radial-gradient(70% 60% at 50% 50%, black, transparent)",
          WebkitMaskImage: "radial-gradient(70% 60% at 50% 50%, black, transparent)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-28" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }} />
      <div className="absolute inset-x-0 bottom-0 h-28" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[var(--ms-gold)]"
          style={{ width: p.size, height: p.size, opacity: p.opacity, left: `${p.left}%`, top: `${p.top}%` }}
        />
      ))}
    </motion.div>
  );
}

function CenterCore({ inView, reduce, compact = false }: { inView: boolean; reduce: boolean; compact?: boolean }) {
  const d = compact ? 0.62 : 1; // scale factor
  const spin = reduce ? {} : { animate: { rotate: 360 }, transition: { duration: 90, repeat: Infinity, ease: "linear" as const } };
  const spinRev = reduce ? {} : { animate: { rotate: -360 }, transition: { duration: 130, repeat: Infinity, ease: "linear" as const } };
  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: 230 * d, height: 230 * d }}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.85, delay: 0.1, ease: EASE }}
    >
      <motion.div
        className="absolute rounded-full"
        style={{ width: 260 * d, height: 260 * d, background: "radial-gradient(circle, rgba(198,165,90,0.13) 0%, transparent 70%)", filter: "blur(18px)" }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={inView ? (reduce ? { opacity: 0.7 } : { opacity: [0, 0.95, 0.6, 0.7], scale: [0.9, 1.05, 1, 1.01] }) : {}}
        transition={{ duration: 2.6, ease: EASE, times: [0, 0.35, 0.7, 1] }}
      />
      <motion.div className="absolute rounded-full" style={{ width: 220 * d, height: 220 * d, border: "1px solid rgba(198,165,90,0.08)" }} {...spin} />
      <motion.div className="absolute rounded-full" style={{ width: 168 * d, height: 168 * d, border: "1px solid rgba(198,165,90,0.16)" }} {...spinRev} />
      <div aria-hidden="true" className="absolute" style={{ width: 220 * d, height: 220 * d }}>
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2" style={{ background: "linear-gradient(to bottom, transparent, rgba(198,165,90,0.16), transparent)" }} />
        <div className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2" style={{ background: "linear-gradient(to right, transparent, rgba(198,165,90,0.16), transparent)" }} />
      </div>
      <div
        className="relative rounded-full border border-[var(--ms-gold)]/40 flex items-center justify-center"
        style={{
          width: 120 * d,
          height: 120 * d,
          background: "radial-gradient(circle, rgba(198,165,90,0.14) 0%, rgba(6,6,8,0.97) 70%)",
          boxShadow: "0 0 46px rgba(198,165,90,0.13), inset 0 0 26px rgba(198,165,90,0.06)",
        }}
      >
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,245,220,0.16) 0%, transparent 44%)" }} />
        <span className="relative font-serif text-[var(--ms-gold)] font-medium leading-none select-none" style={{ fontSize: 44 * d, textShadow: "0 0 30px rgba(198,165,90,0.5)" }}>
          M
        </span>
      </div>
    </motion.div>
  );
}

function Connectors({ inView, reduce }: { inView: boolean; reduce: boolean }) {
  const rows = [60, 160, 260];
  const line = (i: number) => ({
    initial: reduce ? { opacity: 0 } : { strokeDashoffset: 260, opacity: 0 },
    animate: inView ? (reduce ? { opacity: 0.4 } : { strokeDashoffset: 0, opacity: 0.4 }) : {},
    transition: { duration: reduce ? 0.4 : 1.1, delay: 0.4 + i * 0.12, ease: EASE },
  });
  return (
    <svg className="absolute inset-0 pointer-events-none" width="300" height="320" viewBox="0 0 300 320" fill="none" style={{ overflow: "visible" }} aria-hidden="true">
      {rows.map((py, i) => (
        <motion.line key={`l${i}`} x1={0} y1={py} x2={90} y2={160} stroke="url(#cL)" strokeWidth="1" strokeDasharray="260" {...line(i)} />
      ))}
      {rows.map((py, i) => (
        <motion.line key={`r${i}`} x1={210} y1={160} x2={300} y2={py} stroke="url(#cR)" strokeWidth="1" strokeDasharray="260" {...line(i)} />
      ))}
      <defs>
        <linearGradient id="cL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--ms-gold)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--ms-gold)" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="cR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--ms-gold)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--ms-gold)" stopOpacity="0" />
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
  principle: { index: string; icon: React.ElementType; title: string; desc: string };
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
      transition={{ duration: 0.6, delay: 0.2 + index * 0.1, ease: EASE }}
      whileHover={reduce ? undefined : { y: -2 }}
      className="group relative rounded-2xl border border-[var(--ms-gold)]/18 p-5 transition-colors duration-300 hover:border-[var(--ms-gold)]/35"
      style={{
        background: "rgba(8,8,10,0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: "0 16px 44px rgba(0,0,0,0.4), inset 0 0 24px rgba(198,165,90,0.02)",
      }}
    >
      <div className={`flex items-start gap-3.5 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--ms-gold)]/22 transition-all duration-300 group-hover:border-[var(--ms-gold)]/45 group-hover:shadow-[inset_0_0_14px_rgba(198,165,90,0.16)]">
          <Icon className="h-4 w-4 text-[var(--ms-gold)]/75 transition-colors group-hover:text-[var(--ms-gold)]" />
        </div>
        <div className="min-w-0">
          <div className={`mb-1 flex items-baseline gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
            <span className="font-mono text-[9px] tracking-[0.2em] text-[var(--ms-gold)]/45">{principle.index}</span>
            <h3 className="font-serif text-[15px] font-medium leading-snug text-[#E8DCC0] transition-colors group-hover:text-[var(--ms-gold)]">
              {principle.title}
            </h3>
          </div>
          <p className="text-[13px] leading-relaxed text-white/55">{principle.desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

function Header({ inView, reduce }: { inView: boolean; reduce: boolean }) {
  return (
    <div className="text-center">
      <motion.p
        className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ms-gold)]/70"
        initial={{ opacity: 0, y: -8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: EASE }}
      >
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
      <motion.p
        className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/55"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
      >
        Every matter follows a structured sequence. Nothing moves out of order. Nothing skips a gate.
      </motion.p>
    </div>
  );
}

function CTARow({ inView }: { inView: boolean }) {
  return (
    <motion.div
      className="mt-14 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
    >
      <Link
        href="/intake"
        className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--ms-gold)] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#050507] transition-all duration-300 hover:bg-[#D4B76A] hover:shadow-[0_0_24px_rgba(198,165,90,0.4)] sm:w-auto"
      >
        Begin Secure Intake
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <Link
        href="/countries"
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-[var(--ms-gold)]/30 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ms-gold)]/85 transition-colors hover:border-[var(--ms-gold)]/60 hover:text-[var(--ms-gold)] sm:w-auto"
      >
        Explore Global Document Intelligence
        <ArrowRight className="h-3.5 w-3.5" />
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
    <section
      ref={ref}
      className="relative w-full overflow-hidden border-t border-[var(--ms-gold)]/12 bg-[#050506] py-16 px-4 sm:px-6 lg:px-8"
    >
      <Atmosphere y={hazeY} />

      <div className="relative mx-auto max-w-6xl">
        <Header inView={inView} reduce={reduce} />

        {/* Mobile: compact core, then clean vertical sequence */}
        <div className="mt-12 lg:hidden">
          <div className="mb-10 flex justify-center">
            <CenterCore inView={inView} reduce={reduce} compact />
          </div>
          <div className="flex flex-col gap-4">
            {[...LEFT_PRINCIPLES, ...RIGHT_PRINCIPLES].map((p, i) => (
              <PrincipleCard key={p.index} principle={p} align="left" inView={inView} reduce={reduce} index={i} />
            ))}
          </div>
        </div>

        {/* Desktop: spacious flanking layout around a large cinematic core */}
        <div className="mt-16 hidden lg:grid grid-cols-[1fr_300px_1fr] items-center gap-x-12">
          <div className="flex flex-col gap-8">
            {LEFT_PRINCIPLES.map((p, i) => (
              <PrincipleCard key={p.index} principle={p} align="left" inView={inView} reduce={reduce} index={i} />
            ))}
          </div>

          <motion.div className="relative flex items-center justify-center" style={{ height: 320, y: coreY }}>
            <Connectors inView={inView} reduce={reduce} />
            <CenterCore inView={inView} reduce={reduce} />
          </motion.div>

          <div className="flex flex-col gap-8">
            {RIGHT_PRINCIPLES.map((p, i) => (
              <PrincipleCard key={p.index} principle={p} align="right" inView={inView} reduce={reduce} index={i} />
            ))}
          </div>
        </div>

        <CTARow inView={inView} />
      </div>
    </section>
  );
}
