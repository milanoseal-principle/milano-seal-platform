"use client";

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

export function GlobalMap() {
  const teaser = [...DESTINATIONS]
    .sort((a, b) => (b.demand || 0) - (a.demand || 0))
    .slice(0, TEASER_LIMIT);

  return (
    <section className="relative py-24 md:py-32 bg-[#0A0A0A] overflow-hidden">
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
            View Full Compliance Map
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/intake"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#C6A55A]/30 text-[#C6A55A] text-sm font-medium rounded-lg hover:border-[#C6A55A] hover:bg-[#C6A55A]/5 transition-colors"
          >
            Begin Execution
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
