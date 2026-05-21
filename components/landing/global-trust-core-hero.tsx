"use client";

import { useEffect, useRef, useState } from "react";

// Sphere coordinate system: 400×400 viewBox (for arcs/nodes, overlaid)
// Continents: 800×400 viewBox (200% wide — scrolls for rotation illusion)

const FLORIDA = { x: 75, y: 293 };

const DESTINATIONS = [
  { id: "italy",  label: "Italy",  x: 268, y: 150, delay: 0   },
  { id: "spain",  label: "Spain",  x: 208, y: 140, delay: 220 },
  { id: "brazil", label: "Brazil", x: 122, y: 282, delay: 440 },
  { id: "uae",    label: "UAE",    x: 334, y: 202, delay: 660 },
];

function makeCurvedPath(
  from: { x: number; y: number },
  to:   { x: number; y: number }
): string {
  const mx = (from.x + to.x) / 2;
  const my = Math.min(from.y, to.y) - 94;
  return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
}

// Continent dots: 800×400 viewBox
// Front face: cx in 0–400, duplicate: cx + 400 for seamless scroll
const RAW_DOTS = [
  // North America
  { cx: 78,  cy: 143, r: 2.5 }, { cx: 93,  cy: 134, r: 2   },
  { cx: 108, cy: 150, r: 2   }, { cx: 85,  cy: 160, r: 1.5 },
  { cx: 100, cy: 168, r: 1.5 }, { cx: 72,  cy: 156, r: 1.5 },
  { cx: 115, cy: 144, r: 1.5 }, { cx: 90,  cy: 150, r: 1   },
  { cx: 77,  cy: 172, r: 1   }, { cx: 105, cy: 160, r: 1   },
  { cx: 65,  cy: 148, r: 1   }, { cx: 95,  cy: 172, r: 1   },
  // Central America
  { cx: 98,  cy: 218, r: 1.5 }, { cx: 108, cy: 226, r: 1   },
  // South America
  { cx: 113, cy: 243, r: 2.5 }, { cx: 127, cy: 256, r: 2   },
  { cx: 116, cy: 268, r: 2   }, { cx: 134, cy: 248, r: 1.5 },
  { cx: 120, cy: 277, r: 1.5 }, { cx: 140, cy: 260, r: 1   },
  { cx: 108, cy: 258, r: 1   }, { cx: 130, cy: 272, r: 1   },
  // Europe
  { cx: 212, cy: 128, r: 2   }, { cx: 223, cy: 122, r: 2   },
  { cx: 236, cy: 130, r: 1.5 }, { cx: 218, cy: 140, r: 1.5 },
  { cx: 206, cy: 137, r: 1.5 }, { cx: 228, cy: 115, r: 1.5 },
  { cx: 241, cy: 125, r: 1   }, { cx: 214, cy: 148, r: 1   },
  { cx: 230, cy: 135, r: 1   }, { cx: 244, cy: 138, r: 1   },
  // Africa
  { cx: 218, cy: 192, r: 2.5 }, { cx: 233, cy: 208, r: 2   },
  { cx: 213, cy: 213, r: 2   }, { cx: 240, cy: 196, r: 1.5 },
  { cx: 225, cy: 225, r: 1.5 }, { cx: 208, cy: 202, r: 1   },
  { cx: 236, cy: 220, r: 1   }, { cx: 222, cy: 236, r: 1   },
  { cx: 228, cy: 215, r: 1   },
  // Middle East
  { cx: 272, cy: 164, r: 2   }, { cx: 284, cy: 175, r: 1.5 },
  { cx: 266, cy: 178, r: 1.5 }, { cx: 276, cy: 184, r: 1   },
  // Asia
  { cx: 308, cy: 144, r: 2.5 }, { cx: 324, cy: 136, r: 2   },
  { cx: 316, cy: 158, r: 2   }, { cx: 334, cy: 152, r: 1.5 },
  { cx: 299, cy: 155, r: 1.5 }, { cx: 342, cy: 143, r: 1   },
  { cx: 318, cy: 168, r: 1   }, { cx: 346, cy: 155, r: 1   },
  // Australia
  { cx: 330, cy: 256, r: 2.5 }, { cx: 348, cy: 250, r: 2   },
  { cx: 337, cy: 266, r: 1.5 }, { cx: 354, cy: 258, r: 1   },
];

const ALL_DOTS = [
  ...RAW_DOTS,
  ...RAW_DOTS.map(d => ({ ...d, cx: d.cx + 400 })),
];

export function GlobalTrustCoreHero() {
  const [phase, setPhase] = useState<"idle" | "settled" | "arcs" | "rotating">("idle");
  const [arcsDone, setArcsDone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = mql.matches;
    setReducedMotion(reduced);

    if (reduced) {
      // Static final state — no animation
      setPhase("rotating");
      setArcsDone(true);
      return;
    }

    // Sphere settles first (CSS transition handles opacity/scale)
    timers.current.push(setTimeout(() => setPhase("settled"), 80));
    // Arcs draw after globe is ~90% visible (~1.1s from mount)
    timers.current.push(setTimeout(() => setPhase("arcs"), 1100));
    // Arcs complete: last arc starts at 660ms delay + 600ms draw = 1260ms after arcs phase
    timers.current.push(setTimeout(() => {
      setArcsDone(true);
      setPhase("rotating");
    }, 2500));

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
          isSettled         && "ms-globe-sphere--visible",
          phase === "rotating" && "ms-globe-sphere--rotating",
        ].filter(Boolean).join(" ")}
      >
        {/* Latitude / longitude atmospheric grid */}
        <svg viewBox="0 0 400 400" className="ms-globe-grid-svg" aria-hidden="true">
          {/* Equator */}
          <ellipse cx="200" cy="200" rx="193" ry="40"  fill="none" stroke="#C6A55A" strokeWidth="0.4" opacity="0.10" />
          {/* Tropics */}
          <ellipse cx="200" cy="145" rx="171" ry="32"  fill="none" stroke="#C6A55A" strokeWidth="0.3" opacity="0.07" />
          <ellipse cx="200" cy="255" rx="171" ry="32"  fill="none" stroke="#C6A55A" strokeWidth="0.3" opacity="0.07" />
          {/* Meridians */}
          <ellipse cx="200" cy="200" rx="40"  ry="193" fill="none" stroke="#C6A55A" strokeWidth="0.3" opacity="0.08" />
          <ellipse cx="200" cy="200" rx="103" ry="193" fill="none" stroke="#C6A55A" strokeWidth="0.2" opacity="0.05" />
          <ellipse cx="200" cy="200" rx="156" ry="193" fill="none" stroke="#C6A55A" strokeWidth="0.2" opacity="0.04" />
        </svg>

        {/* Continent impression — 200% wide, scrolls for rotation illusion */}
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
              opacity="0.46"
            />
          ))}
        </svg>

        {/* Route arcs, nodes, particles */}
        <svg
          viewBox="0 0 400 400"
          className="ms-globe-arcs-svg"
          aria-hidden="true"
        >
          <defs>
            {/* Invisible path defs for animateMotion */}
            {DESTINATIONS.map(dest => (
              <path
                key={`def-${dest.id}`}
                id={`gtc-arc-${dest.id}`}
                d={makeCurvedPath(FLORIDA, { x: dest.x, y: dest.y })}
                fill="none"
              />
            ))}
            <filter id="gtc-glow-arc"  x="-60%" y="-60%" width="220%" height="220%">
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

          {/* Visible arc lines */}
          {DESTINATIONS.map(dest => (
            <path
              key={`arc-${dest.id}`}
              d={makeCurvedPath(FLORIDA, { x: dest.x, y: dest.y })}
              stroke="#C6A55A"
              strokeWidth="0.85"
              fill="none"
              opacity="0.58"
              filter="url(#gtc-glow-arc)"
              className={`ms-globe-arc${showArcs ? " ms-globe-arc--drawn" : ""}`}
              style={showArcs ? { animationDelay: `${dest.delay}ms` } : undefined}
            />
          ))}

          {/* Travel particles — one per route */}
          {showArcs && !reducedMotion && DESTINATIONS.map(dest => (
            <circle key={`ptcl-${dest.id}`} r="1.8" fill="#F4E5B8" opacity="0.88">
              <animateMotion
                dur="2.8s"
                begin={`${(dest.delay / 1000) + 0.65}s`}
                repeatCount="indefinite"
              >
                <mpath href={`#gtc-arc-${dest.id}`} />
              </animateMotion>
            </circle>
          ))}

          {/* Destination nodes */}
          {DESTINATIONS.map((dest, i) => (
            <g key={`node-${dest.id}`}>
              <circle
                cx={dest.x} cy={dest.y}
                r="3.5"
                fill="#D4AF37"
                filter="url(#gtc-glow-node)"
                opacity={arcsDone ? 1 : 0}
                className={arcsDone
                  ? "ms-globe-dest-node ms-globe-dest-node--pulse"
                  : "ms-globe-dest-node"}
                style={{ transitionDelay: `${dest.delay}ms` }}
              />
              <circle
                cx={dest.x} cy={dest.y}
                r="8.5"
                fill="none"
                stroke="#C6A55A"
                strokeWidth="0.7"
                opacity={arcsDone ? 0.25 : 0}
                className="ms-globe-dest-ring"
                style={{ transitionDelay: `${dest.delay + 120}ms` }}
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
          ))}
        </svg>

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
    </div>
  );
}
