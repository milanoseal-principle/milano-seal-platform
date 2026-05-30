"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

const FLORIDA = { x: 108, y: 190 };

// Florida as a clickable origin node
const FLORIDA_NODE = {
  id: "florida",
  label: "Florida",
  x: 108, y: 190,
  framework: "EXECUTION ORIGIN",
  channel: "Florida Dept. of State Route",
  protocol: "RON or in-person execution · Apostille issuance",
  docs: ["Power of Attorney", "Affidavit", "Name Discrepancy Affidavit"],
  seoIntent: "/jurisdictions/florida-origin-document-execution",
  isoCode: "JURISDICTION_ISO_FL",
};

const DESTINATIONS = [
  {
    id: "italy",
    label: "Italy",
    x: 255, y: 105,
    dur: 2.4, startDelay: 0.0,
    framework: "HAGUE CONVENTION ROUTING",
    channel: "FL Dept. of State → International Release",
    protocol: "Liaison monitoring · Destination-specific review",
    docs: ["Power of Attorney", "Corporate Authorization", "Diploma Authentication"],
    seoIntent: "/jurisdictions/italy-apostille-coordination",
    isoCode: "JURISDICTION_ISO_IT",
  },
  {
    id: "spain",
    label: "Spain",
    x: 208, y: 122,
    dur: 2.8, startDelay: 0.7,
    framework: "HAGUE CONVENTION ROUTING",
    channel: "FL Dept. of State → International Release",
    protocol: "Civil registry verification · Release coordination",
    docs: ["Power of Attorney", "Marriage Certificate", "Academic Credentials"],
    seoIntent: "/jurisdictions/spain-international-release-coordination",
    isoCode: "JURISDICTION_ISO_ES",
  },
  {
    id: "brazil",
    label: "Brazil",
    x: 118, y: 268,
    dur: 3.1, startDelay: 1.4,
    framework: "HAGUE CONVENTION ROUTING",
    channel: "FL Dept. of State Route",
    protocol: "Notary seal validation · Accession 2016",
    docs: ["Power of Attorney", "Corporate Documents", "Birth Certificate"],
    seoIntent: "/jurisdictions/brazil-hague-convention-routing",
    isoCode: "JURISDICTION_ISO_BR",
  },
  {
    id: "uae",
    label: "UAE",
    x: 330, y: 192,
    dur: 2.6, startDelay: 0.3,
    framework: "CONSULAR AUTHENTICATION TRACK",
    channel: "Embassy / Consular Review",
    protocol: "Chain-of-custody control · Accession 2021",
    docs: ["Power of Attorney", "Commercial Agreements", "Corporate Documents"],
    seoIntent: "/jurisdictions/uae-consular-authentication-track",
    isoCode: "JURISDICTION_ISO_AE",
  },
  {
    id: "mexico",
    label: "Mexico",
    x: 62, y: 222,
    dur: 1.8, startDelay: 2.1,
    framework: "HAGUE CONVENTION ROUTING",
    channel: "State Authentication Channel",
    protocol: "Destination-specific review · Multi-page instruments",
    docs: ["Power of Attorney", "Corporate Authorization", "Birth Certificate"],
    seoIntent: "/jurisdictions/mexico-hague-convention-routing",
    isoCode: "JURISDICTION_ISO_MX",
  },
];

type AnyNode = typeof FLORIDA_NODE | typeof DESTINATIONS[0];

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scrambleTick, setScrambleTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [popFixed, setPopFixed] = useState<{ x: number; y: number; rightHemi: boolean } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const allNodes: AnyNode[] = [FLORIDA_NODE, ...DESTINATIONS];
  const selectedNode = allNodes.find(d => d.id === selectedId) ?? null;
  const scrambleText = selectedNode
    ? `${selectedNode.label.toUpperCase()} // ${selectedNode.framework}`
    : "";
  const scrambledText = useScramble(scrambleText, !!selectedNode, scrambleTick);

  // Compute viewport-absolute position for portal popover (bypasses overflow:hidden ancestors)
  const computePopPos = useCallback((node: AnyNode) => {
    if (!containerRef.current) return;
    const SRATIO = 0.81;
    const rect = containerRef.current.getBoundingClientRect();
    const sw = rect.width * SRATIO;
    const sh = rect.height * SRATIO;
    const sl = rect.left + (rect.width - sw) / 2;
    const st = rect.top + (rect.height - sh) / 2;
    setPopFixed({
      x: sl + (node.x / 400) * sw,
      y: st + (node.y / 400) * sh,
      rightHemi: node.x > 200,
    });
  }, []);

  const handleSelect = (node: AnyNode) => {
    if (!arcsDone) return;
    if (selectedId === node.id) {
      setSelectedId(null);
      setPopFixed(null);
    } else {
      setSelectedId(node.id);
      setScrambleTick(t => t + 1);
      computePopPos(node);
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

  // Update popover position on scroll/resize while open
  useEffect(() => {
    if (!selectedNode) { setPopFixed(null); return; }
    const update = () => computePopPos(selectedNode);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [selectedNode, computePopPos]);

  const isSettled  = phase !== "idle";
  const showArcs   = phase === "arcs" || phase === "rotating";
  const isRotating = phase === "rotating" && !selectedId;

  const nudgeX = selectedNode ? ((selectedNode.x - 200) / 200) * 2.5 : 0;
  const nudgeY = selectedNode ? ((selectedNode.y - 200) / 200) * 1.5 : 0;

  return (
    <div
      ref={containerRef}
      className="ms-globe-container"
      aria-label="Global document execution network"
      onClick={() => { setSelectedId(null); setPopFixed(null); }}
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

          {/* Florida origin — clickable */}
          <g
            style={{ cursor: arcsDone ? "pointer" : "default", pointerEvents: "all", outline: "none" }}
            role={arcsDone ? "button" : undefined}
            tabIndex={arcsDone ? 0 : undefined}
            aria-label="Florida origin — document execution"
            data-auth-node="FLORIDA_ORIGIN"
            data-target-vector={FLORIDA_NODE.isoCode}
            onClick={(e) => { e.stopPropagation(); handleSelect(FLORIDA_NODE); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSelect(FLORIDA_NODE); }}
          >
            <circle cx={FLORIDA.x} cy={FLORIDA.y} r="22" fill="transparent" />
            <circle
              cx={FLORIDA.x} cy={FLORIDA.y} r="5"
              fill={selectedId === "florida" ? "#F0C84A" : "#D4AF37"}
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
                  style={{ cursor: arcsDone ? "pointer" : "default", pointerEvents: "all", outline: "none" }}
                  role={arcsDone ? "button" : undefined}
                  tabIndex={arcsDone ? 0 : undefined}
                  aria-label={`${dest.label} routing information`}
                  data-auth-node="FLORIDA_ORIGIN"
                  data-target-vector={dest.isoCode}
                  onClick={(e) => { e.stopPropagation(); handleSelect(dest); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSelect(dest); }}
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

        {/* Glass specular cap */}
        <div className="ms-globe-glass-cap" />
        {/* Crest glow */}
        <div className="ms-globe-crest-glow" />
        {/* Milano Seal crest */}
        <div className="ms-globe-crest" aria-hidden="true" />
        {/* Spotlight */}
        <div className="ms-globe-spotlight" />
      </div>

      {/* Orbit rings */}
      <div className="ms-orbit-ring ms-orbit-ring--main" />
      <div className="ms-orbit-ring ms-orbit-ring--outer" />

      {/* Portal popover — rendered at document.body to escape overflow:hidden hero */}
      {mounted && selectedNode && popFixed && createPortal(
        <div
          style={{
            position: "fixed",
            left: popFixed.rightHemi ? `${popFixed.x - 16}px` : `${popFixed.x + 16}px`,
            top: `${popFixed.y}px`,
            transform: popFixed.rightHemi ? "translate(-100%, -50%)" : "translateY(-50%)",
            zIndex: 9999,
            pointerEvents: "auto",
            width: "min(15rem, calc(100vw - 2.5rem))",
          }}
          data-seo-intent={selectedNode.seoIntent}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative bg-[#050507] border border-[#D4AF37]/30 rounded-xl shadow-2xl overflow-hidden"
            style={{
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              animation: "gtc-popover-in 0.22s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {/* Gold top accent line */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

            <div className="px-4 pt-3.5 pb-4">
              {/* Dismiss */}
              <button
                onClick={() => { setSelectedId(null); setPopFixed(null); }}
                className="absolute top-3 right-3.5 font-mono text-[#3A3A3A] hover:text-[#888] transition-colors text-sm leading-none"
                aria-label="Close"
              >
                ×
              </button>

              {/* Scramble header */}
              <span className="font-mono text-[7px] tracking-[0.32em] uppercase text-[#555] block mb-2">
                {selectedNode.id === "florida"
                  ? "ORIGIN NODE"
                  : selectedNode.framework === "HAGUE CONVENTION ROUTING"
                    ? "HAGUE RELEASE NODE"
                    : "CONSULAR RELEASE NODE"}
              </span>
              <p className="font-mono text-[10px] text-[#D4AF37] tracking-wider leading-snug pr-6 mb-3.5 min-h-[2em]">
                {scrambledText}
              </p>

              {/* Useful data rows */}
              <div className="space-y-2 border-t border-white/[0.05] pt-3">
                <div className="flex gap-2.5 items-start">
                  <span className="font-mono text-[7px] uppercase tracking-wider text-[#555] w-14 flex-shrink-0 mt-0.5">CHANNEL</span>
                  <span className="font-mono text-[9px] text-[#999] leading-snug">{"channel" in selectedNode ? selectedNode.channel : "—"}</span>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="font-mono text-[7px] uppercase tracking-wider text-[#555] w-14 flex-shrink-0 mt-0.5">PROTOCOL</span>
                  <span className="font-mono text-[9px] text-[#999] leading-snug">{"protocol" in selectedNode ? selectedNode.protocol : "—"}</span>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="font-mono text-[7px] uppercase tracking-wider text-[#555] w-14 flex-shrink-0 mt-0.5">DOCS</span>
                  <span className="font-mono text-[9px] text-[#999] leading-snug">
                    {"docs" in selectedNode ? selectedNode.docs.slice(0, 2).join(" · ") : "—"}
                  </span>
                </div>
              </div>

              {/* CTA link to jurisdiction profile */}
              <a
                href={selectedNode.seoIntent}
                className="flex items-center gap-1.5 mt-3.5 font-mono text-[9px] text-[#C6A55A] hover:text-[#D4B76A] transition-colors tracking-wider"
              >
                <span>→ VIEW ROUTING PROFILE</span>
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Label row — updates on selection */}
      <div className={`ms-globe-label${isSettled ? " ms-globe-label--visible" : ""}`}>
        <span className="ms-globe-label-text">Global Trust Core™</span>
        <span className="ms-globe-label-sub">
          {selectedNode
            ? `${selectedNode.label} · ${selectedNode.framework}`
            : arcsDone
              ? "Hague Route Reviewed · Structured International Release"
              : "Florida Origin · Execution Authority"}
        </span>
      </div>
    </div>
  );
}
