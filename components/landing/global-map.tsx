"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DESTINATIONS } from "@/data/destinations";

const GlobalIntelMapInteractive = dynamic(
  () =>
    import("@/components/landing/global-intel-map-interactive").then(
      (m) => m.GlobalIntelMapInteractive
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[480px] bg-[#0A0A0A] border-y border-[#141414] animate-pulse" />
    ),
  }
);

// Top destinations by demand for the homepage teaser
const TEASER_LIMIT = 8;

const MAP_ROUTES = [
  { id: "italy",  label: "ITALY",  fx: 118, fy: 160, tx: 285, ty:  92 },
  { id: "spain",  label: "SPAIN",  fx: 118, fy: 160, tx: 232, ty: 108 },
  { id: "brazil", label: "BRAZIL", fx: 118, fy: 160, tx: 140, ty: 208 },
  { id: "uae",    label: "UAE",    fx: 118, fy: 160, tx: 358, ty: 158 },
] as const;

function routeArc(fx: number, fy: number, tx: number, ty: number): string {
  const dy = ty - fy;
  const mx = (fx + tx) / 2;
  if (dy > 40 && Math.abs(tx - fx) < 60) {
    return `M ${fx} ${fy} Q ${mx + 50} ${fy + dy * 0.5} ${tx} ${ty}`;
  }
  const lift = 32 + (Math.abs(tx - fx) / 300) * 55;
  const my   = Math.min(fy, ty) - lift;
  return `M ${fx} ${fy} Q ${mx} ${my} ${tx} ${ty}`;
}

export function GlobalMap() {
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const glow    = glowRef.current;
    if (!section || !glow) return;
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      glow.style.setProperty("--mouse-x", ((e.clientX - r.left) / r.width  * 100).toFixed(1) + "%");
      glow.style.setProperty("--mouse-y", ((e.clientY - r.top)  / r.height * 100).toFixed(1) + "%");
    };
    section.addEventListener("pointermove", onMove, { passive: true });
    return () => section.removeEventListener("pointermove", onMove);
  }, []);

  const teaser = [...DESTINATIONS]
    .sort((a, b) => (b.demand || 0) - (a.demand || 0))
    .slice(0, TEASER_LIMIT);

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 bg-[#050507] overflow-hidden">
      {/* Mouse-tracked ambient light */}
      <div ref={glowRef} className="cinematic-vault-glow absolute inset-0 z-0" />

      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-10">
        <svg
          viewBox="0 0 1200 600"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#C6A55A"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <circle cx="300" cy="250" r="6" fill="#C6A55A" opacity="0.7">
            <animate
              attributeName="r"
              values="6;10;6"
              dur="2.4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.7;0.35;0.7"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="300" cy="250" r="3" fill="#C6A55A" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-[#C6A55A] text-sm font-medium tracking-wider uppercase mb-4 block">
            Execution Path Preview
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Cross-Border Execution Authority
          </h2>
          <p className="text-[#B0B0B0] text-lg max-w-2xl mx-auto leading-relaxed">
            From Florida to the world. Select a destination to begin execution —
            or open the full Global Document Intelligence™ map for compliance
            details and execution paths.
          </p>
        </motion.div>

        {/* Florida origin badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#111111] border border-[#C6A55A]/30 rounded-full gold-glow">
            <MapPin className="w-5 h-5 text-[#C6A55A]" />
            <span className="text-white font-medium">
              Florida, United States
            </span>
            <span className="text-[#B0B0B0]">|</span>
            <span className="text-[#C6A55A]">Execution Origin</span>
          </div>
        </motion.div>

        {/* 3-layer filament routing arcs — map section is exclusive routing owner */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="mb-8 relative"
          style={{ height: 220 }}
        >
          <svg
            viewBox="0 0 480 220"
            width="100%"
            height="100%"
            style={{ overflow: "visible", display: "block" }}
            aria-hidden="true"
          >
            <defs>
              <filter id="map-arc-bloom" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="6" result="blur" />
              </filter>
            </defs>

            {MAP_ROUTES.map((r, i) => {
              const d = routeArc(r.fx, r.fy, r.tx, r.ty);
              return (
                <g key={r.id}>
                  {/* Layer 3: ambient bloom */}
                  <path d={d} stroke="#D4AF37" strokeWidth="2" fill="none" opacity="0.28" filter="url(#map-arc-bloom)" />
                  {/* Layer 2: gold diffusion — plus-lighter blend for intersection glow */}
                  <path d={d} stroke="#D4AF37" strokeWidth="3" fill="none" opacity="0.45"
                    style={{ mixBlendMode: "plus-lighter" } as React.CSSProperties} />
                  {/* Layer 1: crisp champagne core */}
                  <path d={d} stroke="#F4E5B8" strokeWidth="1" fill="none" opacity="0.88" />

                  {/* Hague ripple rings */}
                  {([0, 0.8, 1.6] as number[]).map((delay, ri) => (
                    <circle key={ri} cx={r.tx} cy={r.ty} r="6"
                      fill="none" stroke="#C6A55A" strokeWidth={0.8 - ri * 0.2}
                      className="hague-ripple"
                      style={{ animationDelay: `${i * 0.35 + delay}s` } as React.CSSProperties}
                    />
                  ))}

                  {/* Destination core */}
                  <circle cx={r.tx} cy={r.ty} r="3" fill="#D4AF37" opacity="0.92" />
                  <text
                    x={r.tx + (r.tx > 240 ? 10 : -10)}
                    y={r.ty + 4}
                    textAnchor={r.tx > 240 ? "start" : "end"}
                    fill="#C6A55A" fontSize="7" letterSpacing="0.14em"
                    fontFamily="var(--font-geist, system-ui, sans-serif)"
                  >
                    {r.label}
                  </text>
                </g>
              );
            })}

            {/* Florida origin */}
            <circle cx="118" cy="160" r="4.5" fill="#D4AF37" opacity="0.9" />
            <circle cx="118" cy="160" r="11"  fill="none" stroke="#C6A55A" strokeWidth="0.8" opacity="0.35" />
            <text x="132" y="164" fill="#C6A55A" fontSize="7" letterSpacing="0.14em"
              fontFamily="var(--font-geist, system-ui, sans-serif)">
              FLORIDA
            </text>
          </svg>
        </motion.div>

        {/* Real interactive world map */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10 rounded-2xl overflow-hidden border border-[#1A1A1A]"
        >
          <GlobalIntelMapInteractive />
        </motion.div>

        {/* Interactive destination tiles → /intake?country=... */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-10"
        >
          {teaser.map((d) => (
            <Link
              key={d.slug}
              href={`/intake?country=${encodeURIComponent(d.name)}`}
              className="group relative bg-[#111111] border border-[#1E1E1E] rounded-xl p-4 transition-all duration-300 hover:border-[#C6A55A]/40 hover:bg-[#141210] hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{d.flag}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    d.hague
                      ? "bg-green-500/10 text-green-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {d.hague ? "Hague" : "Non-Hague"}
                </span>
              </div>
              <p className="text-white text-sm font-medium mb-0.5">{d.name}</p>
              <p className="text-[#8A8A8A] text-[10px] leading-relaxed mb-3">
                {d.note}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8A8A8A] tracking-wider uppercase">
                  Begin
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C6A55A] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
              </div>
            </Link>
          ))}
        </motion.div>

        {/* CTAs to full map + intake */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/map"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C6A55A] text-[#0A0A0A] text-sm font-semibold rounded-lg hover:bg-[#D4B76A] transition-colors gold-glow-hover"
          >
            Explore Global Document Intelligence
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/intake"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#C6A55A]/30 text-[#C6A55A] text-sm font-medium rounded-lg hover:border-[#C6A55A] hover:bg-[#C6A55A]/5 transition-colors"
          >
            Begin Secure Intake
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
