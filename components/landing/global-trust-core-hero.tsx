"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const FLORIDA = { x: 108, y: 190 };

type HagueStatus = "HAGUE" | "AUTHORITY_REVIEW" | "CONSULAR_REVIEW";

interface Destination {
  id: string;
  label: string;
  x: number; y: number;
  dur: number; startDelay: number;
  framework: string;
  seoIntent: string;
  isoCode: string;
  routeLabel: string;
  hagueStatus: HagueStatus;
  useCases: string[];
  safeSummary: string;
}

const DESTINATIONS: Destination[] = [
  {
    id: "italy",
    label: "Italy",
    x: 255, y: 105,
    dur: 2.4, startDelay: 0.0,
    framework: "HAGUE CONVENTION ROUTING",
    seoIntent: "/jurisdictions/italy-apostille-coordination",
    isoCode: "JURISDICTION_ISO_IT",
    routeLabel: "Hague Apostille Route",
    hagueStatus: "HAGUE",
    useCases: ["Citizenship", "POA", "Affidavit", "Civil Records"],
    safeSummary: "Florida-origin documents routed for Italian receiving-authority review.",
  },
  {
    id: "spain",
    label: "Spain",
    x: 208, y: 122,
    dur: 2.8, startDelay: 0.7,
    framework: "HAGUE CONVENTION ROUTING",
    seoIntent: "/jurisdictions/spain-international-release-coordination",
    isoCode: "JURISDICTION_ISO_ES",
    routeLabel: "Hague Apostille Route",
    hagueStatus: "HAGUE",
    useCases: ["Real Estate", "Residency", "POA", "Corporate"],
    safeSummary: "Structured U.S. execution support for Spanish destination use.",
  },
  {
    id: "portugal",
    label: "Portugal",
    x: 192, y: 134,
    dur: 2.9, startDelay: 1.1,
    framework: "HAGUE CONVENTION ROUTING",
    seoIntent: "/jurisdictions/portugal-apostille-coordination",
    isoCode: "JURISDICTION_ISO_PT",
    routeLabel: "Hague Apostille Route",
    hagueStatus: "HAGUE",
    useCases: ["Residency", "D8 Visa", "POA", "Banking"],
    safeSummary: "U.S. document execution support for Portugal residency and private-client matters.",
  },
  {
    id: "greece",
    label: "Greece",
    x: 282, y: 118,
    dur: 2.7, startDelay: 0.9,
    framework: "HAGUE CONVENTION ROUTING",
    seoIntent: "/jurisdictions/greece-apostille-coordination",
    isoCode: "JURISDICTION_ISO_GR",
    routeLabel: "Hague Apostille Route",
    hagueStatus: "HAGUE",
    useCases: ["Citizenship", "Property", "Inheritance", "Maritime"],
    safeSummary: "Boutique U.S. execution coordination for Greek international matters.",
  },
  {
    id: "brazil",
    label: "Brazil",
    x: 118, y: 268,
    dur: 3.1, startDelay: 1.4,
    framework: "HAGUE CONVENTION ROUTING",
    seoIntent: "/jurisdictions/brazil-hague-convention-routing",
    isoCode: "JURISDICTION_ISO_BR",
    routeLabel: "Hague Apostille Route",
    hagueStatus: "HAGUE",
    useCases: ["Corporate", "Medical", "POA", "Academic"],
    safeSummary: "Florida-origin documents routed for Brazilian receiving-authority review.",
  },
  {
    id: "uae",
    label: "UAE",
    x: 330, y: 192,
    dur: 2.6, startDelay: 0.3,
    framework: "CONSULAR AUTHENTICATION TRACK",
    seoIntent: "/apostille/uae",
    isoCode: "JURISDICTION_ISO_AE",
    routeLabel: "Consular Legalization Review",
    hagueStatus: "CONSULAR_REVIEW",
    useCases: ["Corporate", "Private Wealth", "Commercial", "Authentication"],
    safeSummary: "Non-standard authentication and consular review may apply.",
  },
  {
    id: "mexico",
    label: "Mexico",
    x: 62, y: 222,
    dur: 1.8, startDelay: 2.1,
    framework: "HAGUE CONVENTION ROUTING",
    seoIntent: "/jurisdictions/mexico-hague-convention-routing",
    isoCode: "JURISDICTION_ISO_MX",
    routeLabel: "Authority Review Required",
    hagueStatus: "AUTHORITY_REVIEW",
    useCases: ["Real Estate", "Family", "Corporate", "Translation"],
    safeSummary: "Cross-border U.S. execution coordination requiring destination-specific review.",
  },
  {
    id: "uk",
    label: "UK",
    x: 228, y: 88,
    dur: 2.5, startDelay: 0.5,
    framework: "HAGUE CONVENTION ROUTING",
    seoIntent: "/jurisdictions/uk-apostille-coordination",
    isoCode: "JURISDICTION_ISO_GB",
    routeLabel: "Hague Apostille Route",
    hagueStatus: "HAGUE",
    useCases: ["Corporate", "Estate", "Academic", "POA"],
    safeSummary: "U.S. document execution support for United Kingdom destination use.",
  },
  {
    id: "canada",
    label: "Canada",
    x: 110, y: 112,
    dur: 1.5, startDelay: 2.5,
    framework: "AUTHORITY REVIEW REQUIRED",
    seoIntent: "/jurisdictions/canada-authentication",
    isoCode: "JURISDICTION_ISO_CA",
    routeLabel: "Authentication Review",
    hagueStatus: "AUTHORITY_REVIEW",
    useCases: ["Corporate", "Academic", "Immigration", "Identity"],
    safeSummary: "Destination-specific review required based on document type and receiving authority.",
  },
  {
    id: "colombia",
    label: "Colombia",
    x: 96, y: 252,
    dur: 2.2, startDelay: 1.8,
    framework: "HAGUE CONVENTION ROUTING",
    seoIntent: "/jurisdictions/colombia-apostille-coordination",
    isoCode: "JURISDICTION_ISO_CO",
    routeLabel: "Hague Apostille Route",
    hagueStatus: "HAGUE",
    useCases: ["Family", "Real Estate", "Corporate", "POA"],
    safeSummary: "U.S. execution coordination for Colombian destination matters.",
  },
];

function hagueColor(status: HagueStatus) {
  if (status === "HAGUE") return { dot: "#D4AF37", badge: "#D4AF37", arc: "#C6A55A" };
  if (status === "AUTHORITY_REVIEW") return { dot: "#C8A03E", badge: "#C8A03E", arc: "#B89038" };
  return { dot: "#B8842A", badge: "#B8842A", arc: "#A87828" };
}

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

// Geodesic lat/lon lines (viewBox 0 0 400 400, sphere cx=200 cy=200 r=193)
const LAT_YS = [110, 145, 172, 200, 228, 255, 290];
const LON_ANGLES = [0, 30, 60, 90, 120, 150];

export function GlobalTrustCoreHero() {
  const [phase, setPhase] = useState<"idle" | "settled" | "arcs" | "rotating">("idle");
  const [arcsDone, setArcsDone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scrambleTick, setScrambleTick] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const selectedDest = DESTINATIONS.find(d => d.id === selectedId) ?? null;
  const scrambleText = selectedDest
    ? `FLORIDA → ${selectedDest.label.toUpperCase()}`
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

  const isSettled  = phase !== "idle";
  const showArcs   = phase === "arcs" || phase === "rotating";
  const isRotating = phase === "rotating" && !selectedId;

  const nudgeX = selectedDest ? ((selectedDest.x - 200) / 200) * 2.5 : 0;
  const nudgeY = selectedDest ? ((selectedDest.y - 200) / 200) * 1.5 : 0;

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
      <div className="ms-globe-bloom" />

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
        {/* Geodesic grid — latitude + longitude lines */}
        <svg
          viewBox="0 0 400 400"
          className="ms-globe-grid-svg ms-globe-grid-svg--defocus"
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden" }}
        >
          <defs>
            <clipPath id="gtc-sphere-clip">
              <circle cx="200" cy="200" r="193" />
            </clipPath>
          </defs>
          <g clipPath="url(#gtc-sphere-clip)" opacity="1">
            {/* Latitude ellipses */}
            {LAT_YS.map(y => {
              const ratio = Math.sqrt(Math.max(0, 1 - Math.pow((y - 200) / 193, 2)));
              const rx = 193 * ratio;
              const ry = Math.max(4, 22 * ratio);
              return rx > 5 ? (
                <ellipse key={`lat-${y}`} cx="200" cy={y} rx={rx} ry={ry}
                  fill="none" stroke="#C6A55A" strokeWidth="0.35" opacity="0.09" />
              ) : null;
            })}
            {/* Longitude meridians */}
            {LON_ANGLES.map(a => (
              <ellipse key={`lon-${a}`} cx="200" cy="200" rx="12" ry="193"
                fill="none" stroke="#C6A55A" strokeWidth="0.3" opacity="0.07"
                transform={`rotate(${a}, 200, 200)`} />
            ))}
          </g>
          {/* Equator highlight */}
          <ellipse cx="200" cy="200" rx="193" ry="40"
            fill="none" stroke="#C6A55A" strokeWidth="0.5" opacity="0.12"
            clipPath="url(#gtc-sphere-clip)" />
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
            style={{ animation: isSettled && !reducedMotion ? "msOriginPulse 5s ease-in-out infinite" : "none" }}
          />
          <circle
            cx={FLORIDA.x} cy={FLORIDA.y} r="13"
            fill="none" stroke="#C6A55A" strokeWidth="0.8"
            opacity={isSettled ? 0.28 : 0}
            className="ms-globe-origin-ring"
          />
          {/* Bright inner core */}
          {isSettled && (
            <circle cx={FLORIDA.x} cy={FLORIDA.y} r="2" fill="#F5F1E8" opacity="0.9" />
          )}
          {/* Florida label — left of node to avoid crest overlap */}
          {isSettled && (
            <>
              <text x={FLORIDA.x - 16} y={FLORIDA.y - 4} className="ms-globe-location-text"
                textAnchor="end" style={{ fontSize: "7.5px", letterSpacing: "0.08em" }}>
                FLORIDA
              </text>
              <text x={FLORIDA.x - 16} y={FLORIDA.y + 6} className="ms-globe-location-text"
                textAnchor="end" style={{ fontSize: "6px", opacity: 0.5, letterSpacing: "0.06em" }}>
                ORIGIN
              </text>
            </>
          )}

          {/* Per-route */}
          {DESTINATIONS.map((dest, i) => {
            const { arc, dot } = hagueColor(dest.hagueStatus);
            const path       = makeCurvedPath(FLORIDA, { x: dest.x, y: dest.y });
            const isSelected = selectedId === dest.id;
            const isDimmed   = !!selectedId && !isSelected;

            const ghostOpacity  = isDimmed ? 0.015 : (showArcs ? 0.09 : 0);
            const fringeOpacity = isDimmed ? 0      : (showArcs ? 0.35 : 0);
            const fringeOpacity2 = isDimmed ? 0     : (showArcs ? 0.22 : 0);
            const bodyStroke    = isSelected ? "#F0C84A" : arc;
            const headStroke    = isSelected ? "#FFFFFF" : "#FFF5DC";
            const bodyFilter    = isSelected ? "url(#gtc-glow-arc-bright)" : "url(#gtc-glow-arc)";
            const bloomOpacity  = arcsDone ? (isDimmed ? 0.2 : 1) : 0;

            return (
              <g key={dest.id}>
                <path d={path} stroke="#F4E5B8" strokeWidth="0.85" fill="none"
                  opacity={fringeOpacity} transform="translate(-1,0)"
                  style={{ transition: "opacity 0.5s ease" }} />
                <path d={path} stroke="#9B9488" strokeWidth="0.85" fill="none"
                  opacity={fringeOpacity2} transform="translate(1,0)"
                  style={{ transition: "opacity 0.5s ease" }} />
                <path d={path} stroke={arc} strokeWidth="0.6" fill="none"
                  opacity={ghostOpacity}
                  style={{ transition: "opacity 0.4s ease" }} />

                {/* Shimmer sweep — from GlobalDocumentGlobe */}
                {showArcs && !reducedMotion && !isDimmed && (
                  <path
                    d={path}
                    fill="none"
                    stroke="#E3C46F"
                    strokeWidth="1"
                    strokeDasharray="0.18 0.82"
                    pathLength="1"
                    opacity="0"
                    style={{ animation: `msRouteSweep 9s ease-in-out ${dest.startDelay + 2.5}s infinite` }}
                  />
                )}

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
                  fill={dot} filter="url(#gtc-bloom-node)"
                  opacity={bloomOpacity}
                  className={arcsDone ? "ms-globe-dest-bloom" : ""}
                  style={{ transition: "opacity 0.5s ease" }}
                />

                {/* Clickable node */}
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
                  <circle cx={dest.x} cy={dest.y} r="18" fill="transparent" />

                  {/* Outer glow ring */}
                  <circle
                    cx={dest.x} cy={dest.y}
                    r={isSelected ? 10 : 6}
                    fill={dot} opacity={arcsDone ? (isSelected ? 0.18 : 0.08) : 0}
                    style={{ transition: "r 0.25s ease, opacity 0.25s ease" }}
                  />

                  {/* Core */}
                  <circle
                    cx={dest.x} cy={dest.y}
                    r={isSelected ? 5 : 3.5}
                    fill={isSelected ? "#F0C84A" : dot}
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
                  {/* Bright inner */}
                  {arcsDone && isSelected && (
                    <circle cx={dest.x} cy={dest.y} r="1.5" fill="#F5F1E8" opacity="0.9" />
                  )}

                  {/* Node ring */}
                  <circle
                    cx={dest.x} cy={dest.y}
                    r={isSelected ? 12 : 8.5}
                    fill="none"
                    stroke={dot}
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
                        fontSize: "8px",
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

        <div className="ms-globe-glass-cap" />
        <div className="ms-globe-crest-glow" />
        <div className="ms-globe-crest" aria-hidden="true" />
        <div className="ms-globe-spotlight" />
      </div>

      {/* Rich destination popover — matches GlobalDocumentGlobe style */}
      {selectedDest && (() => {
        const { badge } = hagueColor(selectedDest.hagueStatus);
        return (
          <div
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
              style={{
                width: "min(230px, calc(100vw - 3rem))",
                background: "rgba(5,5,7,0.97)",
                border: `1px solid ${badge}38`,
                borderRadius: 4,
                padding: "14px 16px 12px",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.9), 0 0 0 1px rgba(212,175,55,0.04)",
                animation: "gtc-popover-in 0.22s cubic-bezier(0.16,1,0.3,1) both",
              }}
            >
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-2.5 right-3 font-mono text-[#3A3A3A] hover:text-[#888] transition-colors text-base leading-none"
                aria-label="Close"
              >
                ×
              </button>

              {/* Header */}
              <p style={{ color: "#F5F1E8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>
                {scrambledText}
              </p>

              {/* Route badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: selectedDest.hagueStatus === "HAGUE" ? badge : "transparent",
                  border: selectedDest.hagueStatus !== "HAGUE" ? `1px solid ${badge}` : "none",
                }} />
                <span style={{ color: badge, fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace" }}>
                  {selectedDest.routeLabel.toUpperCase()}
                </span>
              </div>

              {/* Use cases */}
              <p style={{ color: "#8A8480", fontSize: 9, marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>
                {selectedDest.useCases.slice(0, 3).join(" · ")}
              </p>

              {/* Safe summary */}
              <p style={{ color: "#555250", fontSize: 8.5, lineHeight: 1.55, marginBottom: 10, fontFamily: "system-ui, sans-serif" }}>
                {selectedDest.safeSummary}
              </p>

              {/* CTA */}
              <Link
                href="/intake"
                onClick={() => setSelectedId(null)}
                style={{
                  display: "block",
                  background: "rgba(212,175,55,0.08)",
                  border: "1px solid rgba(212,175,55,0.30)",
                  color: "#D4AF37",
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "7px 10px",
                  textAlign: "center",
                  textDecoration: "none",
                  borderRadius: 2,
                  fontFamily: "monospace",
                  transition: "background 0.2s ease, border-color 0.2s ease",
                }}
              >
                Begin Secure Intake →
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Orbit rings */}
      <div className="ms-orbit-ring ms-orbit-ring--main" />
      <div className="ms-orbit-ring ms-orbit-ring--outer" />

      {/* Label row */}
      <div className={`ms-globe-label${isSettled ? " ms-globe-label--visible" : ""}`}>
        <span className="ms-globe-label-text">Global Trust Core™</span>
        <span className="ms-globe-label-sub">
          {selectedDest
            ? `${selectedDest.label} · ${selectedDest.routeLabel}`
            : arcsDone
              ? "Hague Route Reviewed · Structured International Release"
              : "Florida Origin · Execution Authority"}
        </span>
      </div>
    </div>
  );
}
