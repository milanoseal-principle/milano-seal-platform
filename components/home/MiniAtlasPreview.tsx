"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { setActiveCorridor } from "@/lib/homepage/activeCorridorStore";
import { getGlobalRoute } from "@/src/features/corridors/globalRouteData";

interface Props {
  selected: Destination;
  onSelect: (dest: Destination) => void;
  autoCycle?: boolean;
}

const PRIORITY_SLUGS = [
  "italy",
  "germany",
  "uae",
  "mexico",
  "brazil",
  "spain",
  "france",
  "portugal",
  "united-kingdom",
  "canada",
];

function buildCycleOrder(): Destination[] {
  const bySlug = new Map(DESTINATIONS.map((destination) => [destination.slug, destination]));
  const ordered: Destination[] = [];
  const seen = new Set<string>();
  for (const slug of PRIORITY_SLUGS) {
    const destination = bySlug.get(slug);
    if (destination && !seen.has(slug)) {
      ordered.push(destination);
      seen.add(slug);
    }
  }
  for (const destination of DESTINATIONS) {
    if (!seen.has(destination.slug)) {
      ordered.push(destination);
      seen.add(destination.slug);
    }
  }
  return ordered;
}

const CYCLE_ORDER = buildCycleOrder();
const CYCLE_INTERVAL_MS = 5000;
const ORIGIN = { x: 78, y: 118 };

function translationLikely(destination: Destination): boolean {
  return destination.executionPath.some((step) => /translation/i.test(step));
}

function fallbackPosition(slug: string) {
  let hash = 0;
  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) >>> 0;
  }
  return {
    x: 188 + (hash % 76),
    y: 88 + ((hash >> 4) % 104),
  };
}

function destinationPoint(destination: { slug: string; lat?: number; lng?: number }) {
  if (typeof destination.lat !== "number" || typeof destination.lng !== "number") {
    return fallbackPosition(destination.slug);
  }
  return {
    x: 42 + ((destination.lng + 180) / 360) * 238,
    y: 50 + ((90 - destination.lat) / 180) * 156,
  };
}

function curvedPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const vx = to.x - from.x;
  const vy = to.y - from.y;
  const dist = Math.hypot(vx, vy) || 1;
  let px = -vy / dist;
  let py = vx / dist;
  if (py > 0) {
    px = -px;
    py = -py;
  }
  const lift = Math.min(42, Math.max(22, dist * 0.24));
  return `M ${from.x} ${from.y} Q ${mx + px * lift} ${my + py * lift} ${to.x} ${to.y}`;
}

export function MiniAtlasPreview({ selected, onSelect, autoCycle = true }: Props) {
  const pausedRef = useRef(false);
  const reduceMotion = useMilanoReducedMotion();
  const [analyzing, setAnalyzing] = useState(false);

  const routeRecord = useMemo(() => getGlobalRoute(selected.slug), [selected.slug]);
  const index = CYCLE_ORDER.findIndex((destination) => destination.slug === selected.slug);
  const nextDest = CYCLE_ORDER[(index + 1) % CYCLE_ORDER.length];
  const destination = useMemo(
    () => destinationPoint(routeRecord ?? selected),
    [routeRecord, selected],
  );
  const activePath = useMemo(
    () => curvedPath(ORIGIN, destination),
    [destination],
  );
  const contextDestinations = useMemo(
    () =>
      CYCLE_ORDER.filter((destinationRecord) => destinationRecord.slug !== selected.slug).slice(0, 8),
    [selected.slug],
  );

  useEffect(() => {
    if (!autoCycle) return;
    const timer = setInterval(() => {
      if (pausedRef.current) return;
      const currentIndex = CYCLE_ORDER.findIndex(
        (destinationRecord) => destinationRecord.slug === selected.slug,
      );
      const next = CYCLE_ORDER[(currentIndex + 1) % CYCLE_ORDER.length];
      if (next) onSelect(next);
    }, CYCLE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [selected.slug, autoCycle, onSelect]);

  useEffect(() => {
    setAnalyzing(true);
    const timer = setTimeout(() => setAnalyzing(false), 850);
    return () => clearTimeout(timer);
  }, [selected.slug]);

  useEffect(() => {
    setActiveCorridor(selected.slug);
  }, [selected.slug]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  const hague = routeRecord?.hague ?? selected.hague;
  const verificationRequired = routeRecord?.verificationRequired ?? false;
  const accent = hague ? "var(--ms-gold)" : "#D87963";
  const translate = routeRecord?.translationRequired ?? translationLikely(selected);
  const routeStatus = verificationRequired
    ? "Route Verification"
    : hague
      ? "Hague Member ✓"
      : "Consular Review";

  return (
    <div
      className="ms-mini-atlas group relative overflow-hidden rounded-2xl border border-[var(--ms-gold)]/20 bg-[#060608] transition-colors duration-300 hover:border-[var(--ms-gold)]/30"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      <style>{`
        @keyframes msMiniRouteDraw {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes msMiniFieldDrift {
          0%, 100% { transform: translate3d(0,0,0); opacity: .55; }
          50% { transform: translate3d(4px,-2px,0); opacity: .75; }
        }
        @keyframes msMiniDestinationBreath {
          0%, 100% { opacity: .14; transform: scale(.96); }
          50% { opacity: .28; transform: scale(1.04); }
        }
        .ms-mini-route-draw {
          animation: msMiniRouteDraw 1050ms cubic-bezier(.16,1,.3,1) forwards;
        }
        .ms-mini-field {
          animation: msMiniFieldDrift 24s ease-in-out infinite;
        }
        .ms-mini-destination-halo {
          transform-box: fill-box;
          transform-origin: center;
          animation: msMiniDestinationBreath 8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .ms-mini-route-draw,
          .ms-mini-field,
          .ms-mini-destination-halo { animation: none !important; }
        }
      `}</style>

      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/[0.04] px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            {!reduceMotion && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ms-gold)]/55" />
            )}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--ms-gold)]" />
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/75">
            Global Execution Network
          </span>
        </div>
        <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">
          Execution Corridor
        </span>
      </div>

      <div className="relative overflow-hidden">
        <svg
          viewBox="0 0 320 260"
          className="h-[250px] w-full sm:h-[285px]"
          role="img"
          aria-label={`Execution corridor from Florida to ${selected.name}`}
        >
          <defs>
            <radialGradient id="ma-bg" cx="55%" cy="42%" r="78%">
              <stop offset="0%" stopColor="#0E1016" />
              <stop offset="58%" stopColor="#08090D" />
              <stop offset="100%" stopColor="#040406" />
            </radialGradient>
            <linearGradient id="ma-route" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--ms-gold)" stopOpacity="0.35" />
              <stop offset="50%" stopColor={accent} stopOpacity="1" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.7" />
            </linearGradient>
            <radialGradient id="ma-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
              <stop offset="55%" stopColor={accent} stopOpacity="0.07" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
            <filter id="ma-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x={0} y={0} width={320} height={260} fill="url(#ma-bg)" />

          <g className="ms-mini-field" fill="none" stroke="var(--ms-gold)">
            {[76, 124, 172, 220].map((y) => (
              <path
                key={`lat-${y}`}
                d={`M -12 ${y} Q 160 ${y - 12} 332 ${y}`}
                strokeWidth="0.45"
                strokeOpacity="0.07"
              />
            ))}
            {[72, 132, 192, 252].map((x) => (
              <path
                key={`lng-${x}`}
                d={`M ${x} 24 Q ${x - 18} 142 ${x} 244`}
                strokeWidth="0.4"
                strokeOpacity="0.055"
              />
            ))}
            <path d="M -20 238 Q 160 182 340 238" strokeWidth="0.8" strokeOpacity="0.13" />
            <path d="M -20 248 Q 160 198 340 248" strokeWidth="0.5" strokeOpacity="0.07" />
          </g>

          <g>
            {contextDestinations.slice(0, 4).map((contextDestination) => {
              const point = destinationPoint(getGlobalRoute(contextDestination.slug) ?? contextDestination);
              return (
                <path
                  key={`ghost-${contextDestination.slug}`}
                  d={curvedPath(ORIGIN, point)}
                  fill="none"
                  stroke="var(--ms-gold)"
                  strokeWidth="0.55"
                  strokeOpacity="0.065"
                />
              );
            })}
            {contextDestinations.map((contextDestination) => {
              const point = destinationPoint(getGlobalRoute(contextDestination.slug) ?? contextDestination);
              return (
                <circle
                  key={`node-${contextDestination.slug}`}
                  cx={point.x}
                  cy={point.y}
                  r="1.5"
                  fill="var(--ms-gold)"
                  fillOpacity="0.2"
                />
              );
            })}
          </g>

          <circle
            className="ms-mini-destination-halo"
            cx={destination.x}
            cy={destination.y}
            r="52"
            fill="url(#ma-halo)"
          />
          <circle
            cx={destination.x}
            cy={destination.y}
            r="24"
            fill="none"
            stroke={accent}
            strokeWidth="0.6"
            strokeOpacity="0.14"
          />

          <g key={selected.slug}>
            <path
              d={activePath}
              fill="none"
              stroke={accent}
              strokeWidth="5"
              strokeOpacity="0.07"
              filter="url(#ma-glow)"
            />
            <path
              pathLength={1}
              d={activePath}
              fill="none"
              stroke="url(#ma-route)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray="1"
              strokeDashoffset={reduceMotion ? 0 : 1}
              className={reduceMotion ? undefined : "ms-mini-route-draw"}
            />
            {!reduceMotion && (
              <circle r="2.2" fill="#FFF6E2" filter="url(#ma-glow)">
                <animateMotion dur="3.7s" repeatCount="indefinite" path={activePath} />
              </circle>
            )}
          </g>

          <circle cx={ORIGIN.x} cy={ORIGIN.y} r="7" fill="none" stroke="var(--ms-gold)" strokeWidth="0.8" strokeOpacity="0.32" />
          <circle cx={ORIGIN.x} cy={ORIGIN.y} r="3.3" fill="var(--ms-gold)" filter="url(#ma-glow)" />
          <circle cx={ORIGIN.x} cy={ORIGIN.y} r="1.4" fill="#FFF6E2" />
          <text x={ORIGIN.x} y={ORIGIN.y - 13} textAnchor="middle" fontSize="7" fontFamily="monospace" fill="var(--ms-gold)" opacity="0.8">
            FLORIDA
          </text>

          <circle cx={destination.x} cy={destination.y} r="8" fill="none" stroke={accent} strokeWidth="1" strokeOpacity="0.55" />
          <circle cx={destination.x} cy={destination.y} r="3.8" fill={accent} filter="url(#ma-glow)" />
          <circle cx={destination.x} cy={destination.y} r="1.5" fill="#FFF6E2" />
        </svg>

        <div className="pointer-events-none absolute right-4 top-1/2 z-10 max-w-[54%] -translate-y-1/2 text-right sm:right-5">
          <div className="mb-1 flex items-center justify-end gap-1.5">
            <span className="text-xl leading-none">{selected.flag}</span>
            <span className="font-serif text-lg leading-tight text-white">{selected.name}</span>
          </div>
          <div className="flex items-center justify-end">
            {analyzing ? (
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/40">Analyzing…</span>
            ) : (
              <span
                className={`rounded-full border px-2 py-0.5 font-mono text-[7.5px] uppercase tracking-[0.14em] ${
                  hague
                    ? "border-[var(--ms-gold)]/40 bg-[var(--ms-gold)]/[0.08] text-[var(--ms-gold)]"
                    : "border-[#C0563E]/40 bg-[#C0563E]/[0.1] text-[#E0876E]"
                }`}
              >
                {routeStatus}
              </span>
            )}
          </div>
          {!analyzing && translate && (
            <p className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-white/35">
              Translation Review
            </p>
          )}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-3 border-t border-white/[0.05] px-4 py-3 sm:px-5">
        <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">
          Next <span className="text-white/55">{nextDest?.name}</span>
        </span>
        <Link
          href={`/map?country=${encodeURIComponent(selected.slug)}`}
          className="pointer-events-auto inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--ms-gold)]/35 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ms-gold)] transition-all duration-300 hover:border-[var(--ms-gold)] hover:bg-[var(--ms-gold)]/[0.07] group-hover:shadow-[0_0_28px_rgba(198,165,90,0.06)]"
        >
          Launch Atlas <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
