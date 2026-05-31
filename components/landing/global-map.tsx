"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalRouteAnimation } from "@/components/landing/global-route-animation";
import { MapPin, ArrowRight, Globe, X, Scale, Building2, Home, HeartPulse, Globe2, UserRound, Shield, ChevronDown, ChevronRight, Clock, Languages, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { CountryComplianceCard, COUNTRY_COMPLIANCE_DATA } from "@/components/landing/country-compliance-card";
import { getCorridorIntel, type MatterVector } from "@/data/corridor-intel";

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

type AudienceKey = "Attorneys" | "Businesses" | "Real Estate" | "Medical Providers" | "International Clients" | "Private Clients";

const AUDIENCE_CONFIG: Record<AudienceKey, { Icon: React.ElementType; label: string }> = {
  "Attorneys":            { Icon: Scale,       label: "Attorneys" },
  "Businesses":           { Icon: Building2,   label: "Businesses" },
  "Real Estate":          { Icon: Home,         label: "Real Estate" },
  "Medical Providers":    { Icon: HeartPulse,   label: "Medical Providers" },
  "International Clients":{ Icon: Globe2,       label: "International Clients" },
  "Private Clients":      { Icon: UserRound,    label: "Private Clients" },
};

const DESTINATION_REGIONS: Record<string, string> = {
  italy: "Europe", spain: "Europe", greece: "Europe", germany: "Europe",
  portugal: "Europe", france: "Europe", "united-kingdom": "Europe",
  netherlands: "Europe", belgium: "Europe", switzerland: "Europe",
  austria: "Europe", poland: "Europe", romania: "Europe",
  sweden: "Europe", norway: "Europe", turkey: "Europe",
  brazil: "Americas", mexico: "Americas", argentina: "Americas",
  colombia: "Americas", chile: "Americas", peru: "Americas",
  uruguay: "Americas", ecuador: "Americas", panama: "Americas",
  "dominican-republic": "Americas", venezuela: "Americas",
  uae: "Middle East", israel: "Middle East", "saudi-arabia": "Middle East",
  morocco: "Africa", "south-africa": "Africa", senegal: "Africa",
  mauritius: "Africa",
  japan: "Asia Pacific", australia: "Asia Pacific", "south-korea": "Asia Pacific",
  india: "Asia Pacific", singapore: "Asia Pacific", philippines: "Asia Pacific",
  "new-zealand": "Asia Pacific",
};

const REGION_TABS = ["All", "Europe", "Americas", "Middle East", "Asia Pacific"] as const;
type RegionTab = typeof REGION_TABS[number];

const REGION_FLY_TARGETS: Partial<Record<RegionTab, { lat: number; lng: number; zoom: number }>> = {
  "Europe":       { lat: 50, lng: 15, zoom: 4 },
  "Americas":     { lat: 5, lng: -75, zoom: 3 },
  "Middle East":  { lat: 26, lng: 50, zoom: 4 },
  "Asia Pacific": { lat: 20, lng: 115, zoom: 4 },
};

// ── Corridor Memory (sessionStorage) ─────────────────────────────────────────
function useCorridorMemory() {
  const [storedSlug, setStoredSlug] = useState<string | null>(null);
  const [storedMatter, setStoredMatter] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      setStoredSlug(sessionStorage.getItem("ms_corridor_country"));
      setStoredMatter(sessionStorage.getItem("ms_corridor_matter"));
    } catch {}
  }, []);

  const saveCountry = useCallback((slug: string | null) => {
    try {
      slug ? sessionStorage.setItem("ms_corridor_country", slug) : sessionStorage.removeItem("ms_corridor_country");
    } catch {}
    setStoredSlug(slug);
  }, []);

  const saveMatter = useCallback((matter: string | null) => {
    try {
      matter ? sessionStorage.setItem("ms_corridor_matter", matter) : sessionStorage.removeItem("ms_corridor_matter");
    } catch {}
    setStoredMatter(matter);
  }, []);

  return { storedSlug, storedMatter, saveCountry, saveMatter };
}

export function GlobalMap() {
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [activeRegion, setActiveRegion] = useState<RegionTab>("All");
  const [mapFlyTarget, setMapFlyTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [complianceCountryId, setComplianceCountryId] = useState<string | null>(null);

  // Sprint One — intelligence layer state
  const [activeMatter, setActiveMatter] = useState<MatterVector | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);
  const { storedSlug, storedMatter, saveCountry, saveMatter } = useCorridorMemory();
  const [showMemoryBanner, setShowMemoryBanner] = useState(false);

  // Restore from corridor memory on mount
  useEffect(() => {
    if (!storedSlug) return;
    const dest = DESTINATIONS.find(d => d.slug === storedSlug) ?? null;
    if (dest && !selectedDest) {
      setShowMemoryBanner(true);
    }
  }, [storedSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  // When selected destination changes, save to memory + reset matter/step
  const handleSelectDest = useCallback((dest: Destination | null) => {
    setSelectedDest(dest);
    setActiveMatter(null);
    setExpandedStep(null);
    saveCountry(dest?.slug ?? null);
    if (!dest) saveMatter(null);
  }, [saveCountry, saveMatter]);

  // When matter changes, save to memory
  const handleSelectMatter = useCallback((mv: MatterVector | null) => {
    setActiveMatter(mv);
    setExpandedStep(null);
    saveMatter(mv?.label ?? null);
  }, [saveMatter]);

  // Restore memory session
  function resumeMemorySession() {
    const dest = DESTINATIONS.find(d => d.slug === storedSlug) ?? null;
    if (!dest) return;
    setSelectedDest(dest);
    if (dest.lat && dest.lng) setMapFlyTarget({ lat: dest.lat, lng: dest.lng, zoom: 5 });
    const intel = getCorridorIntel(dest.slug, dest.hague);
    if (storedMatter) {
      const mv = intel.matterVectors.find(m => m.label === storedMatter) ?? null;
      setActiveMatter(mv);
    }
    setShowMemoryBanner(false);
  }

  const openCompliance = useCallback((slug: string) => {
    if (COUNTRY_COMPLIANCE_DATA[slug]) setComplianceCountryId(slug);
  }, []);
  const closeCompliance = useCallback(() => setComplianceCountryId(null), []);

  useEffect(() => {
    setActiveRouteId(selectedDest?.slug ?? null);
  }, [selectedDest]);

  // Derived corridor intelligence for selected destination
  const corridorIntel = selectedDest
    ? getCorridorIntel(selectedDest.slug, selectedDest.hague)
    : null;

  // Active execution path: matter-specific or generic
  const activePath = activeMatter?.path ?? selectedDest?.executionPath ?? [];
  const activeTimeline = activeMatter?.timeline ?? corridorIntel?.timeline ?? null;

  const allSorted = [...DESTINATIONS].sort((a, b) => (b.demand || 0) - (a.demand || 0));
  const teaser = activeRegion === "All"
    ? allSorted.slice(0, TEASER_LIMIT)
    : allSorted.filter(d => DESTINATION_REGIONS[d.slug] === activeRegion).slice(0, TEASER_LIMIT);

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
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.07]">
        <svg viewBox="0 0 1200 600" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="goldCorridorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1A1A1A" />
              <stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
              <stop offset="100%" stopColor="#0A0A0A" />
            </linearGradient>
            <filter id="softGoldGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
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

        {/* Corridor Memory Banner */}
        <AnimatePresence>
          {showMemoryBanner && storedSlug && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mb-5 flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-[#C6A55A]/20 bg-[#C6A55A]/[0.04]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[#C6A55A] text-base leading-none flex-shrink-0">
                  {DESTINATIONS.find(d => d.slug === storedSlug)?.flag}
                </span>
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#C6A55A]/70 truncate">
                  Continue exploring {DESTINATIONS.find(d => d.slug === storedSlug)?.name}
                  {storedMatter ? ` · ${storedMatter}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={resumeMemorySession}
                  className="font-mono text-[8px] tracking-[0.18em] uppercase text-[#C6A55A] hover:text-[#D4B76A] transition-colors px-2.5 py-1 border border-[#C6A55A]/30 rounded hover:border-[#C6A55A]/60"
                >
                  Resume
                </button>
                <button
                  onClick={() => setShowMemoryBanner(false)}
                  className="text-[#444] hover:text-[#666] transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* THREE-COLUMN EXECUTION DECK: How It Works | map canvas | dock */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 border border-white/[0.04] rounded-xl overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">

            {/* LEFT: How It Works steps — desktop only */}
            <div className="hidden lg:flex lg:col-span-3 flex-col border-r border-white/[0.04]"
              style={{
                background: "rgba(3,3,5,0.75)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              {/* Corner crosshairs */}
              <div className="absolute top-3 left-3 w-4 h-4 border-l border-t border-[#C6A55A]/10 pointer-events-none" />

              <div className="p-5 flex flex-col h-full">
                <div className="mb-5">
                  <span className="font-mono text-[8px] tracking-[0.32em] uppercase text-[#C6A55A]/40 block mb-1">
                    HOW IT WORKS
                  </span>
                  <div className="w-8 h-px bg-[#C6A55A]/20 mt-2" />
                </div>

                <div className="flex flex-col gap-0 flex-1">
                  {[
                    { n: "1", title: "Submit Your Matter", desc: "Verified identity & document upload." },
                    { n: "2", title: "Execution Review", desc: "We review scope, destination & requirements." },
                    { n: "3", title: "Secure Payment", desc: "Confirm scope and complete payment." },
                    { n: "4", title: "Document Execution", desc: "We execute your documents securely." },
                    { n: "5", title: "Apostille Coordination", desc: "We coordinate authentication & Apostille." },
                    { n: "6", title: "International Release", desc: "Secure release via confirmed delivery method." },
                  ].map((step, i) => (
                    <div key={step.n} className="relative group flex items-start gap-3 py-3.5 border-b border-white/[0.04] last:border-0">
                      {/* Vertical connector line */}
                      {i < 5 && (
                        <div className="absolute left-[18px] top-[34px] bottom-0 w-px bg-[#C6A55A]/08 pointer-events-none" />
                      )}
                      <div
                        className="flex-shrink-0 w-6 h-6 rounded-full border border-[#C6A55A]/25 flex items-center justify-center mt-0.5 group-hover:border-[#C6A55A]/50 transition-colors"
                        style={{ background: "rgba(198,165,90,0.04)" }}
                      >
                        <span className="font-mono text-[8px] text-[#C6A55A]/60 group-hover:text-[#C6A55A]/90 transition-colors leading-none">
                          {step.n}
                        </span>
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <div className="text-white/80 text-[11px] font-medium leading-snug mb-0.5 group-hover:text-white transition-colors">
                          {step.title}
                        </div>
                        <div className="text-[#4A4A4A] text-[10px] leading-snug group-hover:text-[#5A5A5A] transition-colors">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA at bottom */}
                <div className="mt-4 pt-4 border-t border-white/[0.04]">
                  <Link
                    href="/intake"
                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-[#C6A55A]/25 text-[#C6A55A]/80 hover:text-[#C6A55A] hover:border-[#C6A55A]/45 hover:bg-[#C6A55A]/[0.04] rounded-lg transition-all duration-200"
                  >
                    <span className="font-mono text-[9px] tracking-[0.18em] uppercase">Begin Intake</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* CENTER: Interactive map canvas */}
            <div className="lg:col-span-6 lg:border-r border-white/[0.04] relative">
              <GlobalIntelMapInteractive
                onSelect={handleSelectDest}
                selectedDest={selectedDest}
                externalFlyTarget={mapFlyTarget}
              />
              <GlobalRouteAnimation
                activeRouteId={activeRouteId}
                onRouteActivate={setActiveRouteId}
              />

              {/* Mobile bottom-sheet: slides up inside the map when a destination is selected */}
              <AnimatePresence>
                {selectedDest && (
                  <motion.div
                    key={`mobile-sheet-${selectedDest.slug}`}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute bottom-0 left-0 right-0 z-[600] lg:hidden"
                    style={{
                      background: "rgba(3,3,5,0.92)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      borderTop: "1px solid rgba(212,175,55,0.18)",
                      boxShadow: "0 -8px 40px rgba(0,0,0,0.7)",
                    }}
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl leading-none flex-shrink-0">{selectedDest.flag}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-serif text-base text-white leading-tight truncate">{selectedDest.name}</span>
                            <span className={`flex-shrink-0 font-mono text-[7px] px-1.5 py-0.5 rounded border ${
                              selectedDest.hague
                                ? "border-green-500/30 text-green-400/70"
                                : "border-amber-500/30 text-amber-400/70"
                            }`}>
                              {selectedDest.hague ? "HAGUE" : "NON-HAGUE"}
                            </span>
                          </div>
                          <span className="font-mono text-[8px] text-[#C6A55A]/50 tracking-wider">
                            FL ORIGIN → {selectedDest.name.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {COUNTRY_COMPLIANCE_DATA[selectedDest.slug] && (
                          <button
                            onClick={() => openCompliance(selectedDest.slug)}
                            className="p-1.5 rounded border border-[#C6A55A]/25 text-[#C6A55A]/60 hover:text-[#C6A55A] hover:border-[#C6A55A]/50 transition-colors"
                            aria-label="View compliance details"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link
                          href={`/intake?country=${encodeURIComponent(selectedDest.name)}`}
                          className="px-3 py-1.5 bg-[#C6A55A] text-[#050507] font-bold tracking-[0.1em] text-[9px] uppercase rounded-lg"
                        >
                          Begin Intake
                        </Link>
                        <button
                          onClick={() => handleSelectDest(null)}
                          className="p-1.5 rounded hover:bg-white/[0.08] text-[#555] hover:text-[#888] transition-colors"
                          aria-label="Clear selection"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT: Execution dock — desktop only */}
            <div className="hidden lg:flex lg:col-span-3 relative flex-col"
              style={{
                background: "rgba(3,3,5,0.82)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.08), 0 0 40px rgba(0,0,0,0.6)",
              }}
            >
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
                    className="flex flex-col h-full p-5 lg:p-6 relative overflow-hidden"
                  >
                    {/* Single-pass scanning line on entry */}
                    <div className="terminal-scan-line" key={`scan-${selectedDest.slug}`} />

                    {/* Dock header */}
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <span className="font-mono text-[8px] tracking-[0.32em] uppercase text-[#D4AF37]/40 block mb-2">
                          TRACKED CORRIDOR
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
                        onClick={() => handleSelectDest(null)}
                        className="p-1.5 rounded hover:bg-white/[0.05] text-[#444] hover:text-[#888] transition-colors flex-shrink-0"
                        aria-label="Clear selection"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Jurisdictional framework */}
                    <div className="bg-black/60 border border-[#D4AF37]/10 rounded-lg p-3.5 mb-4"
                      style={{ boxShadow: "0 0 20px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(212,175,55,0.05)" }}
                    >
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

                    {/* Intelligence metadata row */}
                    {corridorIntel && (
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        {activeTimeline && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-[#C6A55A]/40 flex-shrink-0" />
                            <span className="font-mono text-[9px] text-[#555]">{activeTimeline}</span>
                          </div>
                        )}
                        {corridorIntel.translationRequired && (
                          <div className="flex items-center gap-1.5">
                            <Languages className="w-3 h-3 text-[#C6A55A]/40 flex-shrink-0" />
                            <span className="font-mono text-[9px] text-[#555]">Translation required</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Matter Vector Intelligence — clickable chips that reconfigure sequence */}
                    {corridorIntel && corridorIntel.matterVectors.length > 0 && (
                      <div className="mb-4">
                        <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-[#444] block mb-2">
                          SELECT MATTER TYPE
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {corridorIntel.matterVectors.map((mv) => {
                            const isActive = activeMatter?.label === mv.label;
                            return (
                              <button
                                key={mv.label}
                                onClick={() => handleSelectMatter(isActive ? null : mv)}
                                className={`font-mono text-[9px] px-2.5 py-1 rounded border transition-all duration-200 ${
                                  isActive
                                    ? "border-[#C6A55A]/60 text-[#C6A55A] bg-[#C6A55A]/[0.08]"
                                    : "border-white/[0.08] text-[#5A5A5A] hover:border-[#C6A55A]/30 hover:text-[#888]"
                                }`}
                              >
                                {isActive && <CheckCircle2 className="inline w-2.5 h-2.5 mr-1 mb-0.5" />}
                                {mv.label}
                              </button>
                            );
                          })}
                          {/* Fallback generic matter chips if no corridor intel matters */}
                          {corridorIntel.matterVectors.length === 0 && selectedDest.commonDocuments.slice(0, 3).map((doc) => (
                            <span key={doc} className="font-mono text-[9px] px-2 py-0.5 border border-white/[0.06] text-[#555] rounded">{doc}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Procedural Sequence */}
                    <div className="mb-4 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-[#444]">
                          {activeMatter ? `${activeMatter.label.toUpperCase()} SEQUENCE` : "PROCEDURAL SEQUENCE"}
                        </span>
                        {activeMatter && (
                          <button
                            onClick={() => handleSelectMatter(null)}
                            className="font-mono text-[7px] tracking-[0.12em] text-[#444] hover:text-[#C6A55A]/60 transition-colors uppercase"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeMatter?.label ?? "generic"}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-0"
                        >
                          {activePath.map((step, i) => {
                            const isExpanded = expandedStep === i;
                            // derive contextual note from step text
                            const note = step.toLowerCase().includes("apostille")
                              ? "Florida Department of State. Standard processing 2–5 business days."
                              : step.toLowerCase().includes("translation")
                              ? "Certified translation by sworn translator. Required by receiving authority."
                              : step.toLowerCase().includes("notarization") || step.toLowerCase().includes("notary")
                              ? "Florida-commissioned notary. RON available for remote signers."
                              : step.toLowerCase().includes("courier")
                              ? "Secure international courier with tracking. Delivery 3–7 business days."
                              : step.toLowerCase().includes("embassy") || step.toLowerCase().includes("consulate")
                              ? "Embassy/consulate processing times vary. Typically 5–15 business days."
                              : step.toLowerCase().includes("authentication")
                              ? "Florida SOS or U.S. State Dept. confirms notary credentials for foreign use."
                              : null;
                            return (
                              <div key={`${activeMatter?.label ?? "x"}-${i}`}>
                                <button
                                  className={`w-full flex items-start gap-3 py-2 text-left group transition-colors ${note ? "cursor-pointer" : "cursor-default"}`}
                                  onClick={() => note && setExpandedStep(isExpanded ? null : i)}
                                  disabled={!note}
                                  aria-expanded={note ? isExpanded : undefined}
                                >
                                  <span className="font-mono text-[#C6A55A]/40 text-[8px] mt-0.5 w-5 flex-shrink-0 group-hover:text-[#C6A55A]/60 transition-colors">
                                    {String(i + 1).padStart(2, "0")}
                                  </span>
                                  <span className="text-[#909090] text-[11px] leading-snug flex-1 text-left group-hover:text-[#ABABAB] transition-colors">
                                    {step}
                                  </span>
                                  {note && (
                                    <span className="flex-shrink-0 mt-0.5">
                                      {isExpanded
                                        ? <ChevronDown className="w-3 h-3 text-[#C6A55A]/40" />
                                        : <ChevronRight className="w-3 h-3 text-[#333] group-hover:text-[#C6A55A]/30 transition-colors" />}
                                    </span>
                                  )}
                                </button>
                                <AnimatePresence>
                                  {isExpanded && note && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.22 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="ml-8 mb-2 px-3 py-2 rounded bg-[#C6A55A]/[0.04] border border-[#C6A55A]/10">
                                        <p className="font-mono text-[9px] text-[#666] leading-relaxed">{note}</p>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Use cases (compact) */}
                    {selectedDest.audiences && selectedDest.audiences.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1.5">
                        {selectedDest.audiences.map((aud) => {
                          const cfg = AUDIENCE_CONFIG[aud as AudienceKey];
                          if (!cfg) return null;
                          const { Icon, label } = cfg;
                          return (
                            <div key={aud} className="flex items-center gap-1.5">
                              <Icon size={9} style={{ color: "rgba(198,165,90,0.45)", flexShrink: 0 }} />
                              <span className="font-mono text-[8.5px] text-[#4A4A4A] tracking-wide">{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Compliance Intelligence link */}
                    {COUNTRY_COMPLIANCE_DATA[selectedDest.slug] && (
                      <button
                        onClick={() => openCompliance(selectedDest.slug)}
                        className="flex items-center gap-2 w-full px-3 py-2 mb-3 rounded-lg border border-[#C6A55A]/15 bg-[#C6A55A]/[0.04] text-[#C6A55A]/70 hover:text-[#C6A55A] hover:border-[#C6A55A]/30 hover:bg-[#C6A55A]/[0.07] transition-all duration-200 group"
                      >
                        <Shield className="w-3 h-3 flex-shrink-0" />
                        <span className="font-mono text-[9px] tracking-[0.18em] uppercase">
                          Hague Compliance Intelligence
                        </span>
                        <ArrowRight className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}

                    {/* Disclaimer */}
                    <p className="font-mono text-[8px] text-[#333] leading-relaxed mb-4">
                      Procedural guidance only. Requirements confirmed with receiving authority before execution.
                    </p>

                    {/* Execution CTA — preloaded with country + matter */}
                    <Link
                      href={`/intake?country=${encodeURIComponent(selectedDest.name)}${activeMatter ? `&matter=${encodeURIComponent(activeMatter.label)}` : ""}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-[#C6A55A] text-[#050507] font-bold tracking-[0.14em] text-[10px] uppercase rounded-lg hover:bg-[#D4B76A] transition-colors duration-200"
                    >
                      Begin Secure Intake
                      {activeMatter && <span className="opacity-70">· {activeMatter.label}</span>}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div
                    key="dock-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col items-center justify-center flex-1 h-full p-8 text-center relative overflow-hidden"
                  >
                    {/* Ambient radial bloom */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(198,165,90,0.045) 0%, transparent 70%)" }}
                    />

                    {/* Animated crosshair globe */}
                    <div className="relative mb-6 flex-shrink-0">
                      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="opacity-60">
                        {/* Outer ring — slow pulse */}
                        <circle cx="36" cy="36" r="32" stroke="#C6A55A" strokeWidth="0.5" opacity="0.25">
                          <animate attributeName="r" values="32;35;32" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
                          <animate attributeName="opacity" values="0.25;0.08;0.25" dur="4s" repeatCount="indefinite" />
                        </circle>
                        {/* Inner ring */}
                        <circle cx="36" cy="36" r="20" stroke="#C6A55A" strokeWidth="0.6" opacity="0.35" />
                        {/* Core dot */}
                        <circle cx="36" cy="36" r="3.5" fill="#C6A55A" opacity="0.7">
                          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2.8s" repeatCount="indefinite" />
                        </circle>
                        {/* Crosshair lines */}
                        <line x1="36" y1="4" x2="36" y2="16" stroke="#C6A55A" strokeWidth="0.8" opacity="0.4" />
                        <line x1="36" y1="56" x2="36" y2="68" stroke="#C6A55A" strokeWidth="0.8" opacity="0.4" />
                        <line x1="4" y1="36" x2="16" y2="36" stroke="#C6A55A" strokeWidth="0.8" opacity="0.4" />
                        <line x1="56" y1="36" x2="68" y2="36" stroke="#C6A55A" strokeWidth="0.8" opacity="0.4" />
                        {/* Sweeping arc */}
                        <path d="M 36 16 A 20 20 0 0 1 56 36" stroke="#C6A55A" strokeWidth="1.2" opacity="0.55" strokeLinecap="round">
                          <animateTransform attributeName="transform" type="rotate" from="0 36 36" to="360 36 36" dur="6s" repeatCount="indefinite" />
                        </path>
                        {/* Corner ticks */}
                        <path d="M 10 10 L 10 16 M 10 10 L 16 10" stroke="#C6A55A" strokeWidth="0.7" opacity="0.3" />
                        <path d="M 62 10 L 62 16 M 62 10 L 56 10" stroke="#C6A55A" strokeWidth="0.7" opacity="0.3" />
                        <path d="M 10 62 L 10 56 M 10 62 L 16 62" stroke="#C6A55A" strokeWidth="0.7" opacity="0.3" />
                        <path d="M 62 62 L 62 56 M 62 62 L 56 62" stroke="#C6A55A" strokeWidth="0.7" opacity="0.3" />
                      </svg>
                    </div>

                    {/* Label */}
                    <span className="font-mono text-[8px] tracking-[0.32em] uppercase text-[#C6A55A]/30 block mb-3">
                      EXECUTION VECTOR
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#3A3A3A] max-w-[180px] leading-[1.8] block mb-6">
                      Select a destination on the map to preview the execution path
                    </span>

                    {/* Live status indicators */}
                    <div className="flex flex-col gap-2 w-full max-w-[200px]">
                      {[
                        { label: "HAGUE ROUTES", value: "38 ACTIVE" },
                        { label: "CORRIDORS", value: "LIVE" },
                        { label: "ORIGIN", value: "FL · CLEARED" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-3 py-1.5 border border-white/[0.04] rounded bg-white/[0.015]">
                          <span className="font-mono text-[8px] tracking-[0.2em] text-[#333]">{label}</span>
                          <span className="font-mono text-[8px] tracking-[0.15em] text-[#C6A55A]/50">{value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Region filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center gap-2 mb-4 overflow-x-auto pb-1"
        >
          {REGION_TABS.map((region) => (
            <button
              key={region}
              onClick={() => {
                setActiveRegion(region);
                if (region !== "All" && REGION_FLY_TARGETS[region]) {
                  setMapFlyTarget(REGION_FLY_TARGETS[region]!);
                }
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-sm font-mono text-[9px] tracking-[0.18em] uppercase transition-all duration-200 border ${
                activeRegion === region
                  ? "border-[#C6A55A]/40 text-[#C6A55A] bg-[#C6A55A]/[0.06]"
                  : "border-white/[0.05] text-[#444] hover:border-white/[0.1] hover:text-[#666]"
              }`}
            >
              {region}
            </button>
          ))}
        </motion.div>

        {/* Dense destination token grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="border border-white/[0.04] rounded-xl overflow-hidden mb-8"
        >
          {/* Token grid header — with dynamic hover preview */}
          <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between min-h-[44px]">
            <AnimatePresence mode="wait">
              {hoveredToken ? (() => {
                const hd = teaser.find(d => d.slug === hoveredToken);
                const hi = hd ? getCorridorIntel(hd.slug, hd.hague) : null;
                return hd && hi ? (
                  <motion.div
                    key={hoveredToken}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-base leading-none">{hd.flag}</span>
                    <span className="font-serif text-sm text-white">{hd.name}</span>
                    <span className="font-mono text-[8px] text-[#C6A55A]/60 tracking-[0.18em] uppercase">{hi.routeType}</span>
                    <span className="text-[#333]">·</span>
                    <span className="font-mono text-[8px] text-[#555]">{hi.timeline}</span>
                    {hi.translationRequired && (
                      <>
                        <span className="text-[#333]">·</span>
                        <span className="font-mono text-[8px] text-[#555]">Translation required</span>
                      </>
                    )}
                    {hi.matterVectors.length > 0 && (
                      <div className="hidden md:flex items-center gap-1.5 ml-1">
                        {hi.matterVectors.slice(0, 2).map(mv => (
                          <span key={mv.label} className="font-mono text-[7.5px] px-1.5 py-0.5 border border-white/[0.06] text-[#4A4A4A] rounded">
                            {mv.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : null;
              })() : (
                <motion.span
                  key="default-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="font-mono text-[8px] tracking-[0.28em] uppercase text-[#444]"
                >
                  HIGH-DEMAND DESTINATIONS
                </motion.span>
              )}
            </AnimatePresence>
            <span className="font-mono text-[8px] text-[#333] flex-shrink-0 ml-3">
              {TEASER_LIMIT} OF 150 ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4">
            {teaser.map((d) => (
              <button
                key={d.slug}
                onClick={() => {
                  const next = selectedDest?.slug === d.slug ? null : d;
                  handleSelectDest(next);
                  if (next?.lat && next?.lng) {
                    setMapFlyTarget({ lat: next.lat, lng: next.lng, zoom: 5 });
                  }
                }}
                onMouseEnter={() => setHoveredToken(d.slug)}
                onMouseLeave={() => setHoveredToken(null)}
                className={`group relative text-left px-4 py-3.5 border-b border-r border-white/[0.03] transition-all duration-300 focus:outline-none ${
                  selectedDest?.slug === d.slug
                    ? "bg-[#C6A55A]/[0.06]"
                    : selectedDest
                      ? "opacity-40 hover:opacity-70 hover:bg-white/[0.02]"
                      : "hover:bg-white/[0.02]"
                }`}
                style={selectedDest?.slug === d.slug ? {
                  boxShadow: "inset 0 0 24px rgba(212,175,55,0.04)",
                } : undefined}
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
      {/* Country compliance modal — available for all 5 PRIMARY_ROUTES */}
      <CountryComplianceCard countryId={complianceCountryId} onClose={closeCompliance} />
    </motion.section>
  );
}
