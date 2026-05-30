"use client";

import { useState, useEffect } from "react";
import { CountryComplianceCard } from "@/components/landing/country-compliance-card";

const FLORIDA = { x: 28, y: 44 };

const DESTINATIONS = [
  { id: "italy",  label: "Italy",  x: 62, y: 22, delay: 0   },
  { id: "spain",  label: "Spain",  x: 54, y: 25, delay: 150 },
  { id: "brazil", label: "Brazil", x: 37, y: 64, delay: 300 },
  { id: "uae",    label: "UAE",    x: 80, y: 38, delay: 450 },
  { id: "mexico", label: "Mexico", x: 16, y: 52, delay: 600 },
];

function arcPath(to: { x: number; y: number }) {
  const mx = (FLORIDA.x + to.x) / 2;
  const my = Math.min(FLORIDA.y, to.y) - 14;
  return `M ${FLORIDA.x} ${FLORIDA.y} Q ${mx} ${my} ${to.x} ${to.y}`;
import { useEffect, useRef, useState } from "react";

const FLORIDA = { x: 108, y: 190 };

const DESTINATIONS = [
  {
    id: "italy",
    label: "Italy",
    x: 255, y: 105,
    dur: 2.4, startDelay: 0.0,
    framework: "HAGUE CONVENTION ROUTING",
    seoIntent: "/jurisdictions/italy-apostille-coordination",
    isoCode: "JURISDICTION_ISO_IT",
  },
  {
    id: "spain",
    label: "Spain",
    x: 208, y: 122,
    dur: 2.8, startDelay: 0.7,
    framework: "HAGUE CONVENTION ROUTING",
    seoIntent: "/jurisdictions/spain-international-release-coordination",
    isoCode: "JURISDICTION_ISO_ES",
  },
  {
    id: "brazil",
    label: "Brazil",
    x: 118, y: 268,
    dur: 3.1, startDelay: 1.4,
    framework: "HAGUE CONVENTION ROUTING",
    seoIntent: "/jurisdictions/brazil-hague-convention-routing",
    isoCode: "JURISDICTION_ISO_BR",
  },
  {
    id: "uae",
    label: "UAE",
    x: 330, y: 192,
    dur: 2.6, startDelay: 0.3,
    framework: "CONSULAR AUTHENTICATION TRACK",
    seoIntent: "/jurisdictions/uae-consular-authentication-track",
    isoCode: "JURISDICTION_ISO_AE",
  },
  {
    id: "mexico",
    label: "Mexico",
    x: 62, y: 222,
    dur: 1.8, startDelay: 2.1,
    framework: "HAGUE CONVENTION ROUTING",
    seoIntent: "/jurisdictions/mexico-hague-convention-routing",
    isoCode: "JURISDICTION_ISO_MX",
  },
];

// Typography scramble — characters cycle before settling on final text
function useScramble(text: string, active: boolean, tick: number): string {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    setDisplay(text);
    if (!active || !text) return;
    const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/";
    let frame = 0;
    const FRAMES = 16;
    const id = setInterval(() => {
      frame++;
      setDisplay(
        text.split("").map((c, i) => {
          if (c === " " || c === "/" || c === "-" || c === ".") return c;
          if (frame >= FRAMES || frame / FRAMES > i / text.length) return c;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join("")
      );
      if (frame >= FRAMES) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, active, tick]);
  return display;
}

function makeCurvedPath(
  from: { x: number; y: number },
  to:   { x: number; y: number }
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mx = (from.x + to.x) / 2;
  if (dy > 50 && Math.abs(dx) < 70) {
    return `M ${from.x} ${from.y} Q ${mx + 58} ${from.y + dy * 0.5} ${to.x} ${to.y}`;
  }
  const lift = 38 + (Math.abs(dx) / 300) * 62;
  const my = Math.min(from.y, to.y) - lift;
  return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
}

export function GlobalTrustCoreHero() {
  const [settled, setSettled] = useState(false);
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [phase, setPhase] = useState<"idle" | "settled" | "arcs" | "rotating">("idle");
  const [arcsDone, setArcsDone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scrambleTick, setScrambleTick] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const selectedDest = DESTINATIONS.find(d => d.id === selectedId) ?? null;
  const scrambleText = selectedDest
    ? `${selectedDest.label.toUpperCase()} // ${selectedDest.framework}`
    : "";
  const scrambledText = useScramble(scrambleText, !!selectedDest, scrambleTick);

  const handleSelect = (id: string) => {
    if (!arcsDone) return;
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
      setScrambleTick(t => t + 1);
    }
  };

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);

    const t0 = setTimeout(() => setSettled(true), 200);

    // Stagger nodes appearing
    const timers = DESTINATIONS.map((dest) =>
      setTimeout(() => {
        setActiveNodes((prev) => new Set([...prev, dest.id]));
      }, dest.delay + 600)
    );

    return () => {
      clearTimeout(t0);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative w-full select-none" aria-hidden="true">
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-white/[0.04]"
        style={{ aspectRatio: "4/3", background: "#07070A" }}
      >
        {/* Ambient gold glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 40% 50%, rgba(198,165,90,0.06) 0%, transparent 65%)",
          }}
        />

        {/* Corner crosshairs */}
        <div className="absolute top-3 left-3 w-5 h-5 border-l border-t border-[#C6A55A]/20 pointer-events-none" />
        <div className="absolute top-3 right-3 w-5 h-5 border-r border-t border-[#C6A55A]/20 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-5 h-5 border-l border-b border-[#C6A55A]/20 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-5 h-5 border-r border-b border-[#C6A55A]/20 pointer-events-none" />

        <svg
          viewBox="0 0 100 75"
          className="absolute inset-0 w-full h-full"
          style={{ fontFamily: "monospace" }}
        >
  const isSettled  = phase !== "idle";
  const showArcs   = phase === "arcs" || phase === "rotating";
  // Rotation pauses while a node is focused
  const isRotating = phase === "rotating" && !selectedId;

  // Subtle camera nudge toward the selected node
  const nudgeX = selectedDest ? ((selectedDest.x - 200) / 200) * 2.5 : 0;
  const nudgeY = selectedDest ? ((selectedDest.y - 200) / 200) * 1.5 : 0;

  // Popover placement — flip to left when node is in right hemisphere
  const popLeft = selectedDest
    ? `${Math.min(80, Math.max(5, (selectedDest.x / 400) * 100))}%`
    : "50%";
  const popTop = selectedDest
    ? `${Math.min(82, Math.max(12, (selectedDest.y / 400) * 100))}%`
    : "50%";
  const popAnchor = selectedDest && selectedDest.x > 200
    ? "translate(calc(-100% - 18px), -50%)"
    : "translate(18px, -50%)";

  return (
    <div
      className="ms-globe-container"
      aria-label="Global document execution network"
      onClick={() => setSelectedId(null)}
    >
      {/* Gold bloom behind sphere */}
      <div className="ms-globe-bloom" />

      {/* Glass sphere — nudges toward selected node */}
      <div
        className={[
          "ms-globe-sphere",
          isSettled    && "ms-globe-sphere--visible",
          isRotating   && "ms-globe-sphere--rotating",
        ].filter(Boolean).join(" ")}
        style={{
          transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1)",
          transform: `translate(${nudgeX}%, ${nudgeY}%)`,
          position: "relative",
        }}
      >
        {/* Atmospheric grid */}
        <svg viewBox="0 0 400 400" className="ms-globe-grid-svg ms-globe-grid-svg--defocus" aria-hidden="true">
          <ellipse cx="200" cy="200" rx="193" ry="40"  fill="none" stroke="#C6A55A" strokeWidth="0.4" opacity="0.10" />
          <ellipse cx="200" cy="145" rx="171" ry="32"  fill="none" stroke="#C6A55A" strokeWidth="0.3" opacity="0.07" />
          <ellipse cx="200" cy="255" rx="171" ry="32"  fill="none" stroke="#C6A55A" strokeWidth="0.3" opacity="0.07" />
          <ellipse cx="200" cy="200" rx="40"  ry="193" fill="none" stroke="#C6A55A" strokeWidth="0.3" opacity="0.08" />
          <ellipse cx="200" cy="200" rx="103" ry="193" fill="none" stroke="#C6A55A" strokeWidth="0.2" opacity="0.05" />
          <ellipse cx="200" cy="200" rx="156" ry="193" fill="none" stroke="#C6A55A" strokeWidth="0.2" opacity="0.04" />
        </svg>

        {/* Continent dots */}
        <svg viewBox="0 0 800 400" className="ms-globe-dots-layer" aria-hidden="true">
          {ALL_DOTS.map((dot, i) => (
            <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill="#C6A55A" opacity={dot.opacity} />
          ))}
        </svg>

        {/* Route arcs + nodes */}
        <svg viewBox="0 0 400 400" className="ms-globe-arcs-svg" aria-hidden="true">
          <defs>
            <pattern id="hero-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(198,165,90,0.045)" strokeWidth="0.3" />
            </pattern>
            <radialGradient id="hero-origin-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#C6A55A" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#C6A55A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hero-node-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#C6A55A" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#C6A55A" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid */}
          <rect width="100" height="75" fill="url(#hero-grid)" />

          {/* Faint meridian/equator reference */}
          <line x1="0" y1="37.5" x2="100" y2="37.5" stroke="rgba(198,165,90,0.03)" strokeWidth="0.4" />
          <line x1="50" y1="0" x2="50" y2="75" stroke="rgba(198,165,90,0.03)" strokeWidth="0.4" />

          {/* Route arcs */}
          {DESTINATIONS.map((dest) => {
            const isActive = activeNodes.has(dest.id);
            return (
              <path
                key={`arc-${dest.id}`}
                d={arcPath({ x: dest.x, y: dest.y })}
                fill="none"
                stroke={isActive ? "rgba(198,165,90,0.55)" : "rgba(198,165,90,0.07)"}
                strokeWidth={isActive ? "0.6" : "0.25"}
                strokeDasharray={isActive ? undefined : "2 2"}
                strokeLinecap="round"
                style={{
                  transition: reducedMotion ? "none" : "stroke 0.6s ease, stroke-width 0.6s ease",
                }}
                className="pointer-events-none"
              />
            );
          })}

          {/* Florida origin */}
          <g>
            <circle
              cx={FLORIDA.x} cy={FLORIDA.y}
              r="7"
              fill="url(#hero-origin-glow)"
              className="pointer-events-none"
            />
            <circle
              cx={FLORIDA.x} cy={FLORIDA.y}
              r="2"
              fill="#C6A55A"
              opacity={settled ? 1 : 0}
              style={{ transition: reducedMotion ? "none" : "opacity 0.5s ease" }}
              className="pointer-events-none"
            />
            <text
              x={FLORIDA.x + 5}
              y={FLORIDA.y - 4}
              fill="rgba(198,165,90,0.65)"
              fontSize="2.4"
              fontWeight="bold"
              letterSpacing="0.08em"
              opacity={settled ? 1 : 0}
              style={{ transition: reducedMotion ? "none" : "opacity 0.6s ease" }}
              className="pointer-events-none"
            >
              FL ORIGIN
            ))}
            <filter id="gtc-glow-arc" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="gtc-glow-arc-bright" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="gtc-glow-node" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2.8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="gtc-bloom-node" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* Florida origin */}
          <circle
            cx={FLORIDA.x} cy={FLORIDA.y} r="5"
            fill="#D4AF37"
            filter="url(#gtc-glow-node)"
            opacity={isSettled ? 1 : 0}
            className={`ms-globe-origin${isSettled ? " ms-globe-origin--glow" : ""}`}
          />
          <circle
            cx={FLORIDA.x} cy={FLORIDA.y} r="13"
            fill="none" stroke="#C6A55A" strokeWidth="0.8"
            opacity={isSettled ? 0.28 : 0}
            className="ms-globe-origin-ring"
          />
          {isSettled && (
            <text x={FLORIDA.x + 19} y={FLORIDA.y + 3} className="ms-globe-location-text">
              FLORIDA ORIGIN
            </text>
          </g>

          {/* Destination nodes */}
          {DESTINATIONS.map((dest) => {
            const isActive = activeNodes.has(dest.id);
            const labelLeft = dest.x > 50;
            return (
              <g
                key={dest.id}
                onClick={() => setSelectedCountry(dest.id)}
                role="button"
                aria-label={`View ${dest.label} execution path`}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedCountry(dest.id); }}
              >
                {/* Hit area */}
                <circle cx={dest.x} cy={dest.y} r="7" fill="transparent" />
                {/* Glow */}
                {isActive && (
                  <circle
                    cx={dest.x} cy={dest.y}
                    r="6"
                    fill="url(#hero-node-glow)"
                    className="pointer-events-none"
                  />
                )}
                {/* Outer ring */}
                <circle
                  cx={dest.x} cy={dest.y}
                  r="2.5"
                  fill="none"
                  stroke={isActive ? "rgba(198,165,90,0.5)" : "rgba(198,165,90,0.1)"}
                  strokeWidth="0.5"
                  opacity={isActive ? 1 : 0}
                  style={{ transition: reducedMotion ? "none" : "opacity 0.5s ease, stroke 0.4s ease" }}
                  className="pointer-events-none"
                />
                {/* Core dot */}
                <circle
                  cx={dest.x} cy={dest.y}
                  r="1.2"
                  fill={isActive ? "#C6A55A" : "rgba(255,255,255,0.15)"}
                  opacity={isActive ? 1 : 0}
                  style={{ transition: reducedMotion ? "none" : "opacity 0.4s ease, fill 0.4s ease" }}
                  className="pointer-events-none"
                />
                {/* Label */}
                {isActive && (
                  <text
                    x={labelLeft ? dest.x + 5 : dest.x - 5}
                    y={dest.y - 4}
                    textAnchor={labelLeft ? "start" : "end"}
                    fill="#C6A55A"
                    fontSize="2.4"
                    fontWeight="bold"
                    letterSpacing="0.08em"
                    className="pointer-events-none"
                  >
                    {dest.label.toUpperCase()}
                  </text>
                )}
          {/* Per-route */}
          {DESTINATIONS.map((dest, i) => {
            const path      = makeCurvedPath(FLORIDA, { x: dest.x, y: dest.y });
            const isSelected = selectedId === dest.id;
            const isDimmed   = !!selectedId && !isSelected;

            const ghostOpacity  = isDimmed ? 0.015 : (showArcs ? 0.09 : 0);
            const fringeOpacity = isDimmed ? 0      : (showArcs ? 0.35 : 0);
            const fringeOpacity2 = isDimmed ? 0     : (showArcs ? 0.22 : 0);
            const bodyStroke    = isSelected ? "#F0C84A" : "#C6A55A";
            const headStroke    = isSelected ? "#FFFFFF" : "#FFF5DC";
            const bodyFilter    = isSelected ? "url(#gtc-glow-arc-bright)" : "url(#gtc-glow-arc)";
            const bloomOpacity  = arcsDone ? (isDimmed ? 0.2 : 1) : 0;

            return (
              <g key={dest.id}>
                {/* Chromatic fringes */}
                <path d={path} stroke="#F4E5B8" strokeWidth="0.85" fill="none"
                  opacity={fringeOpacity} transform="translate(-1,0)"
                  style={{ transition: "opacity 0.5s ease" }} />
                <path d={path} stroke="#9B9488" strokeWidth="0.85" fill="none"
                  opacity={fringeOpacity2} transform="translate(1,0)"
                  style={{ transition: "opacity 0.5s ease" }} />

                {/* Ghost base */}
                <path d={path} stroke="#C6A55A" strokeWidth="0.6" fill="none"
                  opacity={ghostOpacity}
                  style={{ transition: "opacity 0.4s ease" }} />

                {/* Comet body */}
                <path
                  d={path} stroke={bodyStroke}
                  strokeWidth={isSelected ? 1.8 : 1.3}
                  fill="none"
                  filter={bodyFilter}
                  className={`ms-globe-arc-body${showArcs ? " ms-globe-arc-body--flowing" : ""}`}
                  style={{
                    animationDuration: `${dest.dur}s`,
                    animationDelay: `${dest.startDelay}s`,
                    opacity: isDimmed ? 0.12 : 1,
                    transition: "opacity 0.4s ease, stroke-width 0.3s ease",
                  } as React.CSSProperties}
                />

                {/* Comet head */}
                <path
                  d={path} stroke={headStroke}
                  strokeWidth={isSelected ? 3.8 : 2.8}
                  fill="none"
                  className={`ms-globe-arc-head${showArcs ? " ms-globe-arc-head--flowing" : ""}`}
                  style={{
                    animationDuration: `${dest.dur}s`,
                    animationDelay: `${dest.startDelay}s`,
                    opacity: isDimmed ? 0 : 1,
                    transition: "opacity 0.4s ease",
                  } as React.CSSProperties}
                />

                {/* animateMotion particle */}
                {showArcs && !reducedMotion && !isDimmed && (
                  <circle r="2.2" fill="#F4E5B8" opacity="0.92">
                    <animateMotion dur={`${dest.dur}s`} begin={`${dest.startDelay}s`} repeatCount="indefinite">
                      <mpath href={`#gtc-arc-${dest.id}`} />
                    </animateMotion>
                  </circle>
                )}

                {/* Destination bloom */}
                <circle
                  cx={dest.x} cy={dest.y} r="18"
                  fill="#D4AF37" filter="url(#gtc-bloom-node)"
                  opacity={bloomOpacity}
                  className={arcsDone ? "ms-globe-dest-bloom" : ""}
                  style={{ transition: "opacity 0.5s ease" }}
                />

                {/* Clickable node — semantic SEO attributes, cinematic focus */}
                <g
                  style={{ cursor: arcsDone ? "pointer" : "default", pointerEvents: "all" }}
                  role={arcsDone ? "button" : undefined}
                  tabIndex={arcsDone ? 0 : undefined}
                  aria-label={`${dest.label} routing information`}
                  data-auth-node="FLORIDA_ORIGIN"
                  data-target-vector={dest.isoCode}
                  onClick={(e) => { e.stopPropagation(); handleSelect(dest.id); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSelect(dest.id); }}
                >
                  {/* Expanded hit area */}
                  <circle cx={dest.x} cy={dest.y} r="18" fill="transparent" />

                  {/* Node core */}
                  <circle
                    cx={dest.x} cy={dest.y}
                    r={isSelected ? 5 : 3.5}
                    fill={isSelected ? "#F0C84A" : "#D4AF37"}
                    filter="url(#gtc-glow-node)"
                    opacity={arcsDone ? 1 : 0}
                    className={arcsDone
                      ? "ms-globe-dest-node ms-globe-dest-node--pulse"
                      : "ms-globe-dest-node"}
                    style={{
                      transition: "r 0.3s ease, fill 0.3s ease, opacity 0.4s ease",
                      transitionDelay: `${i * 120}ms`,
                    }}
                  />

                  {/* Node ring */}
                  <circle
                    cx={dest.x} cy={dest.y}
                    r={isSelected ? 12 : 8.5}
                    fill="none"
                    stroke="#C6A55A"
                    strokeWidth={isSelected ? 1.2 : 0.7}
                    opacity={arcsDone ? (isSelected ? 0.55 : (isDimmed ? 0.1 : 0.25)) : 0}
                    className="ms-globe-dest-ring"
                    style={{
                      transition: "all 0.35s ease",
                      transitionDelay: `${i * 120 + 120}ms`,
                    }}
                  />

                  {/* Label */}
                  {arcsDone && (
                    <text
                      x={dest.x + (dest.x > 200 ? 14 : -14)}
                      y={dest.y + 3.5}
                      textAnchor={dest.x > 200 ? "start" : "end"}
                      className="ms-globe-location-text"
                      style={{
                        animationDelay: `${i * 80}ms`,
                        opacity: isDimmed ? 0.15 : 1,
                        transition: "opacity 0.35s ease",
                      }}
                    >
                      {dest.label.toUpperCase()}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </svg>

        {/* Label bar */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 border-t border-white/[0.04] flex items-center justify-between">
          <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-[#C6A55A]/60">
            Global Trust Core™
          </span>
          <span className="font-mono text-[8px] tracking-wider text-[#333]">
            Hague Route Reviewed · Structured International Release
          </span>
        </div>
      </div>

      {/* Country compliance card */}
      <CountryComplianceCard countryId={selectedCountry} onClose={() => setSelectedCountry(null)} />
        {/* Glass specular cap */}
        <div className="ms-globe-glass-cap" />
        {/* Crest glow */}
        <div className="ms-globe-crest-glow" />
        {/* Milano Seal crest */}
        <div className="ms-globe-crest" aria-hidden="true" />
        {/* Spotlight */}
        <div className="ms-globe-spotlight" />
      </div>

      {/* Destination popover — stage level so sphere overflow:hidden does not clip it */}
      {selectedDest && (
        <div
          className="ms-destination-popover"
          className="ms-destination-popover hidden md:block"
          style={{
            position: "absolute",
            left: popLeft,
            top: popTop,
            transform: popAnchor,
            zIndex: 50,
            pointerEvents: "auto",
          }}
          data-seo-intent={selectedDest.seoIntent}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-[#050507]/92 border border-[#D4AF37]/25 rounded-xl px-4 py-3.5 shadow-2xl"
            style={{
              width: "13.5rem",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              animation: "gtc-popover-in 0.2s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <button
              onClick={() => setSelectedId(null)}
              className="absolute top-2.5 right-3 font-mono text-[#3A3A3A] hover:text-[#888] transition-colors text-base leading-none"
              aria-label="Close"
            >
              ×
            </button>
            <span className="font-mono text-[7px] tracking-[0.32em] uppercase text-[#555] block mb-2.5">
              DESTINATION VECTOR
            </span>
            <p className="font-mono text-[10px] text-[#D4AF37] tracking-wider leading-snug pr-5 min-h-[2.2em]">
              {scrambledText}
            </p>
            <p className="font-mono text-[8px] text-[#383838] tracking-wide mt-2.5">
              FL ORIGIN → {selectedDest.label.toUpperCase()} VECTOR
            </p>
          </div>
        </div>
      )}

      {/* Orbit rings */}
      <div className="ms-orbit-ring ms-orbit-ring--main" />
      <div className="ms-orbit-ring ms-orbit-ring--outer" />

      {/* Label row — updates on selection */}
      <div className={`ms-globe-label${isSettled ? " ms-globe-label--visible" : ""}`}>
        <span className="ms-globe-label-text">Global Trust Core™</span>
        <span className="ms-globe-label-sub">
          {selectedDest
            ? `${selectedDest.label} · ${selectedDest.framework}`
            : arcsDone
              ? "Hague Route Reviewed · Structured International Release"
              : "Florida Origin · Execution Authority"}
        </span>
      </div>
    </div>
  );
}
