"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ArrowRight, Globe, X } from "lucide-react";
import Link from "next/link";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { FLORIDA_ORIGIN, DESTINATION_NODES, type InternationalNode } from "./map-data";

// ── Lightweight SVG execution map — no external map dependency ────────────────

function SvgExecutionMap({
  selectedDest,
  onSelect,
}: {
  selectedDest: Destination | null;
  onSelect: (d: Destination | null) => void;
}) {
  function handleNodeClick(node: InternationalNode) {
    const dest = DESTINATIONS.find(
      (d) => d.name.toLowerCase() === node.name.toLowerCase()
    ) ?? null;
    onSelect(selectedDest?.name.toLowerCase() === node.name.toLowerCase() ? null : dest);
  }

  const fl = FLORIDA_ORIGIN.coordinates;

  return (
    <div className="relative w-full bg-[#07070A] overflow-hidden" style={{ aspectRatio: "16/9" }}>
      <svg
        viewBox="0 0 100 56"
        className="w-full h-full select-none"
        aria-label="Global execution map — click a destination to preview"
      >
        <defs>
          <pattern id="exec-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(198,165,90,0.04)" strokeWidth="0.3" />
          </pattern>
          <radialGradient id="origin-glow">
            <stop offset="0%" stopColor="#C6A55A" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#C6A55A" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="node-glow">
            <stop offset="0%" stopColor="#C6A55A" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#C6A55A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Grid */}
        <rect width="100" height="56" fill="url(#exec-grid)" />

        {/* Ambient equator / meridian reference lines */}
        <line x1="0" y1="28" x2="100" y2="28" stroke="rgba(198,165,90,0.03)" strokeWidth="0.5" />
        <line x1="50" y1="0" x2="50" y2="56" stroke="rgba(198,165,90,0.03)" strokeWidth="0.5" />

        {/* Route arcs from Florida to each destination */}
        {DESTINATION_NODES.map((node) => {
          const isActive = selectedDest?.name.toLowerCase() === node.name.toLowerCase();
          const cx = (fl.x + node.coordinates.x) / 2;
          const cy = Math.min(fl.y, node.coordinates.y) - 10;
          return (
            <path
              key={`arc-${node.id}`}
              d={`M ${fl.x} ${fl.y} Q ${cx} ${cy} ${node.coordinates.x} ${node.coordinates.y}`}
              fill="none"
              stroke={isActive ? "rgba(198,165,90,0.55)" : "rgba(198,165,90,0.07)"}
              strokeWidth={isActive ? "0.55" : "0.22"}
              strokeDasharray={isActive ? undefined : "1.8 1.8"}
              strokeLinecap="round"
              className="transition-all duration-500 pointer-events-none"
            />
          );
        })}

        {/* Florida origin node */}
        <g transform={`translate(${fl.x},${fl.y})`}>
          <circle r="5" fill="url(#origin-glow)" className="pointer-events-none" />
          <circle r="1.4" fill="#C6A55A" className="pointer-events-none" />
          <text
            y="-4"
            textAnchor="middle"
            fill="rgba(198,165,90,0.7)"
            fontSize="2"
            fontFamily="monospace"
            fontWeight="bold"
            letterSpacing="0.06em"
            className="pointer-events-none"
          >
            FL ORIGIN
          </text>
        </g>

        {/* Destination nodes */}
        {DESTINATION_NODES.map((node) => {
          const isActive = selectedDest?.name.toLowerCase() === node.name.toLowerCase();
          const { x, y } = node.coordinates;
          return (
            <g
              key={node.id}
              transform={`translate(${x},${y})`}
              onClick={() => handleNodeClick(node)}
              role="button"
              aria-label={`Select ${node.name}`}
              style={{ cursor: "pointer" }}
            >
              {/* Hit area */}
              <circle r="5" fill="transparent" />
              {/* Glow when active */}
              {isActive && (
                <circle r="4.5" fill="url(#node-glow)" className="pointer-events-none" />
              )}
              {/* Outer ring */}
              <circle
                r="1.8"
                fill="none"
                stroke={isActive ? "rgba(198,165,90,0.5)" : "rgba(198,165,90,0.12)"}
                strokeWidth="0.4"
                className="transition-all duration-300 pointer-events-none"
              />
              {/* Core dot */}
              <circle
                r="0.9"
                fill={isActive ? "#C6A55A" : "rgba(255,255,255,0.25)"}
                className="transition-all duration-300 pointer-events-none"
              />
              {/* Label */}
              <text
                y="-4"
                textAnchor="middle"
                fill={isActive ? "#C6A55A" : "rgba(255,255,255,0.28)"}
                fontSize="1.9"
                fontFamily="monospace"
                fontWeight={isActive ? "bold" : "normal"}
                letterSpacing="0.07em"
                className="pointer-events-none transition-all duration-300"
              >
                {node.name.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Region buttons */}
      <div className="absolute top-3 left-3 flex gap-1.5 z-10">
        {(["Americas", "Europe", "Middle East"] as const).map((region) => (
          <button
            key={region}
            className="px-2 py-1 bg-[#111111] border border-[#2A2A2A] text-[#B0B0B0] text-[8px] tracking-[0.1em] uppercase rounded-md hover:border-[#C6A55A]/40 hover:text-[#C6A55A] transition-colors duration-200"
          >
            {region}
          </button>
        ))}
      </div>

      <div className="absolute top-3 right-3 text-[8px] text-[#2A2A2A] tracking-wider hidden md:block font-mono">
        Click a node · FL Origin fixed
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

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
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(212,175,55,0.04) 0%, rgba(5,5,7,0) 70%)" }}
      />
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.07]">
        <svg viewBox="0 0 1200 600" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
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
            style={{ filter: "drop-shadow(0 4px 12px rgba(5,5,7,0.95))" }}
          >
            Global Document Intelligence™
          </h2>
          <p className="text-[#8A8A8A] text-sm max-w-xl mx-auto leading-relaxed font-light">
            Jurisdiction routing, Hague convention review, and execution paths —
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

        {/* TWO-COLUMN EXECUTION DECK */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 border border-white/[0.04] rounded-xl overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* LEFT: SVG execution map */}
            <div className="lg:col-span-8 border-b lg:border-b-0 lg:border-r border-white/[0.04]">
              <SvgExecutionMap selectedDest={selectedDest} onSelect={setSelectedDest} />
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
