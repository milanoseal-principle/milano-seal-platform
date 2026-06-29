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

// Six Anchors of deterministic execution. Each card carries a numbered badge and
// is positioned around the central Milano seal core on the desktop diagram, and
// stacked cleanly on mobile. `cell` drives the desktop grid placement.
const ANCHORS = [
  {
    number: 1,
    title: "Secure Intake",
    desc: "Matter verified and encrypted from the start.",
    icon: ShieldCheck,
    cell: { gridColumn: "2", gridRow: "1" },
    node: { x: 500, y: 70 },
  },
  {
    number: 2,
    title: "Global Document Intelligence",
    desc: "We analyze, classify, and validate every document globally.",
    icon: Globe2,
    cell: { gridColumn: "1", gridRow: "2" },
    node: { x: 170, y: 250 },
  },
  {
    number: 3,
    title: "Payment-Gated Scheduling",
    desc: "Execution only begins after payment is secured.",
    icon: LockKeyhole,
    cell: { gridColumn: "3", gridRow: "2" },
    node: { x: 830, y: 250 },
  },
  {
    number: 4,
    title: "Chain-of-Custody Visibility",
    desc: "Real-time audit trail from intake to international release.",
    icon: GitBranch,
    cell: { gridColumn: "1", gridRow: "3" },
    node: { x: 170, y: 470 },
  },
  {
    number: 5,
    title: "Apostille Coordination",
    desc: "We coordinate with authorities and verify every requirement.",
    icon: Stamp,
    cell: { gridColumn: "3", gridRow: "3" },
    node: { x: 830, y: 470 },
  },
  {
    number: 6,
    title: "International Release",
    desc: "Documents released worldwide with full compliance.",
    icon: Send,
    cell: { gridColumn: "2", gridRow: "4" },
    node: { x: 500, y: 650 },
  },
] as const;

// Deterministic ambient field — stable across server/client render (no Math.random).
const PARTICLES = Array.from({ length: 26 }, (_, i) => ({
  size: i % 4 === 0 ? 2 : 1,
  opacity: 0.05 + (i % 4) * 0.03,
  left: 3 + ((i * 19 + i * i * 5) % 94),
  top: 4 + ((i * 11 + i * 9) % 90),
}));

function Atmosphere({ y }: { y: import("framer-motion").MotionValue<number> }) {
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ y }}>
      {/* faint world-map / depth gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 70% at 50% 45%, rgba(198,165,90,0.06) 0%, transparent 58%), radial-gradient(90% 60% at 50% 120%, rgba(198,165,90,0.04) 0%, transparent 60%)",
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

function CenterSealCore({ inView, reduce }: { inView: boolean; reduce: boolean }) {
  const spin = reduce
    ? {}
    : { animate: { rotate: 360 }, transition: { duration: 80, repeat: Infinity, ease: "linear" as const } };
  const spinRev = reduce
    ? {}
    : { animate: { rotate: -360 }, transition: { duration: 120, repeat: Infinity, ease: "linear" as const } };

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: 150, height: 150 }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
    >
      {/* radial glow — one pulse then breathe */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 220, height: 220, background: "radial-gradient(circle, rgba(198,165,90,0.16) 0%, transparent 70%)", filter: "blur(14px)" }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={inView ? (reduce ? { opacity: 0.7 } : { opacity: [0, 0.95, 0.65, 0.72], scale: [0.9, 1.05, 1, 1.01] }) : {}}
        transition={{ duration: 2.4, ease: EASE, times: [0, 0.35, 0.7, 1] }}
      />
      {/* rotating outer ring */}
      <motion.div className="absolute w-[140px] h-[140px] rounded-full" style={{ border: "1px solid rgba(198,165,90,0.16)" }} {...spin} />
      <motion.div className="absolute w-[112px] h-[112px] rounded-full" style={{ border: "1px solid rgba(198,165,90,0.26)" }} {...spinRev} />
      {/* compass crosshair */}
      <div aria-hidden="true" className="absolute w-[140px] h-[140px]">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2" style={{ background: "linear-gradient(to bottom, transparent, rgba(198,165,90,0.18), transparent)" }} />
        <div className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2" style={{ background: "linear-gradient(to right, transparent, rgba(198,165,90,0.18), transparent)" }} />
      </div>
      {/* core medallion */}
      <div
        className="relative w-[84px] h-[84px] rounded-full border border-[var(--ms-gold)]/45 flex items-center justify-center"
        style={{
          background: "radial-gradient(circle, rgba(198,165,90,0.16) 0%, rgba(6,6,8,0.97) 70%)",
          boxShadow: "0 0 40px rgba(198,165,90,0.16), inset 0 0 20px rgba(198,165,90,0.07)",
        }}
      >
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,245,220,0.18) 0%, transparent 42%)" }} />
        <span className="relative font-serif text-[var(--ms-gold)] text-3xl font-medium leading-none select-none" style={{ textShadow: "0 0 26px rgba(198,165,90,0.5)" }}>
          M
        </span>
      </div>
    </motion.div>
  );
}

function ConnectorSystem({ inView, reduce }: { inView: boolean; reduce: boolean }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 720" preserveAspectRatio="none" aria-hidden="true">
      {ANCHORS.map((a, i) => (
        <motion.line
          key={a.number}
          x1={500}
          y1={360}
          x2={a.node.x}
          y2={a.node.y}
          stroke="var(--ms-gold)"
          strokeWidth="1"
          strokeOpacity="0.22"
          strokeDasharray="600"
          initial={reduce ? { opacity: 0 } : { strokeDashoffset: 600, opacity: 0 }}
          animate={inView ? (reduce ? { opacity: 0.22 } : { strokeDashoffset: 0, opacity: 0.22 }) : {}}
          transition={{ duration: reduce ? 0.4 : 1.1, delay: 0.5 + i * 0.1, ease: EASE }}
        />
      ))}
      {ANCHORS.map((a, i) => (
        <motion.circle
          key={`n${a.number}`}
          cx={a.node.x}
          cy={a.node.y}
          r="3"
          fill="var(--ms-gold)"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 0.4 } : {}}
          transition={{ duration: 0.4, delay: 1.3 + i * 0.08 }}
        />
      ))}
    </svg>
  );
}

function AnchorCard({
  anchor,
  inView,
  reduce,
  index,
  style,
}: {
  anchor: (typeof ANCHORS)[number];
  inView: boolean;
  reduce: boolean;
  index: number;
  style?: React.CSSProperties;
}) {
  const Icon = anchor.icon;
  return (
    <motion.div
      style={style}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, filter: "blur(8px)" }}
      animate={inView ? (reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }) : {}}
      transition={{ duration: 0.6, delay: 0.15 + index * 0.1, ease: EASE }}
      whileHover={reduce ? undefined : { y: -2 }}
      className="group relative rounded-xl border p-4 transition-colors duration-300"
    >
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          border: "1px solid rgba(198,165,90,0.42)",
          background: "rgba(7,7,8,0.72)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          boxShadow: "0 14px 40px rgba(0,0,0,0.5), inset 0 0 22px rgba(198,165,90,0.03)",
        }}
      />
      <div className="relative flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--ms-gold)]/45 font-mono text-[11px] text-[var(--ms-gold)] transition-shadow duration-300 group-hover:shadow-[0_0_14px_rgba(198,165,90,0.4)]">
          {anchor.number.toString().padStart(2, "0")}
        </div>
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-[var(--ms-gold)]/70 transition-colors group-hover:text-[var(--ms-gold)]" />
            <h3 className="font-serif text-[14px] font-medium leading-snug text-[#E8DCC0]">{anchor.title}</h3>
          </div>
          <p className="text-[12px] leading-relaxed text-white/60">{anchor.desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function MilanoTrustCore() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const hazeY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-18, 18]);

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden border-t border-[var(--ms-gold)]/15 bg-[#050506] py-14 px-4 sm:px-6 lg:px-8"
    >
      <Atmosphere y={hazeY} />

      <div className="relative mx-auto max-w-5xl">
        {/* Eyebrow */}
        <motion.p
          className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70"
          initial={{ opacity: 0, y: -8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
        >
          ◆ Platform Principles ◆
        </motion.p>
        {/* Headline */}
        <motion.h2
          className="text-center font-serif text-3xl leading-tight text-white sm:text-4xl"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(6px)" }}
          animate={inView ? (reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }) : {}}
          transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
        >
          Six Anchors of{" "}
          <em className="italic text-[var(--ms-gold)]">deterministic execution.</em>
        </motion.h2>
        {/* Subtext */}
        <motion.p
          className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-white/62"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
        >
          Every matter follows a structured sequence. Nothing moves out of order. Nothing skips a gate.
        </motion.p>

        {/* Mobile: core then stacked numbered cards */}
        <div className="mt-10 lg:hidden">
          <div className="mb-8 flex justify-center">
            <CenterSealCore inView={inView} reduce={reduce} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ANCHORS.map((a, i) => (
              <AnchorCard key={a.number} anchor={a} inView={inView} reduce={reduce} index={i} />
            ))}
          </div>
        </div>

        {/* Desktop: six-anchor diagram around the central core */}
        <div className="relative mt-12 hidden lg:block">
          <ConnectorSystem inView={inView} reduce={reduce} />
          <div
            className="relative grid items-center gap-x-10 gap-y-6"
            style={{ gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "auto auto auto auto" }}
          >
            {ANCHORS.map((a, i) => (
              <AnchorCard
                key={a.number}
                anchor={a}
                inView={inView}
                reduce={reduce}
                index={i}
                style={{ gridColumn: a.cell.gridColumn, gridRow: a.cell.gridRow, maxWidth: 320 }}
              />
            ))}
            {/* Center core spans the two middle rows in the center column */}
            <div className="flex items-center justify-center" style={{ gridColumn: "2", gridRow: "2 / span 2" }}>
              <CenterSealCore inView={inView} reduce={reduce} />
            </div>
          </div>
        </div>

        {/* CTA stack */}
        <motion.div
          className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
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
      </div>
    </section>
  );
}
