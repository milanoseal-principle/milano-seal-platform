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
}

export function GlobalTrustCoreHero() {
  const [settled, setSettled] = useState(false);
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

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
    </div>
  );
}
