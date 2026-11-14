"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";
import {
  ArrowRight,
  FileInput,
  ShieldCheck,
  LockKeyhole,
  PenTool,
  Eye,
  Send,
  Scale,
  Globe2,
  CreditCard,
  PackageCheck,
  Stamp,
  Truck,
  MapPin,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;
const GOLD = "var(--ms-gold)";
const CREST = "/brand/milano-seal-orb-v2.png";

const PARTICLES = Array.from({ length: 26 }, (_, i) => ({
  size: i % 4 === 0 ? 2 : 1,
  opacity: 0.05 + (i % 4) * 0.03,
  left: 3 + ((i * 23 + i * i * 7) % 94),
  top: 3 + ((i * 13 + i * 11) % 94),
}));

const STAGES = [
  {
    number: "01",
    id: "intake",
    icon: FileInput,
    title: "Submit Your Matter",
    label: "Structured Intake Gate",
    body: "Your matter begins with structured intake so scope, document type, destination country, and signer requirements are captured correctly from the start.",
    bullets: ["Matter details and destination captured", "Document type and urgency reviewed", "Initial execution pathway prepared"],
    why: "Correct intake prevents downstream routing and document errors.",
  },
  {
    number: "02",
    id: "compliance-review",
    icon: ShieldCheck,
    title: "Compliance Review",
    label: "Jurisdiction & Route Determination",
    body: "Every matter is reviewed for jurisdiction, destination-country requirements, execution method, and document-readiness before scheduling or release planning begins.",
    bullets: ["Jurisdiction and destination route confirmed", "Translation / legalization needs reviewed", "Authority-specific requirements flagged"],
    why: "International acceptance depends on route accuracy before execution begins.",
  },
  {
    number: "03",
    id: "payment-gate",
    icon: LockKeyhole,
    title: "Payment-Gated Execution",
    label: "Scope & Payment Confirmation",
    body: "Execution does not begin until scope and payment are confirmed. This protects scheduling integrity, operator time, and delivery control.",
    bullets: ["Resources reserved only after confirmation", "Scheduling unlocked only after payment gate clears", "Matter enters controlled execution state"],
    why: "This preserves execution order and prevents unmanaged work.",
  },
  {
    number: "04",
    id: "execution",
    icon: PenTool,
    title: "Document Execution",
    label: "RON, Mobile Notary & Coordination",
    body: "Documents are executed through the correct pathway — RON, mobile notary, in-person signing, or supporting coordination — based on matter requirements.",
    bullets: ["Execution method matched to matter type", "Identity and signer requirements verified", "Packet structure reviewed before next stage"],
    why: "Execution errors create downstream apostille and acceptance failures.",
  },
  {
    number: "05",
    id: "custody",
    icon: Eye,
    title: "Chain-of-Custody Visibility",
    label: "Real-Time Status Through the Secure Portal",
    body: "Every custody movement is tracked from intake to release so the matter remains controlled, visible, and auditable.",
    bullets: ["Matter events are recorded", "Status is visible across the workflow", "Release does not occur outside the gate sequence"],
    why: "Clients need confidence that nothing moves without control.",
  },
  {
    number: "06",
    id: "release",
    icon: Send,
    title: "Structured International Release",
    label: "Apostille, Courier & Destination Delivery",
    body: "Final packets are coordinated for apostille, authentication, courier handling, and release based on the receiving country and authority pathway.",
    bullets: ["Final packet reviewed before release", "Courier and delivery controls applied", "International release aligned to destination route"],
    why: "Release is the final trust moment — it must be accurate and controlled.",
  },
];

const CONTROL_MATRIX = [
  { icon: Scale, title: "Scope Control", desc: "Locks document type, destination, signer count, urgency, and execution requirements." },
  { icon: Globe2, title: "Compliance Control", desc: "Reviews destination-country routing, apostille/authentication needs, and authority-specific requirements." },
  { icon: CreditCard, title: "Payment Control", desc: "Prevents unmanaged scheduling and protects operator time before execution begins." },
  { icon: PackageCheck, title: "Release Control", desc: "Final packets move only after payment, review, custody, and destination controls are satisfied." },
];

const RELEASE_FEATURES = [
  { icon: Stamp, label: "Apostille / authentication routing" },
  { icon: Truck, label: "Secure courier coordination" },
  { icon: Eye, label: "Custody visibility" },
  { icon: MapPin, label: "Destination-specific review" },
  { icon: PackageCheck, label: "Final packet control" },
  { icon: ShieldCheck, label: "Founder-level release discipline" },
];

function Atmosphere({ y }: { y: import("framer-motion").MotionValue<number> }) {
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ y }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 60% at 50% 0%, rgba(198,165,90,0.07) 0%, transparent 55%)" }} />
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          background: "linear-gradient(rgba(198,165,90,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(198,165,90,0.025) 1px, transparent 1px)",
          backgroundSize: "70px 70px, 70px 70px",
          maskImage: "radial-gradient(80% 70% at 50% 30%, black, transparent)",
          WebkitMaskImage: "radial-gradient(80% 70% at 50% 30%, black, transparent)",
        }}
      />
      {PARTICLES.map((p, i) => (
        <span key={i} className="absolute rounded-full bg-[var(--ms-gold)]" style={{ width: p.size, height: p.size, opacity: p.opacity, left: `${p.left}%`, top: `${p.top}%` }} />
      ))}
    </motion.div>
  );
}

function PrimaryCTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-lg px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a1206] transition-all duration-300 hover:shadow-[0_0_28px_rgba(198,165,90,0.45)]"
      style={{
        background: "linear-gradient(180deg, #ECD79A 0%, #D4B76A 46%, #C6A55A 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.25), 0 8px 22px rgba(198,165,90,0.25)",
      }}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden="true" />
      <span className="relative">{children}</span>
      <ArrowRight className="relative h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function SecondaryCTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[var(--ms-gold)]/35 bg-black/30 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ms-gold)]/85 transition-colors hover:border-[var(--ms-gold)]/60 hover:bg-[var(--ms-gold)]/[0.07] hover:text-[var(--ms-gold)]"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function Hero({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const chips = ["Payment-Gated Execution", "Chain-of-Custody Visibility", "International Release Control"];
  return (
    <div ref={ref} className="relative mx-auto max-w-4xl text-center">
      <motion.p className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em] text-[var(--ms-gold)]/70" initial={{ opacity: 0, y: -8 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, ease: EASE }}>
        How It Works
      </motion.p>
      <motion.h1
        className="font-serif text-4xl leading-tight text-white sm:text-5xl"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(8px)" }}
        animate={inView ? (reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }) : {}}
        transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
      >
        Structured execution.{" "}
        <span className="italic text-[var(--ms-gold)]">Controlled release.</span>
      </motion.h1>
      <motion.p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-white/60" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.7, delay: 0.24, ease: EASE }}>
        Every Milano Seal matter moves through a defined sequence — from intake and compliance review to payment-gated execution, apostille coordination, custody visibility, and final international release.
      </motion.p>
      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        {chips.map((c, i) => (
          <motion.span
            key={c}
            className="rounded-full border border-[var(--ms-gold)]/25 bg-[var(--ms-gold)]/[0.05] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ms-gold)]/80"
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.36 + i * 0.1, ease: EASE }}
          >
            {c}
          </motion.span>
        ))}
      </div>
      <motion.div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.6, ease: EASE }}>
        <PrimaryCTA href="/intake">Begin Secure Intake</PrimaryCTA>
        <SecondaryCTA href="/countries">Explore Global Document Intelligence</SecondaryCTA>
      </motion.div>
    </div>
  );
}

function StageRow({ stage, reduce, index }: { stage: (typeof STAGES)[number]; reduce: boolean; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const Icon = stage.icon;
  return (
    <div id={stage.id} ref={ref} style={{ scrollMarginTop: "calc(var(--header-total-height) + 2rem)" }} className="relative grid grid-cols-[44px_1fr] gap-5 sm:gap-7">
      {/* spine node */}
      <div className="relative flex flex-col items-center">
        <motion.div
          className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border font-mono text-[12px] font-bold"
          style={{ borderColor: "rgba(198,165,90,0.5)", background: "radial-gradient(circle, rgba(198,165,90,0.14), rgba(6,6,8,0.95))", color: GOLD }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
        >
          {stage.number}
          {!reduce && inView && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ border: "1px solid rgba(198,165,90,0.5)" }}
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.7 }}
              transition={{ duration: 1.4, ease: EASE }}
            />
          )}
        </motion.div>
      </div>

      {/* card */}
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24, filter: "blur(8px)" }}
        animate={inView ? (reduce ? { opacity: 1 } : { opacity: 1, x: 0, filter: "blur(0px)" }) : {}}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
        whileHover={reduce ? undefined : { y: -2 }}
        className="group relative mb-8 rounded-2xl p-[1px]"
        style={{ background: "linear-gradient(150deg, rgba(198,165,90,0.45) 0%, rgba(198,165,90,0.08) 40%, rgba(198,165,90,0.18) 100%)" }}
      >
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-7"
          style={{ background: "linear-gradient(180deg, rgba(12,12,14,0.94), rgba(7,7,8,0.9))", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: "radial-gradient(120% 100% at 0% 0%, rgba(198,165,90,0.08), transparent 50%)" }} />
          <div className="relative">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ms-gold)]/25 transition-all duration-300 group-hover:border-[var(--ms-gold)]/50 group-hover:shadow-[inset_0_0_14px_rgba(198,165,90,0.18)]">
                <Icon className="h-4.5 w-4.5 text-[var(--ms-gold)]/80 transition-colors group-hover:text-[var(--ms-gold)]" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h3 className="font-serif text-xl text-white">{stage.title}</h3>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--ms-gold)]/60">{stage.label}</p>
              </div>
            </div>
            <p className="text-[13.5px] leading-relaxed text-white/60">{stage.body}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {stage.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[12.5px] leading-snug text-white/55">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--ms-gold)]/70" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-5 border-t border-[var(--ms-gold)]/10 pt-3">
              <p className="text-[12px] italic leading-snug text-[var(--ms-gold)]/55">
                <span className="font-mono not-italic uppercase tracking-[0.14em] text-[var(--ms-gold)]/45">Why this matters — </span>
                {stage.why}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ExecutionSequence({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <div ref={ref} className="relative mx-auto max-w-3xl">
      {/* animated route spine behind the number nodes */}
      <div aria-hidden="true" className="absolute left-[22px] top-6 bottom-6 w-px bg-[var(--ms-gold)]/12" />
      <motion.div
        aria-hidden="true"
        className="absolute left-[22px] top-6 w-px origin-top bg-gradient-to-b from-[var(--ms-gold)]/70 to-[var(--ms-gold)]/20"
        style={{ bottom: 24, scaleY: reduce ? 1 : lineScale }}
      />
      <div className="relative">
        {STAGES.map((s, i) => (
          <StageRow key={s.number} stage={s} reduce={reduce} index={i} />
        ))}
      </div>
    </div>
  );
}

function ControlMatrix({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="relative mx-auto max-w-5xl">
      <div className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ms-gold)]/65">The Operating Layer</div>
      <h2 className="text-center font-serif text-3xl text-white">The control layer behind every matter</h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-white/58">
        Milano Seal does not treat international document execution as a one-step signing request. Each matter is routed through a control layer that checks scope, jurisdiction, payment readiness, execution path, custody status, and release conditions before the packet moves forward.
      </p>
      <div className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* gold scan line */}
        {!reduce && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-24"
            style={{ background: "linear-gradient(90deg, transparent, rgba(198,165,90,0.08), transparent)" }}
            initial={{ left: "-10%", opacity: 0 }}
            animate={inView ? { left: "100%", opacity: [0, 1, 0] } : {}}
            transition={{ duration: 2.4, delay: 0.4, ease: "easeInOut" }}
          />
        )}
        {CONTROL_MATRIX.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.title}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: "blur(6px)" }}
              animate={inView ? (reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }) : {}}
              transition={{ duration: 0.55, delay: 0.1 + i * 0.1, ease: EASE }}
              whileHover={reduce ? undefined : { y: -2 }}
              className="group relative rounded-2xl border border-[var(--ms-gold)]/18 p-5 transition-colors hover:border-[var(--ms-gold)]/38"
              style={{ background: "rgba(9,9,11,0.7)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ms-gold)]/25 group-hover:border-[var(--ms-gold)]/50">
                <Icon className="h-4 w-4 text-[var(--ms-gold)]/80 group-hover:text-[var(--ms-gold)]" />
              </div>
              <h3 className="font-serif text-[16px] text-[#E8DCC0]">{c.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">{c.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ReleasePanel({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const spin = reduce ? {} : { animate: { rotate: 360 }, transition: { duration: 100, repeat: Infinity, ease: "linear" as const } };
  return (
    <div ref={ref} className="relative mx-auto max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative overflow-hidden rounded-3xl border border-[var(--ms-gold)]/20 p-8 sm:p-12"
        style={{ background: "linear-gradient(180deg, rgba(10,10,12,0.92), rgba(6,6,8,0.95))", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}
      >
        {/* faint map grid + route arcs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "linear-gradient(rgba(198,165,90,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(198,165,90,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px, 48px 48px", maskImage: "radial-gradient(70% 80% at 70% 50%, black, transparent)", WebkitMaskImage: "radial-gradient(70% 80% at 70% 50%, black, transparent)" }} />
        <svg aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-70" viewBox="0 0 400 300" fill="none" preserveAspectRatio="xMidYMid slice">
          {[[60, 230, 320, 70], [60, 230, 350, 150], [60, 230, 300, 210]].map(([x1, y1, x2, y2], i) => (
            <motion.path
              key={i}
              d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - 60} ${x2} ${y2}`}
              stroke={GOLD}
              strokeWidth="1"
              strokeOpacity="0.35"
              initial={reduce ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
              animate={inView ? (reduce ? { opacity: 0.35 } : { pathLength: 1, opacity: 0.35 }) : {}}
              transition={{ duration: 1.3, delay: 0.4 + i * 0.2, ease: EASE }}
            />
          ))}
          {[[320, 70], [350, 150], [300, 210]].map(([cx, cy], i) => (
            <motion.circle key={i} cx={cx} cy={cy} r="3.5" fill={GOLD} initial={{ opacity: 0 }} animate={inView ? { opacity: 0.7 } : {}} transition={{ duration: 0.4, delay: 1.4 + i * 0.15 }} style={{ filter: "drop-shadow(0 0 5px rgba(198,165,90,0.7))" }} />
          ))}
          <circle cx="60" cy="230" r="4" fill={GOLD} />
        </svg>

        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ms-gold)]/65">International Release</div>
            <h2 className="font-serif text-3xl leading-tight text-white">Built for controlled international delivery</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60">
              Final release is not treated as an afterthought. Milano Seal coordinates the release stage around destination requirements, custody visibility, courier controls, and final packet readiness.
            </p>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {RELEASE_FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.label}
                    className="flex items-center gap-2.5 rounded-lg border border-[var(--ms-gold)]/12 bg-white/[0.015] px-3 py-2.5"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, x: -10 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.08, ease: EASE }}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--ms-gold)]/75" />
                    <span className="text-[12.5px] text-white/65">{f.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* central seal glow */}
          <div className="relative hidden items-center justify-center lg:flex" style={{ minHeight: 220 }}>
            <motion.div className="absolute rounded-full" style={{ width: 200, height: 200, background: "radial-gradient(circle, rgba(198,165,90,0.14), transparent 70%)", filter: "blur(16px)" }} initial={{ opacity: 0 }} animate={inView ? { opacity: reduce ? 0.7 : [0, 0.9, 0.7] } : {}} transition={{ duration: 2.2, ease: EASE }} />
            <motion.div className="absolute w-[180px] h-[180px] rounded-full" style={{ border: "1px solid rgba(198,165,90,0.16)" }} {...spin} />
            <div className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full border border-[var(--ms-gold)]/40" style={{ background: "radial-gradient(circle, rgba(198,165,90,0.12), rgba(6,6,8,0.96) 72%)", boxShadow: "0 0 40px rgba(198,165,90,0.16)" }}>
              <Image src={CREST} alt="The Milano Seal crest" width={92} height={92} style={{ filter: "drop-shadow(0 0 14px rgba(198,165,90,0.4))" }} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FinalCTA({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className="relative mx-auto max-w-3xl text-center"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <h2 className="font-serif text-3xl text-white sm:text-4xl">Start the correct pathway now</h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60">
        Begin secure intake and let Milano Seal determine the correct execution, review, and release route for your matter.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <PrimaryCTA href="/intake">Begin Secure Intake</PrimaryCTA>
        <SecondaryCTA href="/countries">Explore Countries</SecondaryCTA>
      </div>
    </motion.div>
  );
}

export function ProcessExperience() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useMilanoReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const hazeY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-30, 30]);

  useEffect(() => {
    let frame = 0;
    const scrollToStage = () => {
      const anchor = window.location.hash.slice(1);
      if (!STAGES.some((stage) => stage.id === anchor)) return;
      cancelAnimationFrame(frame);
      // Reapply the initial fragment after hydration/router scroll restoration.
      // Merely adding an ID leaves a first-load mobile deep link at scroll 0.
      frame = requestAnimationFrame(() => {
        document.getElementById(anchor)?.scrollIntoView({ block: "start", behavior: "instant" });
      });
    };
    scrollToStage();
    window.addEventListener("hashchange", scrollToStage);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", scrollToStage);
    };
  }, []);


  return (
    <div ref={ref} className="relative overflow-hidden bg-[#050506]">
      <Atmosphere y={hazeY} />
      <div className="relative px-4 sm:px-6 lg:px-8">
        <section className="pt-20 pb-16 sm:pt-24">
          <Hero reduce={reduce} />
        </section>
        <section className="py-12">
          <ExecutionSequence reduce={reduce} />
        </section>
        <section className="py-16">
          <ControlMatrix reduce={reduce} />
        </section>
        <section className="py-16">
          <ReleasePanel reduce={reduce} />
        </section>
        <section className="py-20">
          <FinalCTA reduce={reduce} />
        </section>
      </div>
    </div>
  );
}
