"use client";

import { useEffect, useRef, useState } from "react";

// Route arc definitions: from Florida (bottom-left) to destinations
// SVG viewBox 400×400, Florida origin at ~(60, 300)
const FLORIDA = { x: 60, y: 300 };

const DESTINATIONS = [
  { label: "Italy", x: 260, y: 160, delay: 0 },
  { label: "Spain", x: 200, y: 150, delay: 200 },
  { label: "Brazil", x: 130, y: 290, delay: 400 },
  { label: "UAE", x: 330, y: 210, delay: 600 },
];

function makeCurvedPath(
  from: { x: number; y: number },
  to: { x: number; y: number }
): string {
  // Control point: midpoint lifted toward top-center of globe
  const mx = (from.x + to.x) / 2;
  const my = Math.min(from.y, to.y) - 80;
  return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
}

// Approximate continent dot clusters (simple SVG circles)
// These give a rough continental impression on the sphere face
const CONTINENT_DOTS = [
  // North America
  { cx: 80, cy: 155, r: 2 }, { cx: 95, cy: 148, r: 1.5 },
  { cx: 110, cy: 162, r: 1.5 }, { cx: 88, cy: 170, r: 1 },
  { cx: 102, cy: 175, r: 1 }, { cx: 75, cy: 165, r: 1 },
  // South America
  { cx: 120, cy: 240, r: 2 }, { cx: 130, cy: 255, r: 1.5 },
  { cx: 118, cy: 265, r: 1.5 }, { cx: 135, cy: 248, r: 1 },
  // Europe
  { cx: 215, cy: 140, r: 1.5 }, { cx: 225, cy: 135, r: 1.5 },
  { cx: 235, cy: 142, r: 1 }, { cx: 220, cy: 150, r: 1 },
  { cx: 208, cy: 148, r: 1 }, { cx: 228, cy: 127, r: 1 },
  // Africa
  { cx: 220, cy: 200, r: 2 }, { cx: 235, cy: 215, r: 1.5 },
  { cx: 215, cy: 220, r: 1.5 }, { cx: 240, cy: 200, r: 1 },
  { cx: 225, cy: 230, r: 1 },
  // Middle East
  { cx: 275, cy: 175, r: 1.5 }, { cx: 285, cy: 183, r: 1 },
  { cx: 270, cy: 185, r: 1 },
  // Asia
  { cx: 310, cy: 155, r: 2 }, { cx: 325, cy: 148, r: 1.5 },
  { cx: 315, cy: 168, r: 1.5 }, { cx: 335, cy: 160, r: 1 },
  { cx: 300, cy: 165, r: 1 }, { cx: 340, cy: 150, r: 1 },
  // Australia
  { cx: 330, cy: 260, r: 2 }, { cx: 345, cy: 255, r: 1.5 },
  { cx: 335, cy: 270, r: 1 },
];

export function GlobalTrustCoreHero() {
  const [phase, setPhase] = useState<
    "idle" | "settled" | "arcs" | "rotating"
  >("idle");
  const [arcsDone, setArcsDone] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Phase 1: Globe settles/fades in
    timers.current.push(setTimeout(() => setPhase("settled"), 100));
    // Phase 2: Arc draw begins
    timers.current.push(setTimeout(() => setPhase("arcs"), 800));
    // Phase 3: After all arcs drawn (4 arcs × 300ms each + 600ms offset + 600ms duration)
    timers.current.push(
      setTimeout(() => {
        setArcsDone(true);
        setPhase("rotating");
      }, 2600)
    );
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const isSettled = phase !== "idle";
  const showArcs = phase === "arcs" || phase === "rotating";

  return (
    <div className="ms-globe-container" aria-hidden="true">
      {/* Outer glow bloom */}
      <div className="ms-globe-bloom" />

      {/* Sphere */}
      <div className={`ms-globe-sphere${isSettled ? " ms-globe-sphere--visible" : ""}${phase === "rotating" ? " ms-globe-sphere--rotating" : ""}`}>
        {/* Dot layer: continents */}
        <svg
          viewBox="0 0 400 400"
          className="ms-globe-dots-layer"
          xmlns="http://www.w3.org/2000/svg"
        >
          {CONTINENT_DOTS.map((dot, i) => (
            <circle
              key={i}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill="#C6A55A"
              opacity="0.55"
            />
          ))}
        </svg>

        {/* Route arcs SVG overlay */}
        <svg
          viewBox="0 0 400 400"
          className="ms-globe-arcs-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="arc-glow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Florida origin node */}
          <circle
            cx={FLORIDA.x}
            cy={FLORIDA.y}
            r="5"
            fill="#C6A55A"
            opacity={isSettled ? 1 : 0}
            className={`ms-globe-origin${isSettled ? " ms-globe-origin--glow" : ""}`}
          />
          <circle
            cx={FLORIDA.x}
            cy={FLORIDA.y}
            r="10"
            fill="none"
            stroke="#C6A55A"
            strokeWidth="1"
            opacity={isSettled ? 0.35 : 0}
            className="ms-globe-origin-ring"
          />

          {/* Route arcs */}
          {DESTINATIONS.map((dest, i) => (
            <g key={dest.label}>
              <path
                d={makeCurvedPath(FLORIDA, { x: dest.x, y: dest.y })}
                stroke="#C6A55A"
                strokeWidth="1"
                fill="none"
                opacity="0.65"
                filter="url(#arc-glow)"
                className={`ms-globe-arc${showArcs ? " ms-globe-arc--drawn" : ""}`}
                style={
                  showArcs
                    ? { animationDelay: `${dest.delay}ms` }
                    : undefined
                }
              />
              {/* Destination node */}
              <circle
                cx={dest.x}
                cy={dest.y}
                r="4"
                fill="#C6A55A"
                opacity={arcsDone ? 1 : 0}
                className={arcsDone ? "ms-globe-dest-node ms-globe-dest-node--pulse" : "ms-globe-dest-node"}
                style={{ transitionDelay: `${i * 100}ms` }}
              />
              <circle
                cx={dest.x}
                cy={dest.y}
                r="8"
                fill="none"
                stroke="#C6A55A"
                strokeWidth="0.75"
                opacity={arcsDone ? 0.3 : 0}
                className="ms-globe-dest-ring"
                style={{ transitionDelay: `${i * 100}ms` }}
              />
            </g>
          ))}
        </svg>

        {/* Center crest — gold M letterform */}
        <div className="ms-globe-crest">
          <span className="ms-globe-crest-letter">M</span>
        </div>

        {/* Spotlight top-left */}
        <div className="ms-globe-spotlight" />
      </div>

      {/* Orbit ring — outside sphere */}
      <div className="ms-orbit-ring ms-orbit-ring--main" />
      <div className="ms-orbit-ring ms-orbit-ring--outer" />

      {/* Label */}
      <div className={`ms-globe-label${isSettled ? " ms-globe-label--visible" : ""}`}>
        <span className="ms-globe-label-text">Global Trust Core™</span>
        <span className="ms-globe-label-sub">Florida → World · Execution Authority</span>
      </div>
    </div>
  );
}
