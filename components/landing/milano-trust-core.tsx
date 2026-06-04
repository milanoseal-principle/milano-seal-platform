"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Shield, Globe2, LockKeyhole, Eye, FileCheck, Send } from "lucide-react";

/* ─────────────────────────────────────────────────────── */
/* Principles                                              */
/* ─────────────────────────────────────────────────────── */

const PRINCIPLES = [
  {
    id: "secure-intake",
    side: "left" as const,
    icon: Shield,
    title: "Secure Intake",
    description: "Verified identity & document stage.",
    href: "/intake",
  },
  {
    id: "global-intelligence",
    side: "left" as const,
    icon: Globe2,
    title: "Global Document Intelligence",
    description: "Destination rules, forms & authority requirements.",
    href: "/countries",
  },
  {
    id: "payment-gated",
    side: "left" as const,
    icon: LockKeyhole,
    title: "Payment-Gated Scheduling",
    description: "No scheduling until scope & payment are confirmed.",
    href: "/process",
  },
  {
    id: "chain-custody",
    side: "right" as const,
    icon: Eye,
    title: "Chain-of-Custody Visibility",
    description: "Track every step from intake to release.",
    href: "/process",
  },
  {
    id: "apostille",
    side: "right" as const,
    icon: FileCheck,
    title: "Apostille Coordination",
    description: "Accredited routing for Hague Convention and legalization.",
    href: "/services",
  },
  {
    id: "international-release",
    side: "right" as const,
    icon: Send,
    title: "International Release",
    description: "Secure release through approved methods and partners.",
    href: "/services",
  },
];

const LEFT = PRINCIPLES.filter((p) => p.side === "left");
const RIGHT = PRINCIPLES.filter((p) => p.side === "right");
const EASE = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────── */
/* SVG connector geometry                                   */
/* SVG viewBox = "0 0 1000 340"                            */
/* Crest center: (500, 170)                                */
/* Left card icon centers: x=24, y=112/185/258            */
/* Right card icon centers: x=976, y=112/185/258           */
/* ─────────────────────────────────────────────────────── */

const CX = 500;
const CY = 170;
const CREST_R = 68; // inner ring edge radius in SVG units

function crestEdge(tx: number, ty: number): [number, number] {
  const dx = tx - CX;
  const dy = ty - CY;
  const len = Math.sqrt(dx * dx + dy * dy);
  return [CX + (dx / len) * CREST_R, CY + (dy / len) * CREST_R];
}

const L_X = 24;
const R_X = 976;
const CARD_Y = [112, 185, 258];

/* ─────────────────────────────────────────────────────── */
/* Component                                               */
/* ─────────────────────────────────────────────────────── */

export function MilanoTrustCore() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [active, setActive] = useState<string | null>(null);

  return (
    <section
      ref={ref}
      className="w-full relative"
      style={{
        background: "linear-gradient(180deg, #050507 0%, #08090D 55%, #060608 100%)",
        borderTop: "1px solid rgba(197,160,89,0.12)",
        borderBottom: "1px solid rgba(197,160,89,0.12)",
      }}
    >
      {/* ── CSS keyframes ── */}
      <style>{`
        @keyframes tc-breathe {
          0%,100% {
            box-shadow: 0 0 48px rgba(198,165,90,0.11),
                        inset 0 0 28px rgba(198,165,90,0.05);
          }
          50% {
            box-shadow: 0 0 80px rgba(198,165,90,0.22),
                        inset 0 0 44px rgba(198,165,90,0.10);
          }
        }
        @keyframes tc-orbit-drift {
          0%,100% { transform:rotate(0deg); }
          50%     { transform:rotate(2.5deg); }
        }
        .tc-crest { animation: tc-breathe 4.5s ease-in-out infinite; }
        .tc-orbit { animation: tc-orbit-drift 14s ease-in-out infinite; }
        @media (prefers-reduced-motion:reduce) {
          .tc-crest, .tc-orbit { animation:none !important; }
          .tc-conn { transition:none !important; }
        }
      `}</style>

      {/* ════════════════════════════════════════════════ */}
      {/* MOBILE                                          */}
      {/* ════════════════════════════════════════════════ */}
      <div className="lg:hidden px-5 py-12">
        <div className="flex flex-col items-center text-center mb-8">
          <p
            className="font-mono text-[9px] tracking-[0.35em] uppercase mb-2"
            style={{ color: "rgba(197,160,89,0.6)" }}
          >
            Our Platform Principles
          </p>
          <h2
            className="font-serif text-2xl font-light mb-2"
            style={{ color: "#F5F1E8" }}
          >
            Milano Trust Core
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: "#5A5A5A", maxWidth: 280 }}>
            Six pillars of deterministic execution for international document success.
          </p>
        </div>

        {/* Small crest */}
        <div className="flex justify-center mb-8">
          <div
            className="tc-crest w-20 h-20 rounded-full border flex items-center justify-center"
            style={{
              borderColor: "rgba(197,160,89,0.4)",
              background: "radial-gradient(circle, rgba(198,165,90,0.14) 0%, rgba(6,6,8,0.98) 70%)",
            }}
          >
            <span
              className="font-serif font-light select-none"
              style={{ fontSize: 42, color: "#C5A059", textShadow: "0 0 24px rgba(198,165,90,0.55)", lineHeight: 1 }}
            >
              M
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PRINCIPLES.map((p) => {
            const Icon = p.icon;
            return (
              <Link key={p.id} href={p.href} className="flex items-start gap-3 group">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                  style={{
                    background: "rgba(197,160,89,0.06)",
                    border: "1px solid rgba(197,160,89,0.28)",
                  }}
                >
                  <Icon size={15} style={{ color: "#C5A059" }} />
                </div>
                <div>
                  <h3
                    className="text-[13px] font-medium mb-0.5 group-hover:text-[#C5A059] transition-colors"
                    style={{ color: "#F5F1E8" }}
                  >
                    {p.title}
                  </h3>
                  <p className="text-[11px] leading-snug" style={{ color: "#5A5A5A" }}>
                    {p.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════ */}
      {/* TABLET  (md only)                               */}
      {/* ════════════════════════════════════════════════ */}
      <div className="hidden md:block lg:hidden px-6 py-12">
        <div className="text-center mb-8">
          <p className="font-mono text-[9px] tracking-[0.35em] uppercase mb-2" style={{ color: "rgba(197,160,89,0.6)" }}>
            Our Platform Principles
          </p>
          <h2 className="font-serif text-2xl font-light mb-1" style={{ color: "#F5F1E8" }}>
            Milano Trust Core
          </h2>
          <p className="text-xs" style={{ color: "#5A5A5A" }}>
            Six pillars of deterministic execution for international document success.
          </p>
        </div>
        <div className="flex justify-center mb-8">
          <div
            className="tc-crest w-24 h-24 rounded-full border flex items-center justify-center"
            style={{
              borderColor: "rgba(197,160,89,0.4)",
              background: "radial-gradient(circle, rgba(198,165,90,0.14) 0%, rgba(6,6,8,0.98) 70%)",
            }}
          >
            <span className="font-serif font-light select-none" style={{ fontSize: 48, color: "#C5A059", textShadow: "0 0 28px rgba(198,165,90,0.55)", lineHeight: 1 }}>
              M
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {PRINCIPLES.map((p) => {
            const Icon = p.icon;
            return (
              <Link key={p.id} href={p.href} className="flex items-start gap-3 group">
                <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "rgba(197,160,89,0.06)", border: "1px solid rgba(197,160,89,0.28)" }}>
                  <Icon size={15} style={{ color: "#C5A059" }} />
                </div>
                <div>
                  <h3 className="text-[13px] font-medium mb-0.5 group-hover:text-[#C5A059] transition-colors" style={{ color: "#F5F1E8" }}>{p.title}</h3>
                  <p className="text-[11px] leading-snug" style={{ color: "#5A5A5A" }}>{p.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════ */}
      {/* DESKTOP                                         */}
      {/* ════════════════════════════════════════════════ */}
      <div
        className="hidden lg:block relative"
        style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 32px" }}
      >
        {/* Full-width SVG connector overlay */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1,
            overflow: "visible",
          }}
          viewBox="0 0 1000 340"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            {/* Left gradients */}
            {LEFT.map((p) => (
              <linearGradient key={`gl-${p.id}`} id={`gl-${p.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#C6A55A" stopOpacity="0" />
                <stop offset="30%"  stopColor="#C6A55A" stopOpacity={active === p.id ? 0.55 : 0.28} />
                <stop offset="100%" stopColor="#C6A55A" stopOpacity={active === p.id ? 0.65 : 0.38} />
              </linearGradient>
            ))}
            {/* Right gradients */}
            {RIGHT.map((p) => (
              <linearGradient key={`gr-${p.id}`} id={`gr-${p.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#C6A55A" stopOpacity={active === p.id ? 0.65 : 0.38} />
                <stop offset="70%"  stopColor="#C6A55A" stopOpacity={active === p.id ? 0.55 : 0.28} />
                <stop offset="100%" stopColor="#C6A55A" stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Left connectors */}
          {LEFT.map((p, i) => {
            const [ex, ey] = crestEdge(L_X, CARD_Y[i]);
            const isActive = active === p.id;
            return (
              <motion.path
                key={p.id}
                d={`M ${L_X} ${CARD_Y[i]} L ${ex} ${ey}`}
                stroke={`url(#gl-${p.id})`}
                strokeWidth={isActive ? 1.5 : 1}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 0.9, delay: 0.45 + i * 0.09, ease: EASE }}
                className="tc-conn"
              />
            );
          })}

          {/* Right connectors */}
          {RIGHT.map((p, i) => {
            const [ex, ey] = crestEdge(R_X, CARD_Y[i]);
            const isActive = active === p.id;
            return (
              <motion.path
                key={p.id}
                d={`M ${ex} ${ey} L ${R_X} ${CARD_Y[i]}`}
                stroke={`url(#gr-${p.id})`}
                strokeWidth={isActive ? 1.5 : 1}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 0.9, delay: 0.45 + i * 0.09, ease: EASE }}
                className="tc-conn"
              />
            );
          })}

          {/* Node dots at card ends */}
          {LEFT.map((p, i) => (
            <motion.circle
              key={`ld-${p.id}`}
              cx={L_X} cy={CARD_Y[i]} r="2.5"
              fill="#C6A55A"
              fillOpacity={active === p.id ? 0.75 : 0.35}
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.65 + i * 0.09, duration: 0.3 }}
            />
          ))}
          {RIGHT.map((p, i) => (
            <motion.circle
              key={`rd-${p.id}`}
              cx={R_X} cy={CARD_Y[i]} r="2.5"
              fill="#C6A55A"
              fillOpacity={active === p.id ? 0.75 : 0.35}
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.65 + i * 0.09, duration: 0.3 }}
            />
          ))}
        </svg>

        {/* Three-column grid */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "grid",
            gridTemplateColumns: "34% 32% 34%",
            alignItems: "center",
            minHeight: 300,
          }}
        >
          {/* ── LEFT COLUMN ── */}
          <div style={{ paddingRight: 40, display: "flex", flexDirection: "column" }}>
            {/* Title block */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE }}
              style={{ marginBottom: 28 }}
            >
              <p
                style={{
                  fontFamily: "var(--font-geist-mono, monospace)",
                  fontSize: 9,
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "rgba(197,160,89,0.6)",
                  margin: "0 0 8px",
                }}
              >
                Our Platform Principles
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontSize: 26,
                  fontWeight: 400,
                  color: "#F5F1E8",
                  margin: "0 0 8px",
                  lineHeight: 1.2,
                }}
              >
                Milano Trust Core
              </h2>
              <p style={{ fontSize: 11, color: "#5A5A5A", lineHeight: 1.6, margin: 0, maxWidth: 210 }}>
                Six pillars of deterministic execution for international document success.
              </p>
            </motion.div>

            {/* Left principle cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {LEFT.map((p, i) => {
                const Icon = p.icon;
                const isActive = active === p.id;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -14 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.18 + i * 0.08, ease: EASE }}
                    onMouseEnter={() => setActive(p.id)}
                    onMouseLeave={() => setActive(null)}
                    style={{
                      transform: isActive ? "translateY(-2px)" : "translateY(0)",
                      transition: "transform 0.2s ease",
                    }}
                  >
                    <Link href={p.href} style={{ display: "flex", alignItems: "flex-start", gap: 10, textDecoration: "none" }}>
                      <div
                        style={{
                          flexShrink: 0,
                          width: 30,
                          height: 30,
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(197,160,89,0.06)",
                          border: `1px solid ${isActive ? "rgba(197,160,89,0.5)" : "rgba(197,160,89,0.28)"}`,
                          boxShadow: isActive ? "0 0 14px rgba(197,160,89,0.18)" : "none",
                          transition: "border-color 0.2s, box-shadow 0.2s",
                        }}
                      >
                        <Icon size={14} style={{ color: isActive ? "#D4AF37" : "#C5A059" }} />
                      </div>
                      <div>
                        <h3
                          style={{
                            fontSize: 12.5,
                            fontWeight: 500,
                            color: isActive ? "#C5A059" : "#F5F1E8",
                            margin: "0 0 3px",
                            lineHeight: 1.3,
                            transition: "color 0.2s",
                          }}
                        >
                          {p.title}
                        </h3>
                        <p style={{ fontSize: 11, color: "#575757", lineHeight: 1.5, margin: 0 }}>
                          {p.description}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── CENTER COLUMN — medallion ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              height: 310,
            }}
          >
            {/* Radial ambient glow */}
            <div
              style={{
                position: "absolute",
                width: 320,
                height: 320,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(198,165,90,0.09) 0%, transparent 66%)",
                filter: "blur(24px)",
                pointerEvents: "none",
              }}
            />

            {/* Orbit rings */}
            <div
              className="tc-orbit absolute rounded-full"
              style={{ width: 280, height: 280, border: "1px solid rgba(197,160,89,0.055)" }}
            />
            <div
              className="absolute rounded-full"
              style={{ width: 228, height: 228, border: "1px solid rgba(197,160,89,0.085)" }}
            />
            <div
              className="absolute rounded-full"
              style={{ width: 180, height: 180, border: "1px solid rgba(197,160,89,0.13)" }}
            />

            {/* Core medallion */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.85, delay: 0.08, ease: EASE }}
              className="tc-crest"
              style={{
                position: "relative",
                width: 148,
                height: 148,
                borderRadius: "50%",
                border: "1px solid rgba(197,160,89,0.48)",
                background: "radial-gradient(circle, rgba(198,165,90,0.15) 0%, rgba(6,6,8,0.98) 72%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontSize: 62,
                  fontWeight: 400,
                  color: "#C5A059",
                  textShadow: "0 0 40px rgba(198,165,90,0.6)",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                M
              </span>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div
            style={{
              paddingLeft: 40,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {RIGHT.map((p, i) => {
              const Icon = p.icon;
              const isActive = active === p.id;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: 14 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.22 + i * 0.08, ease: EASE }}
                  onMouseEnter={() => setActive(p.id)}
                  onMouseLeave={() => setActive(null)}
                  style={{
                    transform: isActive ? "translateY(-2px)" : "translateY(0)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <Link href={p.href} style={{ display: "flex", alignItems: "flex-start", gap: 10, textDecoration: "none" }}>
                    <div
                      style={{
                        flexShrink: 0,
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(197,160,89,0.06)",
                        border: `1px solid ${isActive ? "rgba(197,160,89,0.5)" : "rgba(197,160,89,0.28)"}`,
                        boxShadow: isActive ? "0 0 14px rgba(197,160,89,0.18)" : "none",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                    >
                      <Icon size={14} style={{ color: isActive ? "#D4AF37" : "#C5A059" }} />
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: 12.5,
                          fontWeight: 500,
                          color: isActive ? "#C5A059" : "#F5F1E8",
                          margin: "0 0 3px",
                          lineHeight: 1.3,
                          transition: "color 0.2s",
                        }}
                      >
                        {p.title}
                      </h3>
                      <p style={{ fontSize: 11, color: "#575757", lineHeight: 1.5, margin: 0 }}>
                        {p.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
