"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ArrowRight, Globe, X } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DESTINATIONS, type Destination } from "@/data/destinations";

const GlobalIntelMapInteractive = dynamic(
  () =>
    import("@/components/landing/global-intel-map-interactive").then(
      (m) => m.GlobalIntelMapInteractive
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[480px] bg-[#07070A] animate-pulse" />
    ),
  }
);

const TEASER_LIMIT = 8;

export function GlobalMap() {
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);

  const teaser = [...DESTINATIONS]
    .sort((a, b) => (b.demand || 0) - (a.demand || 0))
    .slice(0, TEASER_LIMIT);

  return (
    <motion.section
      className="relative py-20 md:py-28 bg-[#050507] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Ambient vault glow */}
    <section className="relative py-32 md:py-40 bg-[#050507] overflow-hidden">
      {/* Ambient vault glow — intensifies as map awakens */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(212,175,55,0.04) 0%, rgba(5,5,7,0) 70%)" }}
      />
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.07]">
        <svg viewBox="0 0 1200 600" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-10">
        <svg
          viewBox="0 0 1200 600"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#C6A55A" strokeWidth="0.5" opacity="0.3" />
              <animateTransform
                attributeName="patternTransform"
                type="translate"
                from="0 0"
                to="40 40"
                dur="22s"
                repeatCount="indefinite"
              />
              {/* Slow parallax drift — grid floats on a deeper axis */}
              <animateTransform
                attributeName="patternTransform"
                type="translate"
                from="0 0"
                to="40 40"
                dur="22s"
                repeatCount="indefinite"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#map-grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#6A5520] mb-5 block">
            THE SYSTEM IN MOTION
          </span>
          <h2
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-5 text-balance"
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance"
            style={{ filter: "drop-shadow(0 4px 12px rgba(5,5,7,0.95))" }}
          >
            Global Document Intelligence™
          </h2>
          <p className="text-[#8A8A8A] text-sm max-w-xl mx-auto leading-relaxed font-light">
          <p className="text-[#8A8A8A] text-base max-w-xl mx-auto leading-relaxed font-light">
            Jurisdiction routing, Hague compliance, and execution paths —
            from Florida to key international destinations.
          </p>
        </motion.div>

        {/* Florida origin badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#0D0D0D] border border-[#C6A55A]/25 rounded-full gold-glow">
            <MapPin className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-white text-sm font-medium">Florida, United States</span>
            <span className="text-[#444]">|</span>
            <span className="font-mono text-[10px] tracking-wider text-[#C6A55A] uppercase">Execution Origin</span>
          </div>
        </motion.div>

        {/* TWO-COLUMN EXECUTION DECK: map canvas left, dock right */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 border border-white/[0.04] rounded-xl overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* LEFT: Interactive map canvas */}
            <div className="lg:col-span-8 border-b lg:border-b-0 lg:border-r border-white/[0.04]">
              <GlobalIntelMapInteractive
                onSelect={setSelectedDest}
                selectedDest={selectedDest}
              />
            </div>

            {/* RIGHT: Execution dock */}
            <div className="lg:col-span-4 relative bg-[#07070A] min-h-[340px] lg:min-h-0 flex flex-col">
              {/* Corner crosshairs */}
              <div className="absolute top-3 left-3 w-4 h-4 border-l border-t border-[#C6A55A]/15 pointer-events-none" />
              <div className="absolute top-3 right-3 w-4 h-4 border-r border-t border-[#C6A55A]/15 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-l border-b border-[#C6A55A]/15 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-r border-b border-[#C6A55A]/15 pointer-events-none" />

              <AnimatePresence mode="wait">
                {selectedDest ? (
                  <motion.div
                    key={selectedDest.slug}
                    initial={{ opacity: 0, x: 16, scale: 0.985 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 8, scale: 0.99 }}
                    transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col h-full p-5 lg:p-6"
                  >
                    {/* Dock header */}
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <span className="font-mono text-[8px] tracking-[0.32em] uppercase text-[#6A5520] block mb-2">
                          DESTINATION VECTOR
                        </span>
                        <div className="flex items-center gap-2.5 mb-1">
                          <span className="text-xl leading-none">{selectedDest.flag}</span>
                          <h3 className="font-serif text-xl text-white leading-tight">{selectedDest.name}</h3>
                        </div>
                        <span className="font-mono text-[9px] text-[#C6A55A]/50 tracking-wider">
                          FL ORIGIN → {selectedDest.name.toUpperCase()} VECTOR
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedDest(null)}
                        className="p-1.5 rounded hover:bg-white/[0.05] text-[#444] hover:text-[#888] transition-colors flex-shrink-0"
                        aria-label="Clear selection"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Jurisdictional framework */}
                    <div className="bg-black/50 border border-white/[0.04] rounded-lg p-3.5 mb-4">
                      <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-[#444] block mb-2">
                        JURISDICTIONAL FRAMEWORK
                      </span>
                      <span className={`inline-block font-mono text-[9px] px-2.5 py-1 rounded border ${
                        selectedDest.hague
                          ? "border-green-500/25 text-green-400/80 bg-green-500/[0.05]"
                          : "border-amber-500/25 text-amber-400/80 bg-amber-500/[0.05]"
                      }`}>
                        {selectedDest.hague
                          ? "HAGUE ROUTE AVAILABLE"
                          : "LEGALIZATION REVIEW REQUIRED"}
                      </span>
                    </div>

                    {/* Procedural sequence */}
                    <div className="mb-4 flex-1">
                      <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-[#444] block mb-3">
                        PROCEDURAL SEQUENCE
                      </span>
                      <div className="space-y-2.5">
                        {selectedDest.executionPath.map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="font-mono text-[#C6A55A]/40 text-[8px] mt-0.5 w-5 flex-shrink-0">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="text-[#909090] text-[11px] leading-snug">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Matter vectors */}
                    {selectedDest.commonDocuments && selectedDest.commonDocuments.length > 0 && (
                      <div className="mb-5">
                        <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-[#444] block mb-2.5">
                          MATTER VECTORS
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDest.commonDocuments.slice(0, 4).map((doc) => (
                            <span
                              key={doc}
                              className="font-mono text-[9px] px-2 py-0.5 border border-white/[0.06] text-[#666] rounded"
                            >
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Execution CTA */}
                    <Link
                      href={`/intake?country=${encodeURIComponent(selectedDest.name)}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-[#C6A55A] text-[#050507] font-bold tracking-[0.14em] text-[10px] uppercase rounded-lg hover:bg-[#D4B76A] transition-colors duration-200"
                    >
                      Begin Secure Intake
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div
                    key="dock-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center justify-center flex-1 h-full p-8 text-center"
                  >
                    <Globe className="w-7 h-7 text-[#242424] mb-4" />
                    <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-[#333] max-w-[190px] leading-relaxed">
                      Select a destination on the map to preview the execution vector
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Dense destination token grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="border border-white/[0.04] rounded-xl overflow-hidden mb-8"
        >
          {/* Token grid header */}
          <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between">
            <span className="font-mono text-[8px] tracking-[0.28em] uppercase text-[#444]">
              HIGH-DEMAND DESTINATIONS
            </span>
            <span className="font-mono text-[8px] text-[#333]">
              {TEASER_LIMIT} OF 150 ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4">
            {teaser.map((d) => (
              <button
                key={d.slug}
                onClick={() => setSelectedDest(selectedDest?.slug === d.slug ? null : d)}
                className={`group relative text-left px-4 py-3.5 border-b border-r border-white/[0.03] transition-all duration-200 focus:outline-none ${
                  selectedDest?.slug === d.slug
                    ? "bg-[#C6A55A]/[0.05]"
                    : "hover:bg-white/[0.02]"
                }`}
              >
                {/* Active left accent */}
                {selectedDest?.slug === d.slug && (
                  <div className="absolute left-0 inset-y-0 w-px bg-[#C6A55A]/50" />
                )}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm leading-none">{d.flag}</span>
                    <span className={`font-mono text-[10px] font-semibold tracking-wider ${
                      selectedDest?.slug === d.slug ? "text-[#C6A55A]" : "text-white/80"
                    }`}>
                      {d.name.toUpperCase()}
                    </span>
                  </div>
                  <span className={`font-mono text-[7px] px-1.5 py-0.5 rounded border ${
                    d.hague
                      ? "border-green-500/20 text-green-500/50"
                      : "border-amber-500/20 text-amber-500/50"
                  }`}>
                    {d.hague ? "HAGUE" : "NON-HAGUE"}
                  </span>
                </div>
                <div className="font-mono text-[9px] text-[#4A4A4A] tracking-wide truncate">
                  {d.note}
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.35 }}
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
    </motion.section>
  );
}
