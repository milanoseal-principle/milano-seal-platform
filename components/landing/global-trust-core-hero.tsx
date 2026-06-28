"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import {
  DestinationIntelligenceCard,
  executionPathPreview,
  type DestinationIntelligence,
} from "@/components/landing/destination-intelligence-card";

// ─── Data ────────────────────────────────────────────────────────────────────

const FLORIDA = { x: 108, y: 190 };

type HagueStatus = "HAGUE" | "AUTHORITY_REVIEW" | "CONSULAR_REVIEW";

interface Destination {
  id: string; label: string; x: number; y: number;
  dur: number; startDelay: number; framework: string;
  seoIntent: string; isoCode: string; routeLabel: string;
  hagueStatus: HagueStatus; useCases: string[]; safeSummary: string;
}

const DESTINATIONS: Destination[] = [
  { id:"italy",    label:"Italy",    x:255,y:105, dur:4.8, startDelay:0.0, framework:"HAGUE CONVENTION ROUTING",       seoIntent:"/jurisdictions/italy-apostille-coordination",              isoCode:"JURISDICTION_ISO_IT", routeLabel:"Hague Apostille Route",       hagueStatus:"HAGUE",            useCases:["Citizenship","POA","Affidavit","Civil Records"],      safeSummary:"Florida-origin documents routed for Italian receiving-authority review." },
  { id:"spain",    label:"Spain",    x:208,y:122, dur:5.5, startDelay:0.8, framework:"HAGUE CONVENTION ROUTING",       seoIntent:"/jurisdictions/spain-international-release-coordination", isoCode:"JURISDICTION_ISO_ES", routeLabel:"Hague Apostille Route",       hagueStatus:"HAGUE",            useCases:["Real Estate","Residency","POA","Corporate"],           safeSummary:"Structured U.S. execution support for Spanish destination use." },
  { id:"portugal", label:"Portugal", x:192,y:134, dur:5.8, startDelay:1.4, framework:"HAGUE CONVENTION ROUTING",       seoIntent:"/jurisdictions/portugal-apostille-coordination",           isoCode:"JURISDICTION_ISO_PT", routeLabel:"Hague Apostille Route",       hagueStatus:"HAGUE",            useCases:["Residency","D8 Visa","POA","Banking"],                 safeSummary:"U.S. document execution support for Portugal residency and private-client matters." },
  { id:"greece",   label:"Greece",   x:282,y:118, dur:5.2, startDelay:1.1, framework:"HAGUE CONVENTION ROUTING",       seoIntent:"/jurisdictions/greece-apostille-coordination",             isoCode:"JURISDICTION_ISO_GR", routeLabel:"Hague Apostille Route",       hagueStatus:"HAGUE",            useCases:["Citizenship","Property","Inheritance","Maritime"],     safeSummary:"Boutique U.S. execution coordination for Greek international matters." },
  { id:"brazil",   label:"Brazil",   x:118,y:268, dur:6.0, startDelay:1.8, framework:"HAGUE CONVENTION ROUTING",       seoIntent:"/jurisdictions/brazil-hague-convention-routing",           isoCode:"JURISDICTION_ISO_BR", routeLabel:"Hague Apostille Route",       hagueStatus:"HAGUE",            useCases:["Corporate","Medical","POA","Academic"],               safeSummary:"Florida-origin documents routed for Brazilian receiving-authority review." },
  { id:"uae",      label:"UAE",      x:330,y:192, dur:5.0, startDelay:0.4, framework:"CONSULAR AUTHENTICATION TRACK",  seoIntent:"/apostille/uae",                                           isoCode:"JURISDICTION_ISO_AE", routeLabel:"Consular Legalization Review", hagueStatus:"CONSULAR_REVIEW",  useCases:["Corporate","Private Wealth","Commercial","Authentication"], safeSummary:"Non-standard authentication and consular review may apply." },
  { id:"mexico",   label:"Mexico",   x:62, y:222, dur:3.6, startDelay:2.6, framework:"HAGUE CONVENTION ROUTING",       seoIntent:"/jurisdictions/mexico-hague-convention-routing",           isoCode:"JURISDICTION_ISO_MX", routeLabel:"Authority Review Required",   hagueStatus:"AUTHORITY_REVIEW", useCases:["Real Estate","Family","Corporate","Translation"],      safeSummary:"Cross-border U.S. execution coordination requiring destination-specific review." },
  { id:"uk",       label:"UK",       x:228,y:88,  dur:5.0, startDelay:0.6, framework:"HAGUE CONVENTION ROUTING",       seoIntent:"/jurisdictions/uk-apostille-coordination",                 isoCode:"JURISDICTION_ISO_GB", routeLabel:"Hague Apostille Route",       hagueStatus:"HAGUE",            useCases:["Corporate","Estate","Academic","POA"],                 safeSummary:"U.S. document execution support for United Kingdom destination use." },
  { id:"canada",   label:"Canada",   x:110,y:112, dur:3.0, startDelay:3.0, framework:"AUTHORITY REVIEW REQUIRED",      seoIntent:"/jurisdictions/canada-authentication",                     isoCode:"JURISDICTION_ISO_CA", routeLabel:"Authentication Review",       hagueStatus:"AUTHORITY_REVIEW", useCases:["Corporate","Academic","Immigration","Identity"],       safeSummary:"Destination-specific review required based on document type and receiving authority." },
  { id:"colombia", label:"Colombia", x:96, y:252, dur:4.5, startDelay:2.2, framework:"HAGUE CONVENTION ROUTING",       seoIntent:"/jurisdictions/colombia-apostille-coordination",           isoCode:"JURISDICTION_ISO_CO", routeLabel:"Hague Apostille Route",       hagueStatus:"HAGUE",            useCases:["Family","Real Estate","Corporate","POA"],              safeSummary:"U.S. execution coordination for Colombian destination matters." },
];

const DESTINATION_FLAGS: Record<string, string> = {
  italy: "🇮🇹",
  spain: "🇪🇸",
  portugal: "🇵🇹",
  greece: "🇬🇷",
  brazil: "🇧🇷",
  uae: "🇦🇪",
  mexico: "🇲🇽",
  uk: "🇬🇧",
  canada: "🇨🇦",
  colombia: "🇨🇴",
};

function heroDestinationIntelligence(
  destination: Destination,
): DestinationIntelligence {
  const verificationRequired = destination.hagueStatus !== "HAGUE";
  const slug = destination.id === "uk" ? "united-kingdom" : destination.id;
  const needsTranslation = destination.useCases.some((item) =>
    /translation/i.test(item),
  );

  return {
    slug,
    name: destination.label,
    flag: DESTINATION_FLAGS[destination.id],
    routeLabel: destination.routeLabel,
    statusLabel: verificationRequired
      ? "Verification Required"
      : "Hague Member",
    summary: destination.safeSummary,
    documents: destination.useCases,
    seoLine:
      destination.id === "uae"
        ? "Consular authentication review for UAE"
        : destination.id === "brazil"
          ? "International document execution for Brazil"
          : `Florida to ${destination.label} apostille support`,
    translationReview: needsTranslation,
    courierReview: true,
    pathPreview: executionPathPreview(
      slug,
      destination.hagueStatus === "HAGUE",
      needsTranslation,
    ),
  };
}

function hagueColor(status: HagueStatus) {
  if (status === "HAGUE")            return { dot:"#D4AF37", badge:"#D4AF37", arc:"#C6A55A" };
  if (status === "AUTHORITY_REVIEW") return { dot:"#C8A03E", badge:"#C8A03E", arc:"#B89038" };
  return                                    { dot:"#B8842A", badge:"#B8842A", arc:"#A87828" };
}

// ─── Layer 3: Spatial depth — simulate z-position on sphere surface ──────────
function getDepthFactor(x: number, y: number): number {
  const dx = (x - 200) / 193;
  const dy = (y - 200) / 193;
  return Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
}

// ─── Geodesic grid parameters ─────────────────────────────────────────────────
const LAT_YS     = [110, 145, 172, 200, 228, 255, 290];
const LON_ANGLES = [0, 30, 60, 90, 120, 150];

// ─── Continent dot fields ─────────────────────────────────────────────────────
interface Region { x:number;y:number;w:number;h:number;count:number;minR:number;maxR:number;minO:number;maxO:number; }

function seededRand(seed: number) {
  let s = seed;
  return () => { s=(Math.imul(s,1664525)+1013904223)|0; return (s>>>0)/4294967295; };
}

function generateDots(regions: Region[]) {
  const dots: {cx:number;cy:number;r:number;opacity:number}[] = [];
  regions.forEach((reg, ri) => {
    const rng = seededRand(ri*7919+31337);
    for (let i=0; i<reg.count; i++) {
      dots.push({ cx:reg.x+rng()*reg.w, cy:reg.y+rng()*reg.h, r:reg.minR+rng()*(reg.maxR-reg.minR), opacity:reg.minO+rng()*(reg.maxO-reg.minO) });
    }
  });
  return dots;
}

const CONTINENT_REGIONS: Region[] = [
  {x:152,y:75, w:32, h:38, count:14, minR:0.5,maxR:1.8,minO:0.12,maxO:0.32},
  {x:55, y:105,w:78, h:52, count:48, minR:0.5,maxR:2.5,minO:0.18,maxO:0.52},
  {x:112,y:148,w:40, h:45, count:22, minR:0.5,maxR:1.8,minO:0.15,maxO:0.45},
  {x:55, y:148,w:30, h:50, count:18, minR:0.5,maxR:1.5,minO:0.12,maxO:0.40},
  {x:88, y:205,w:32, h:30, count:10, minR:0.4,maxR:1.2,minO:0.10,maxO:0.32},
  {x:92, y:228,w:68, h:45, count:36, minR:0.5,maxR:2.2,minO:0.15,maxO:0.48},
  {x:102,y:268,w:50, h:48, count:24, minR:0.5,maxR:1.8,minO:0.12,maxO:0.40},
  {x:195,y:98, w:52, h:55, count:38, minR:0.4,maxR:1.8,minO:0.18,maxO:0.52},
  {x:238,y:112,w:32, h:45, count:18, minR:0.4,maxR:1.5,minO:0.15,maxO:0.42},
  {x:195,y:158,w:72, h:48, count:38, minR:0.5,maxR:2.0,minO:0.15,maxO:0.45},
  {x:198,y:202,w:65, h:70, count:42, minR:0.5,maxR:2.2,minO:0.15,maxO:0.48},
  {x:258,y:142,w:52, h:52, count:24, minR:0.4,maxR:1.8,minO:0.15,maxO:0.45},
  {x:258,y:78, w:115,h:72, count:58, minR:0.4,maxR:1.8,minO:0.10,maxO:0.38},
  {x:270,y:165,w:35, h:55, count:22, minR:0.4,maxR:1.8,minO:0.15,maxO:0.45},
  {x:295,y:118,w:72, h:68, count:50, minR:0.4,maxR:2.0,minO:0.15,maxO:0.48},
  {x:352,y:128,w:22, h:45, count:14, minR:0.4,maxR:1.4,minO:0.12,maxO:0.38},
  {x:305,y:190,w:65, h:52, count:25, minR:0.4,maxR:1.5,minO:0.12,maxO:0.38},
  {x:312,y:235,w:68, h:48, count:28, minR:0.5,maxR:2.2,minO:0.15,maxO:0.45},
  {x:368,y:268,w:14, h:22, count:6,  minR:0.4,maxR:1.2,minO:0.12,maxO:0.35},
];

const FRONT_DOTS = generateDots(CONTINENT_REGIONS);
const ALL_DOTS   = [...FRONT_DOTS, ...FRONT_DOTS.map(d=>({...d, cx:d.cx+400}))];

// ─── Component ────────────────────────────────────────────────────────────────
export function GlobalTrustCoreHero() {
  const [phase,       setPhase]       = useState<"idle"|"settled"|"arcs"|"rotating">("idle");
  const [arcsDone,    setArcsDone]    = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [selectedId,  setSelectedId]  = useState<string|null>(null);
  const [hoveredId,   setHoveredId]   = useState<string|null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const selectedDest  = DESTINATIONS.find(d=>d.id===selectedId) ?? null;

  // ── Spring physics camera (preserved from c255a13) ──────────────────────
  const rawNudgeX = selectedDest ? ((selectedDest.x - 200) / 200) * 12 : 0;
  const rawNudgeY = selectedDest ? ((selectedDest.y - 200) / 200) *  8 : 0;
  const springX   = useSpring(rawNudgeX, { stiffness:200, damping:26, mass:0.8 });
  const springY   = useSpring(rawNudgeY, { stiffness:200, damping:26, mass:0.8 });

  useEffect(()=>{ springX.set(rawNudgeX); }, [rawNudgeX, springX]);
  useEffect(()=>{ springY.set(rawNudgeY); }, [rawNudgeY, springY]);

  // ── Layer 1: Interlinked springs — background drags opposite camera ──────
  const bgDriftX  = useTransform(springX, (v) => v * -0.08);
  const bgDriftY  = useTransform(springY, (v) => v * -0.08);
  const gridSkewX = useTransform(springX, (v) => v * 0.02);

  const handleSelect = (id: string) => {
    if (!arcsDone) return;
    if (selectedId===id) { setSelectedId(null); }
    else { setSelectedId(id); }
  };

  useEffect(() => {
    const mql     = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = mql.matches;
    setReducedMotion(reduced);
    // Layer 9: reduced motion fast-path
    if (reduced) { setPhase("rotating"); setArcsDone(true); return; }
    timers.current.push(setTimeout(()=>{ setPhase("rotating"); setArcsDone(true); }, 80));
    return ()=>timers.current.forEach(clearTimeout);
  }, []);

  const isSettled  = phase !== "idle";
  const activeId   = hoveredId ?? selectedId;
  const showArcs   = !!activeId;
  const isRotating = phase === "rotating" && !selectedId;

  // Popover placement — pinned to a viewport-safe zone (fixed, clamped) so it
  // never clips or overflows on smaller / non-maximized windows or at any zoom.
  const popoverStyle: React.CSSProperties = {
    position: "fixed",
    top: "calc(var(--header-total-height) + 16px + var(--sa-top, 0px))",
    right: "clamp(12px, 3vw, 32px)",
    left: "auto",
    bottom: "auto",
    width: "min(360px, calc(100vw - 24px))",
    maxHeight: "calc(100dvh - var(--header-total-height) - 32px)",
    overflowY: "auto",
    zIndex: 60,
    pointerEvents: "auto",
  };

  return (
    <div
      className="ms-globe-container"
      aria-label="Global document execution network"
      onClick={()=>setSelectedId(null)}
    >
      {/* Layer 1: Bloom drags opposite camera — depth separation */}
      <motion.div
        className="ms-globe-bloom"
        style={reducedMotion ? undefined : { x: bgDriftX, y: bgDriftY }}
      />

      {/* Sphere — spring-animated camera nudge (c255a13) */}
      <motion.div
        style={{ x: springX, y: springY }}
        className={[
          "ms-globe-sphere",
          isSettled  && "ms-globe-sphere--visible",
          isRotating && "ms-globe-sphere--rotating",
        ].filter(Boolean).join(" ")}
      >
        {/* ── Geodesic grid — Layer 1: subtle grid skew opposite camera ── */}
        <motion.div
          style={reducedMotion ? undefined : { skewX: gridSkewX }}
          className="absolute inset-0 pointer-events-none"
        >
          <svg
            viewBox="0 0 400 400"
            className="ms-globe-grid-svg ms-globe-grid-svg--defocus"
            aria-hidden="true"
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", overflow:"hidden" }}
          >
            <defs>
              <clipPath id="gtc-sphere-clip"><circle cx="200" cy="200" r="193" /></clipPath>
            </defs>
            <g clipPath="url(#gtc-sphere-clip)">
              {LAT_YS.map(y => {
                const ratio = Math.sqrt(Math.max(0, 1-Math.pow((y-200)/193,2)));
                const rx = 193*ratio;
                const ry = Math.max(4, 22*ratio);
                return rx>5 ? (
                  <ellipse key={`lat-${y}`} cx="200" cy={y} rx={rx} ry={ry}
                    fill="none" stroke="#C6A55A" strokeWidth="0.38" opacity="0.10" />
                ) : null;
              })}
              {LON_ANGLES.map(a => (
                <ellipse key={`lon-${a}`} cx="200" cy="200" rx="12" ry="193"
                  fill="none" stroke="#C6A55A" strokeWidth="0.30" opacity="0.08"
                  transform={`rotate(${a}, 200, 200)`} />
              ))}
            </g>
            <ellipse cx="200" cy="200" rx="193" ry="40"
              fill="none" stroke="#C6A55A" strokeWidth="0.55" opacity="0.14"
              clipPath="url(#gtc-sphere-clip)" />
          </svg>
        </motion.div>

        {/* ── Layer 4: Atmospheric equatorial haze ─────────────────────── */}
        {isSettled && (
          <div
            aria-hidden="true"
            style={{
              position:"absolute", left:"50%", top:"52%",
              transform:"translate(-50%,-50%)",
              width:"94%", height:"22%",
              borderRadius:"50%",
              background:"radial-gradient(ellipse at center, rgba(212,175,55,0.042) 0%, transparent 78%)",
              pointerEvents:"none", zIndex:3,
              animation: reducedMotion ? "none" : "ms-equator-breathe 9s ease-in-out infinite",
            }}
          />
        )}

        {/* ── Continent dot map ─────────────────────────────────────────── */}
        <svg viewBox="0 0 800 400" className="ms-globe-dots-layer" aria-hidden="true">
          {ALL_DOTS.map((dot,i)=>(
            <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill="#C6A55A" opacity={dot.opacity} />
          ))}
        </svg>

        {/* ── Route arcs + nodes ────────────────────────────────────────── */}
        <svg viewBox="0 0 400 400" className="ms-globe-arcs-svg" aria-hidden="true"
          style={{ overflow:"visible" }}>
          <defs>
            {DESTINATIONS.map(dest=>(
              <path key={`def-${dest.id}`} id={`gtc-arc-${dest.id}`}
                d={makeCurvedPath(FLORIDA, {x:dest.x,y:dest.y})} fill="none" />
            ))}

            {/* Standard glow filters (c255a13) */}
            <filter id="gtc-glow-soft" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="gtc-glow-bright" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="4.0" result="b1"/>
              <feGaussianBlur stdDeviation="1.5" in="SourceGraphic" result="b2"/>
              <feMerge><feMergeNode in="b1"/><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="gtc-glow-node" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="3.2" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="gtc-glow-node-bright" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="5.5" result="b1"/>
              <feGaussianBlur stdDeviation="2.2" in="SourceGraphic" result="b2"/>
              <feMerge><feMergeNode in="b1"/><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="gtc-bloom-wide" x="-250%" y="-250%" width="600%" height="600%">
              <feGaussianBlur stdDeviation="10"/>
            </filter>
            <filter id="gtc-trail-blur" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="5"/>
            </filter>

            {/* Layer 2: Anamorphic bloom — horizontal flare + gold tint */}
            <filter id="anamorphic-bloom" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8 1" result="horizontalBlur"/>
              <feColorMatrix
                in="horizontalBlur" type="matrix"
                values="1 0 0 0 0.83  0 1 0 0 0.68  0 0 1 0 0.21  0 0 0 2 -0.1"
                result="goldTint"/>
              <feMerge>
                <feMergeNode in="goldTint"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* ── Florida origin hub (c255a13 — 3 radiating rings) ──────── */}
          {isSettled && !reducedMotion && [0, 1.5, 3.0].map((delay,i)=>(
            <circle key={`rad-${i}`}
              cx={FLORIDA.x} cy={FLORIDA.y} r="9"
              fill="none" stroke="#D4AF37" strokeWidth="1.2" opacity="0"
              style={{ animation:`ms-origin-radiate 4.5s ease-out ${delay}s infinite` }}
            />
          ))}
          {isSettled && (
            <circle cx={FLORIDA.x} cy={FLORIDA.y} r="9"
              fill="rgba(212,175,55,0.14)" filter="url(#gtc-bloom-wide)" opacity="1" />
          )}
          <circle cx={FLORIDA.x} cy={FLORIDA.y} r="13"
            fill="none" stroke="#C6A55A" strokeWidth="0.8"
            opacity={isSettled ? 0.30 : 0} style={{ transition:"opacity 0.8s ease" }} />
          <circle cx={FLORIDA.x} cy={FLORIDA.y} r="5.5"
            fill="#D4AF37" filter="url(#gtc-glow-node-bright)"
            opacity={isSettled ? 1 : 0} style={{ transition:"opacity 0.8s ease" }} />
          {isSettled && (
            <circle cx={FLORIDA.x} cy={FLORIDA.y} r="2" fill="#FFF8DC" opacity="0.95" />
          )}
          {isSettled && (<>
            <text x={FLORIDA.x-18} y={FLORIDA.y-3} textAnchor="end"
              fill="rgba(212,175,55,0.80)" fontSize="7.5" fontFamily="system-ui,sans-serif"
              letterSpacing="0.09em" fontWeight="600">FLORIDA</text>
            <text x={FLORIDA.x-18} y={FLORIDA.y+7} textAnchor="end"
              fill="rgba(212,175,55,0.42)" fontSize="5.8" fontFamily="monospace"
              letterSpacing="0.06em">ORIGIN</text>
          </>)}

          {/* ── Per-destination routes ─────────────────────────────────── */}
          {DESTINATIONS.map((dest,i)=>{
            const { arc, dot } = hagueColor(dest.hagueStatus);
            const path       = makeCurvedPath(FLORIDA, {x:dest.x,y:dest.y});
            const isSelected = activeId===dest.id;
            const isDimmed   = !!activeId && !isSelected;

            // Layer 3: Spatial depth defocus
            const depth       = getDepthFactor(dest.x, dest.y);
            const defocusBlur = Math.max(0, (0.82 - depth) * 1.6);
            const depthScale  = 0.72 + depth * 0.28;

            const showGhost      = showArcs && !isDimmed;
            const arcOpacity     = isDimmed ? 0.015 : (showArcs ? 0.08 : 0);
            const fringeOpacity  = isDimmed ? 0      : (showArcs ? 0.40 : 0);
            const fringeOpacity2 = isDimmed ? 0      : (showArcs ? 0.25 : 0);
            const bodyStroke     = isSelected ? "#F0C84A" : arc;
            const headStroke     = isSelected ? "#FFFDE0" : "#FFF5DC";
            const bodyFilter     = isSelected ? "url(#gtc-glow-bright)" : "url(#gtc-glow-soft)";
            const bloomOpacity   = arcsDone ? (isDimmed ? 0.15 : 1) : 0;
            const animDur        = `${dest.dur}s`;
            const animDelay      = `${dest.startDelay}s`;
            const tipDur         = `${dest.dur * 0.65}s`;

            return (
              <g key={dest.id}>
                {/* ── CINEMA ARC SYSTEM — 5 layers (c255a13) ──────────── */}

                {/* L0: Wide base glow trail */}
                {showGhost && (
                  <path d={path} stroke={arc} strokeWidth="7" fill="none"
                    filter="url(#gtc-trail-blur)"
                    className="ms-globe-arc-glow ms-globe-arc-glow--flowing"
                    style={{ animationDuration:animDur, animationDelay:animDelay, opacity:0.08 } as React.CSSProperties} />
                )}

                {/* L1: Static ghost trail */}
                <path d={path} stroke={arc} strokeWidth="0.8" fill="none"
                  opacity={arcOpacity} style={{ transition:"opacity 0.5s ease" }} />

                {/* L2: Chromatic fringes (screen blend — lens aberration) */}
                <path d={path} stroke="#F4E5B8" strokeWidth="1.1" fill="none"
                  opacity={fringeOpacity} transform="translate(-1.4,0)"
                  style={{ transition:"opacity 0.5s ease", mixBlendMode:"screen" as const }} />
                <path d={path} stroke="#8A8070" strokeWidth="1.1" fill="none"
                  opacity={fringeOpacity2} transform="translate(1.4,0)"
                  style={{ transition:"opacity 0.5s ease", mixBlendMode:"screen" as const }} />

                {/* L3: Comet body */}
                <path d={path} stroke={bodyStroke}
                  strokeWidth={isSelected ? 2.0 : 1.4} fill="none"
                  filter={bodyFilter}
                  className={`ms-globe-arc-body${isSelected ? " ms-globe-arc-body--flowing" : ""}`}
                  style={{ animationDuration:animDur, animationDelay:animDelay,
                    opacity: isSelected ? 1 : 0,
                    transition:"opacity 0.4s ease, stroke-width 0.3s ease"
                  } as React.CSSProperties} />

                {/* L4: Bright head */}
                <path d={path} stroke={headStroke}
                  strokeWidth={isSelected ? 4.5 : 3.2} fill="none"
                  className={`ms-globe-arc-head${isSelected ? " ms-globe-arc-head--flowing" : ""}`}
                  style={{ animationDuration:animDur, animationDelay:animDelay,
                    opacity: isSelected ? 1 : 0,
                    transition:"opacity 0.4s ease"
                  } as React.CSSProperties} />

                {/* L5: Ultra-white hot tip — Layer 2 (anamorphic-bloom) + Layer 5 (hysteresis timing) */}
                <path d={path} stroke="#FFFFFF"
                  strokeWidth={isSelected ? 2.2 : 1.4} fill="none"
                  filter={isSelected ? "url(#anamorphic-bloom)" : undefined}
                  className={`ms-globe-arc-tip${isSelected ? " ms-globe-arc-tip--flowing" : ""}`}
                  style={{ animationDuration:tipDur, animationDelay:animDelay,
                    opacity: isSelected ? 0.9 : 0,
                    transition:"opacity 0.4s ease"
                  } as React.CSSProperties} />

                {/* animateMotion particle */}
                {isSelected && !reducedMotion && (
                  <circle r="2.5" fill="#FFF8DC" opacity="0.95" filter="url(#gtc-glow-soft)">
                    <animateMotion dur={animDur} begin={animDelay} repeatCount="indefinite">
                      <mpath href={`#gtc-arc-${dest.id}`}/>
                    </animateMotion>
                  </circle>
                )}

                {/* ── Destination node cluster (c255a13 + Layer 3 depth) ─ */}
                {/* Apply depth defocus to visual elements only */}
                <g style={{
                  filter: !isDimmed && defocusBlur > 0.12 && !reducedMotion
                    ? `blur(${defocusBlur.toFixed(2)}px)`
                    : undefined,
                  opacity: isDimmed ? 1 : depthScale,
                }}>
                  {/* L0: Wide outer bloom (breathing) */}
                  <circle cx={dest.x} cy={dest.y} r="22"
                    fill={dot} filter="url(#gtc-bloom-wide)"
                    opacity={bloomOpacity}
                    className={arcsDone ? "ms-globe-dest-bloom" : ""}
                    style={{ transition:"opacity 0.6s ease" }} />

                  {/* L1: Atmospheric fill ring */}
                  <circle cx={dest.x} cy={dest.y} r={isSelected ? 18 : 12}
                    fill={dot} opacity={arcsDone ? (isDimmed ? 0.02 : 0.06) : 0}
                    style={{ transition:"r 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease" }} />

                  {/* L2: Outer decorative ring — selected uses Layer 2 anamorphic bloom */}
                  <circle cx={dest.x} cy={dest.y}
                    r={isSelected ? 14 : 9.5}
                    fill="none" stroke={dot}
                    strokeWidth={isSelected ? 1.4 : 0.8}
                    filter={isSelected ? "url(#anamorphic-bloom)" : undefined}
                    opacity={arcsDone ? (isSelected ? 0.55 : (isDimmed ? 0.08 : 0.28)) : 0}
                    className={isSelected ? "ms-globe-selected-ring" : "ms-globe-dest-ring"}
                    style={{
                      transition:"r 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease",
                      transitionDelay:`${i*100}ms`,
                    }} />

                  {/* L3: Core glow halo */}
                  <circle cx={dest.x} cy={dest.y} r={isSelected ? 7 : 5}
                    fill={dot} filter="url(#gtc-glow-node)"
                    opacity={arcsDone ? (isDimmed ? 0.15 : 0.40) : 0}
                    style={{ transition:"r 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease", transitionDelay:`${i*100}ms` }} />

                  {/* L4: Core dot */}
                  <circle cx={dest.x} cy={dest.y} r={isSelected ? 5.5 : 3.8}
                    fill={isSelected ? "#F0C84A" : dot}
                    filter="url(#gtc-glow-node-bright)"
                    opacity={arcsDone ? 1 : 0}
                    style={{
                      transition:"r 0.35s cubic-bezier(0.16,1,0.3,1), fill 0.3s ease, opacity 0.4s ease",
                      transitionDelay:`${i*120}ms`,
                    }} />

                  {/* L5: Inner specular white pixel */}
                  {arcsDone && (
                    <circle cx={dest.x} cy={dest.y} r="1.4"
                      fill="#FFFDE8" opacity={isDimmed ? 0 : 0.92}
                      style={{ transition:"opacity 0.3s ease" }} />
                  )}
                </g>

                {/* Hit area + label are NOT depth-blurred */}
                <g
                  style={{ cursor:arcsDone ? "pointer" : "default", pointerEvents:"all" }}
                  role={arcsDone ? "button" : undefined}
                  tabIndex={arcsDone ? 0 : undefined}
                  aria-label={`${dest.label} routing information`}
                  data-auth-node="FLORIDA_ORIGIN"
                  data-target-vector={dest.isoCode}
                  onMouseEnter={() => { if (arcsDone) setHoveredId(dest.id); }}
                  onMouseLeave={() => { setHoveredId(null); }}
                  onClick={e=>{ e.stopPropagation(); handleSelect(dest.id); }}
                  onKeyDown={e=>{ if(e.key==="Enter"||e.key===" ") handleSelect(dest.id); }}
                >
                  <circle cx={dest.x} cy={dest.y} r="20" fill="transparent" />
                  {arcsDone && (
                    <text
                      x={dest.x+(dest.x>200 ? 16 : -16)}
                      y={dest.y+3.5}
                      textAnchor={dest.x>200 ? "start" : "end"}
                      fill="rgba(212,175,55,0.78)"
                      fontSize="8" fontFamily="system-ui,sans-serif"
                      letterSpacing="0.07em" fontWeight="500"
                      style={{
                        animationDelay:`${i*80}ms`,
                        opacity: isDimmed ? 0.12 : 1,
                        transition:"opacity 0.35s ease",
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

        {/* Glass cap shimmer drift (c255a13) */}
        <div className="ms-globe-glass-cap" />
        {/* Atmospheric rim ring (c255a13) */}
        <div className="ms-globe-rim-ring" />
        {/* Crest glow */}
        <div className="ms-globe-crest-glow" />
        {/* Intelligence core — distinct from header and assistant assets */}
        <Link
          href="/map"
          className="ms-globe-crest-link"
          aria-label="Open Global Document Intelligence"
          title="Open Global Document Intelligence"
          onClick={(event) => event.stopPropagation()}
        >
          <span className="ms-globe-crest" aria-hidden="true" />
          <span className="ms-globe-crest-tooltip" role="tooltip">
            Open Global Document Intelligence
          </span>
        </Link>
        {/* Spotlight */}
        <div className="ms-globe-spotlight" />
      </motion.div>

      {/* ── Layer 6: Popover with spring cascade title → badge → CTA ────── */}
      {selectedDest && (
          <div
            className="ms-destination-popover hidden md:block"
            style={popoverStyle}
            data-seo-intent={selectedDest.seoIntent}
            onClick={e=>e.stopPropagation()}
          >
            <motion.div
              initial={{ opacity:0, scale:0.90, filter:"blur(6px)" }}
              animate={{ opacity:1, scale:1.00, filter:"blur(0px)" }}
              transition={{ type:"spring", stiffness:320, damping:32 }}
              className="relative"
            >
              <button
                onClick={()=>setSelectedId(null)}
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full font-mono text-base leading-none text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/70"
                aria-label="Close"
              >×</button>
              <DestinationIntelligenceCard
                intelligence={heroDestinationIntelligence(selectedDest)}
                variant="globePreview"
                onPrimaryAction={() => setSelectedId(null)}
              />
            </motion.div>
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
            ? `${selectedDest.label} · ${selectedDest.routeLabel}`
            : arcsDone
              ? "Hague Route Reviewed · Structured International Release"
              : "Florida Origin · Execution Authority"}
        </span>
      </div>
    </div>
  );
}

// ─── Helpers (module-level, no JSX) ───────────────────────────────────────────
function makeCurvedPath(
  from: {x:number;y:number},
  to:   {x:number;y:number}
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mx = (from.x + to.x) / 2;
  if (dy>50 && Math.abs(dx)<70) {
    return `M ${from.x} ${from.y} Q ${mx+58} ${from.y+dy*0.5} ${to.x} ${to.y}`;
  }
  const lift = 38 + (Math.abs(dx)/300)*62;
  const my   = Math.min(from.y, to.y) - lift;
  return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
}
