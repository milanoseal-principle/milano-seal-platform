"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CountryComplianceCard } from "@/components/landing/country-compliance-card";

// Florida: southeastern US anchor — upper-left of South America on this projection
// Continent dot regions place NA body at y:105–157, Central America at y:205–235
// Florida (25°N) sits between them at x~108 (east coast), y~190
const FLORIDA = { x: 108, y: 190 };

const DESTINATIONS = [
  // Europe: upper-right quadrant (Italy right of Spain, both clearly east of Atlantic midline)
  { id: "italy",  label: "Italy",  x: 255, y: 105, dur: 2.4, startDelay: 0.0 },
  { id: "spain",  label: "Spain",  x: 208, y: 122, dur: 2.8, startDelay: 0.7 },
  // Brazil: lower-left — below Florida on the same western longitude band
  { id: "brazil", label: "Brazil", x: 118, y: 268, dur: 3.1, startDelay: 1.4 },
  // UAE: far right, Middle East gateway — same latitude as Florida
  { id: "uae",    label: "UAE",    x: 330, y: 192, dur: 2.6, startDelay: 0.3 },
  // Mexico: southwest of Florida — North America civil law bridge
  { id: "mexico", label: "Mexico", x:  62, y: 222, dur: 1.8, startDelay: 2.1 },
];

function makeCurvedPath(
  from: { x: number; y: number },
  to:   { x: number; y: number }
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mx = (from.x + to.x) / 2;

  // Southward destination (Brazil): arc east over Atlantic, then curve to destination
  // Mirrors actual Florida→South America great-circle route
  if (dy > 50 && Math.abs(dx) < 70) {
    return `M ${from.x} ${from.y} Q ${mx + 58} ${from.y + dy * 0.5} ${to.x} ${to.y}`;
  }

  // Eastward/north destinations: arc height scales with horizontal distance
  // Prevents hairpin loops — lift proportional to span, not a fixed 94px
  const lift = 38 + (Math.abs(dx) / 300) * 62;
  const my = Math.min(from.y, to.y) - lift;
  return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
}

function seededRand(seed: number) {
  let s = seed;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 4294967295;
  };
}

interface Region {
  x: number; y: number; w: number; h: number; count: number;
  minR: number; maxR: number; minO: number; maxO: number;
}

function generateDots(regions: Region[]) {
  const dots: { cx: number; cy: number; r: number; opacity: number }[] = [];
  regions.forEach((reg, ri) => {
    const rng = seededRand(ri * 7919 + 31337);
    for (let i = 0; i < reg.count; i++) {
      dots.push({
        cx:      reg.x + rng() * reg.w,
        cy:      reg.y + rng() * reg.h,
        r:       reg.minR + rng() * (reg.maxR - reg.minR),
        opacity: reg.minO + rng() * (reg.maxO - reg.minO),
      });
    }
  });
  return dots;
}

const CONTINENT_REGIONS: Region[] = [
  { x: 152, y: 75,  w: 32,  h: 38,  count: 14,  minR: 0.5, maxR: 1.8, minO: 0.12, maxO: 0.32 },
  { x: 55,  y: 105, w: 78,  h: 52,  count: 48,  minR: 0.5, maxR: 2.5, minO: 0.18, maxO: 0.52 },
  { x: 112, y: 148, w: 40,  h: 45,  count: 22,  minR: 0.5, maxR: 1.8, minO: 0.15, maxO: 0.45 },
  { x: 55,  y: 148, w: 30,  h: 50,  count: 18,  minR: 0.5, maxR: 1.5, minO: 0.12, maxO: 0.40 },
  { x: 88,  y: 205, w: 32,  h: 30,  count: 10,  minR: 0.4, maxR: 1.2, minO: 0.10, maxO: 0.32 },
  { x: 92,  y: 228, w: 68,  h: 45,  count: 36,  minR: 0.5, maxR: 2.2, minO: 0.15, maxO: 0.48 },
  { x: 102, y: 268, w: 50,  h: 48,  count: 24,  minR: 0.5, maxR: 1.8, minO: 0.12, maxO: 0.40 },
  { x: 195, y: 98,  w: 52,  h: 55,  count: 38,  minR: 0.4, maxR: 1.8, minO: 0.18, maxO: 0.52 },
  { x: 238, y: 112, w: 32,  h: 45,  count: 18,  minR: 0.4, maxR: 1.5, minO: 0.15, maxO: 0.42 },
  { x: 195, y: 158, w: 72,  h: 48,  count: 38,  minR: 0.5, maxR: 2.0, minO: 0.15, maxO: 0.45 },
  { x: 198, y: 202, w: 65,  h: 70,  count: 42,  minR: 0.5, maxR: 2.2, minO: 0.15, maxO: 0.48 },
  { x: 258, y: 142, w: 52,  h: 52,  count: 24,  minR: 0.4, maxR: 1.8, minO: 0.15, maxO: 0.45 },
  { x: 258, y: 78,  w: 115, h: 72,  count: 58,  minR: 0.4, maxR: 1.8, minO: 0.10, maxO: 0.38 },
  { x: 270, y: 165, w: 35,  h: 55,  count: 22,  minR: 0.4, maxR: 1.8, minO: 0.15, maxO: 0.45 },
  { x: 295, y: 118, w: 72,  h: 68,  count: 50,  minR: 0.4, maxR: 2.0, minO: 0.15, maxO: 0.48 },
  { x: 352, y: 128, w: 22,  h: 45,  count: 14,  minR: 0.4, maxR: 1.4, minO: 0.12, maxO: 0.38 },
  { x: 305, y: 190, w: 65,  h: 52,  count: 25,  minR: 0.4, maxR: 1.5, minO: 0.12, maxO: 0.38 },
  { x: 312, y: 235, w: 68,  h: 48,  count: 28,  minR: 0.5, maxR: 2.2, minO: 0.15, maxO: 0.45 },
  { x: 368, y: 268, w: 14,  h: 22,  count: 6,   minR: 0.4, maxR: 1.2, minO: 0.12, maxO: 0.35 },
];

const FRONT_DOTS = generateDots(CONTINENT_REGIONS);
const ALL_DOTS = [
  ...FRONT_DOTS,
  ...FRONT_DOTS.map(d => ({ ...d, cx: d.cx + 400 })),
];

export function GlobalTrustCoreHero() {
  const [phase, setPhase] = useState<"idle" | "settled" | "arcs" | "rotating">("idle");
  const [arcsDone, setArcsDone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const openCard = useCallback((id: string) => setSelectedCountry(id), []);
  const closeCard = useCallback(() => setSelectedCountry(null), []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = mql.matches;
    setReducedMotion(reduced);

    if (reduced) {
      setPhase("rotating");
      setArcsDone(true);
      return;
    }

    timers.current.push(setTimeout(() => setPhase("settled"), 80));
    timers.current.push(setTimeout(() => setPhase("arcs"), 1100));
    timers.current.push(setTimeout(() => {
      setArcsDone(true);
      setPhase("rotating");
    }, 1800));

    return () => timers.current.forEach(clearTimeout);
  }, []);

  const isSettled = phase !== "idle";
  const showArcs  = phase === "arcs" || phase === "rotating";

  return (
    <div className="ms-globe-container" aria-hidden="true">
      {/* Gold bloom behind sphere */}
      <div className="ms-globe-bloom" />

      {/* Glass sphere */}
      <div
        className={[
          "ms-globe-sphere",
          isSettled            && "ms-globe-sphere--visible",
          phase === "rotating" && "ms-globe-sphere--rotating",
        ].filter(Boolean).join(" ")}
      >
        {/* Latitude / longitude atmospheric grid — defocused (far hemisphere) */}
        <svg viewBox="0 0 400 400" className="ms-globe-grid-svg ms-globe-grid-svg--defocus" aria-hidden="true">
          <ellipse cx="200" cy="200" rx="193" ry="40"  fill="none" stroke="#C6A55A" strokeWidth="0.4" opacity="0.10" />
          <ellipse cx="200" cy="145" rx="171" ry="32"  fill="none" stroke="#C6A55A" strokeWidth="0.3" opacity="0.07" />
          <ellipse cx="200" cy="255" rx="171" ry="32"  fill="none" stroke="#C6A55A" strokeWidth="0.3" opacity="0.07" />
          <ellipse cx="200" cy="200" rx="40"  ry="193" fill="none" stroke="#C6A55A" strokeWidth="0.3" opacity="0.08" />
          <ellipse cx="200" cy="200" rx="103" ry="193" fill="none" stroke="#C6A55A" strokeWidth="0.2" opacity="0.05" />
          <ellipse cx="200" cy="200" rx="156" ry="193" fill="none" stroke="#C6A55A" strokeWidth="0.2" opacity="0.04" />
        </svg>

        {/* Continent molecule dots — 200% wide, animates for rotation illusion */}
        <svg
          viewBox="0 0 800 400"
          className="ms-globe-dots-layer"
          aria-hidden="true"
        >
          {ALL_DOTS.map((dot, i) => (
            <circle
              key={i}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill="#C6A55A"
              opacity={dot.opacity}
            />
          ))}
        </svg>

        {/* Route arcs, comet bodies, particles, nodes */}
        <svg
          viewBox="0 0 400 400"
          className="ms-globe-arcs-svg"
          aria-hidden="true"
        >
          <defs>
            {DESTINATIONS.map(dest => (
              <path
                key={`def-${dest.id}`}
                id={`gtc-arc-${dest.id}`}
                d={makeCurvedPath(FLORIDA, { x: dest.x, y: dest.y })}
                fill="none"
              />
            ))}
            <filter id="gtc-glow-arc" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="gtc-glow-node" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="gtc-bloom-node" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* Florida origin */}
          <circle
            cx={FLORIDA.x} cy={FLORIDA.y}
            r="5"
            fill="#D4AF37"
            filter="url(#gtc-glow-node)"
            opacity={isSettled ? 1 : 0}
            className={`ms-globe-origin${isSettled ? " ms-globe-origin--glow" : ""}`}
          />
          <circle
            cx={FLORIDA.x} cy={FLORIDA.y}
            r="13"
            fill="none"
            stroke="#C6A55A"
            strokeWidth="0.8"
            opacity={isSettled ? 0.28 : 0}
            className="ms-globe-origin-ring"
          />
          {isSettled && (
            <text
              x={FLORIDA.x + 19}
              y={FLORIDA.y + 3}
              className="ms-globe-location-text"
            >
              FLORIDA ORIGIN
            </text>
          )}

          {/* Per-route: ghost + comet body + comet head + particle + bloom + node */}
          {DESTINATIONS.map((dest, i) => {
            const path = makeCurvedPath(FLORIDA, { x: dest.x, y: dest.y });
            return (
              <g key={dest.id}>
                {/* Chromatic fringes — glass crystal edge diffraction */}
                <path d={path} stroke="#F4E5B8" strokeWidth="0.85" fill="none"
                  opacity={showArcs ? 0.35 : 0}
                  transform="translate(-1, 0)"
                  style={{ transition: "opacity 0.9s ease" }} />
                <path d={path} stroke="#9B9488" strokeWidth="0.85" fill="none"
                  opacity={showArcs ? 0.22 : 0}
                  transform="translate(1, 0)"
                  style={{ transition: "opacity 0.9s ease" }} />

                {/* Ghost base — full path, very faint */}
                <path
                  d={path}
                  stroke="#C6A55A"
                  strokeWidth="0.6"
                  fill="none"
                  opacity={showArcs ? 0.09 : 0}
                  style={{ transition: "opacity 0.6s ease" }}
                />

                {/* Comet body — flowing 70px dash */}
                <path
                  d={path}
                  stroke="#C6A55A"
                  strokeWidth="1.3"
                  fill="none"
                  filter="url(#gtc-glow-arc)"
                  className={`ms-globe-arc-body${showArcs ? " ms-globe-arc-body--flowing" : ""}`}
                  style={{
                    animationDuration: `${dest.dur}s`,
                    animationDelay: `${dest.startDelay}s`,
                  } as React.CSSProperties}
                />

                {/* Comet head — short 10px bright leading tip, pin-sharp foreground */}
                <path
                  d={path}
                  stroke="#FFF5DC"
                  strokeWidth="2.8"
                  fill="none"
                  className={`ms-globe-arc-head${showArcs ? " ms-globe-arc-head--flowing" : ""}`}
                  style={{
                    animationDuration: `${dest.dur}s`,
                    animationDelay: `${dest.startDelay}s`,
                  } as React.CSSProperties}
                />

                {/* animateMotion particle */}
                {showArcs && !reducedMotion && (
                  <circle r="2.2" fill="#F4E5B8" opacity="0.92">
                    <animateMotion
                      dur={`${dest.dur}s`}
                      begin={`${dest.startDelay}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#gtc-arc-${dest.id}`} />
                    </animateMotion>
                  </circle>
                )}

                {/* Destination bloom — large blurred atmospheric pulse */}
                <circle
                  cx={dest.x} cy={dest.y}
                  r="18"
                  fill="#D4AF37"
                  filter="url(#gtc-bloom-node)"
                  opacity={arcsDone ? 1 : 0}
                  className={arcsDone ? "ms-globe-dest-bloom" : ""}
                  style={{ transition: "opacity 0.5s ease" }}
                />

                {/* Clickable node + ring + label → opens compliance card */}
                <g
                  style={{ cursor: "pointer" }}
                  role="button"
                  aria-label={`View ${dest.label} compliance details`}
                  onClick={() => openCard(dest.id)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openCard(dest.id); }}
                >
                  <circle
                    cx={dest.x} cy={dest.y}
                    r="18"
                    fill="transparent"
                  />
                  <circle
                    cx={dest.x} cy={dest.y}
                    r="3.5"
                    fill="#D4AF37"
                    filter="url(#gtc-glow-node)"
                    opacity={arcsDone ? 1 : 0}
                    className={arcsDone
                      ? "ms-globe-dest-node ms-globe-dest-node--pulse"
                      : "ms-globe-dest-node"}
                    style={{ transitionDelay: `${i * 120}ms` }}
                  />
                  <circle
                    cx={dest.x} cy={dest.y}
                    r="8.5"
                    fill="none"
                    stroke="#C6A55A"
                    strokeWidth="0.7"
                    opacity={arcsDone ? 0.25 : 0}
                    className="ms-globe-dest-ring"
                    style={{ transitionDelay: `${i * 120 + 120}ms` }}
                  />
                  {arcsDone && (
                    <text
                      x={dest.x + (dest.x > 200 ? 14 : -14)}
                      y={dest.y + 3.5}
                      textAnchor={dest.x > 200 ? "start" : "end"}
                      className="ms-globe-location-text"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      {dest.label.toUpperCase()}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </svg>

        {/* Glass specular cap — top-left diagonal highlight */}
        <div className="ms-globe-glass-cap" />

        {/* Crest glow pulse — sibling to crest, below it in z */}
        <div className="ms-globe-crest-glow" />

        {/* Center crest — official Milano Seal™ mark via CSS */}
        <div className="ms-globe-crest" aria-hidden="true" />

        {/* Top-left spotlight highlight */}
        <div className="ms-globe-spotlight" />
      </div>

      {/* Orbit rings */}
      <div className="ms-orbit-ring ms-orbit-ring--main" />
      <div className="ms-orbit-ring ms-orbit-ring--outer" />

      {/* Label row */}
      <div className={`ms-globe-label${isSettled ? " ms-globe-label--visible" : ""}`}>
        <span className="ms-globe-label-text">Global Trust Core™</span>
        <span className="ms-globe-label-sub">
          {arcsDone
            ? "Hague Route Reviewed · Structured International Release"
            : "Florida Origin · Execution Authority"}
        </span>
      </div>

      {/* Country compliance card — portal-style fixed overlay */}
      <CountryComplianceCard countryId={selectedCountry} onClose={closeCard} />
    </div>
  );
}
