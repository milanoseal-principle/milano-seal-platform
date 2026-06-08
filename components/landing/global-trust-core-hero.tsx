"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const FLORIDA = { x: 108, y: 190 };

const DESTINATIONS = [
  { id: "spain",    label: "Spain",    x: 220, y: 110, framework: "Hague Convention Routing",         seoIntent: "apostille-spain" },
  { id: "italy",    label: "Italy",    x: 240, y: 105, framework: "Hague Convention Routing",         seoIntent: "apostille-italy" },
  { id: "uae",      label: "UAE",      x: 310, y: 150, framework: "Consular Authentication Workflow",  seoIntent: "apostille-uae" },
  { id: "brazil",   label: "Brazil",   x: 145, y: 270, framework: "International Release Corridor",   seoIntent: "apostille-brazil" },
  { id: "mexico",   label: "Mexico",   x: 90,  y: 210, framework: "Hague Convention Routing",         seoIntent: "apostille-mexico" },
  { id: "portugal", label: "Portugal", x: 205, y: 118, framework: "Hague Apostille Review Path",      seoIntent: "apostille-portugal" },
  { id: "greece",   label: "Greece",   x: 252, y: 115, framework: "Hague Convention Document Route", seoIntent: "apostille-greece" },
];

function makeCurvedPath(a: {x:number;y:number}, b: {x:number;y:number}) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - 55;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

function useScramble(target: string, active: boolean, tick: number) {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 /";
  const [display, setDisplay] = useState("");
  const stepRef = useRef(0);
  useEffect(() => {
    if (!active) { setDisplay(""); stepRef.current = 0; return; }
    if (stepRef.current >= target.length) { setDisplay(target); return; }
    const revealed = target.slice(0, stepRef.current);
    const rest = target.slice(stepRef.current).split("").map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
    setDisplay(revealed + rest);
    stepRef.current = Math.min(stepRef.current + 2, target.length);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, active]);
  return display;
}

export function GlobalTrustCoreHero() {
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [arcsDone,    setArcsDone]    = useState(false);
  const [isSettled,   setIsSettled]   = useState(false);
  const [sphereVis,   setSphereVis]   = useState(false);
  const [scrambleTick, setScrambleTick] = useState(0);

  const isFloridaSelected = selectedId === "__florida__";
  const selectedDest = DESTINATIONS.find(d => d.id === selectedId) ?? null;
  const scrambleText = selectedDest
    ? `${selectedDest.label.toUpperCase()} // ${selectedDest.framework}`
    : "";
  const scrambledText = useScramble(scrambleText, !!selectedDest, scrambleTick);

  useEffect(() => {
    const t0 = setTimeout(() => setSphereVis(true),  120);
    const t1 = setTimeout(() => setArcsDone(true),  1800);
    const t2 = setTimeout(() => setIsSettled(true), 2200);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (!selectedDest) return;
    const iv = setInterval(() => setScrambleTick(t => t + 1), 55);
    return () => clearInterval(iv);
  }, [selectedDest]);

  const nudgeX = selectedDest ? ((selectedDest.x - 200) / 200) * 2.5 : 0;
  const nudgeY = selectedDest ? ((selectedDest.y - 200) / 200) * 1.5 : 0;

  const popLeft   = selectedDest ? `${Math.min(80, Math.max(5,  (selectedDest.x / 400) * 100))}%` : "50%";
  const popTop    = selectedDest ? `${Math.min(82, Math.max(12, (selectedDest.y / 400) * 100))}%` : "50%";
  const popAnchor = selectedDest && selectedDest.x > 200 ? "translateX(-100%)" : "translateX(0)";

  const handleNodeClick = useCallback((id: string) => {
    if (!arcsDone) return;
    setSelectedId(prev => prev === id ? null : id);
  }, [arcsDone]);

  return (
    <div className="ms-globe-container" style={{ position: "relative" }}>
      <div className="ms-globe-bloom" />

      {/* Sphere */}
      <div
        className={`ms-globe-sphere${sphereVis ? " ms-globe-sphere--visible" : ""}`}
        style={{
          transition: "transform 0.9s cubic-bezier(0.16,1,0.3,1)",
          transform: `translate(${nudgeX}%, ${nudgeY}%) scale(1)`,
        }}
        onClick={() => setSelectedId(null)}
      >
        <svg
          viewBox="0 0 400 400"
          width="100%" height="100%"
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <defs>
            <filter id="gtc-glow-node" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="gtc-glow-arc" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="gtc-bloom-node" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* Florida origin — clickable */}
          <g
            style={{ cursor: isSettled ? "pointer" : "default" }}
            onClick={(e) => { e.stopPropagation(); isSettled && handleNodeClick("__florida__"); }}
          >
            <circle cx={FLORIDA.x} cy={FLORIDA.y} r="18" fill="transparent" />
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
            )}
          </g>

          {/* Per-route */}
          {DESTINATIONS.map((dest, i) => {
            const path       = makeCurvedPath(FLORIDA, { x: dest.x, y: dest.y });
            const isSelected = selectedId === dest.id;
            const isDimmed   = !!selectedId && !isSelected;
            const delay      = i * 0.18;

            return (
              <g key={dest.id}>
                {/* Arc */}
                <path
                  d={path}
                  fill="none"
                  stroke={isSelected ? "rgba(212,175,55,0.9)" : "rgba(198,165,90,0.28)"}
                  strokeWidth={isSelected ? 1.2 : 0.7}
                  strokeDasharray={arcsDone ? "none" : "4 6"}
                  filter={isSelected ? "url(#gtc-glow-arc)" : undefined}
                  opacity={isDimmed ? 0.12 : 1}
                  style={{ transition: "opacity 0.4s, stroke 0.4s" }}
                  className={arcsDone ? undefined : "ms-arc-draw"}
                />

                {/* Destination node */}
                <g
                  style={{ cursor: arcsDone ? "pointer" : "default", pointerEvents: "all" }}
                  onClick={(e) => { e.stopPropagation(); handleNodeClick(dest.id); }}
                  data-auth-node={dest.id}
                >
                  {/* Hit area */}
                  <circle cx={dest.x} cy={dest.y} r="18" fill="transparent" />

                  {/* Bloom glow */}
                  <circle
                    cx={dest.x} cy={dest.y} r="9"
                    fill="rgba(212,175,55,0.15)"
                    filter="url(#gtc-bloom-node)"
                    opacity={arcsDone ? (isDimmed ? 0.1 : 0.7) : 0}
                    style={{ transition: "opacity 0.6s" }}
                    className={arcsDone ? "ms-globe-dest-bloom" : undefined}
                  />

                  {/* Node dot */}
                  <circle
                    cx={dest.x} cy={dest.y} r={isSelected ? 4.5 : 3}
                    fill={isSelected ? "#D4AF37" : "rgba(198,165,90,0.75)"}
                    filter={isSelected ? "url(#gtc-glow-node)" : undefined}
                    opacity={arcsDone ? (isDimmed ? 0.15 : 1) : 0}
                    style={{ transition: "all 0.4s", transitionDelay: `${delay}s` }}
                    className={arcsDone ? "ms-globe-dest-pulse" : undefined}
                  />

                  {/* Label */}
                  {arcsDone && (
                    <text
                      x={dest.x + (dest.x > 200 ? -8 : 8)}
                      y={dest.y - 9}
                      textAnchor={dest.x > 200 ? "end" : "start"}
                      className="ms-globe-location-text"
                      opacity={isDimmed ? 0.15 : 1}
                      style={{ transition: "opacity 0.4s", transitionDelay: `${delay}s` }}
                    >
                      {dest.label.toUpperCase()}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </svg>

        {/* Crest glow */}
        <div className="ms-globe-crest-glow" />
        {/* Center shield — programmatic, no PNG */}
        <div className="ms-globe-crest" aria-hidden="true">
          <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 7, fontWeight: 500, letterSpacing: "0.32em", color: "rgba(198,165,90,0.75)", textTransform: "uppercase", lineHeight: 1 }}>MILANO</span>
          <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 6, fontWeight: 300, letterSpacing: "0.38em", color: "rgba(120,100,60,0.6)", textTransform: "uppercase", lineHeight: 1 }}>SEAL</span>
        </div>
        {/* Spotlight */}
        <div className="ms-globe-spotlight" />
      </div>

      {/* Destination popover — rendered outside sphere, never overlaps node SVG layer */}
      {selectedDest && (
        <div
          className="ms-destination-popover hidden md:block"
          style={{
            position: "absolute",
            left: popLeft,
            top: popTop,
            transform: popAnchor,
            zIndex: 30,
            pointerEvents: "none",
          }}
          data-seo-intent={selectedDest.seoIntent}
        >
          <div
            className="bg-[#050507]/92 border border-[#D4AF37]/25 rounded-xl px-4 py-3.5 shadow-2xl"
            style={{
              width: "13.5rem",
              pointerEvents: "auto",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              animation: "gtc-popover-in 0.2s cubic-bezier(0.16,1,0.3,1) both",
              pointerEvents: "auto",
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

      {/* Label row */}
      <div className={`ms-globe-label${isSettled ? " ms-globe-label--visible" : ""}`}>
        <span className="ms-globe-label-text">Global Trust Core™</span>
        <span className="ms-globe-label-sub">
          {selectedDest
            ? `${selectedDest.label} · ${selectedDest.framework}`
            : isFloridaSelected
            ? "Florida · U.S. Execution Hub"
            : "Hague Route Reviewed · Structured International Release"}
        </span>
      </div>

      {/* CTA chip */}
      {isSettled && (
        <Link
          href="/map"
          className="ms-globe-cta-chip"
          aria-label="Explore all document routes"
        >
          Explore All Routes →
        </Link>
      )}
    </div>
  );
}
