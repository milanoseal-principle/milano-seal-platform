"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import {
  GLOBAL_ROUTE_DATA,
  type GlobalRouteRecord,
} from "@/src/features/corridors/globalRouteData";

interface Props {
  selectedSlug?: string | null;
  onSelectCountry?: (slug: string) => void;
  className?: string;
}

const GLOBE_CX = 240;
const GLOBE_CY = 230;
const GLOBE_R = 204;
const FLORIDA: [number, number] = [27.6648, -81.5158];

function project(lat: number, lng: number): [number, number] {
  const x = GLOBE_CX - GLOBE_R + ((lng + 180) / 360) * (GLOBE_R * 2);
  const y = GLOBE_CY + GLOBE_R - ((lat + 90) / 180) * (GLOBE_R * 2);
  return [x, y];
}

function buildArc(route: GlobalRouteRecord) {
  const [fx, fy] = project(...FLORIDA);
  const [tx, ty] = project(route.lat, route.lng);
  const mx = (fx + tx) / 2;
  const my = (fy + ty) / 2;
  const vx = tx - fx;
  const vy = ty - fy;
  const dist = Math.hypot(vx, vy) || 1;
  let px = -vy / dist;
  let py = vx / dist;
  if (py > 0) {
    px = -px;
    py = -py;
  }
  const lift = Math.min(84, Math.max(28, dist * 0.24));
  return `M ${fx} ${fy} Q ${mx + px * lift} ${my + py * lift} ${tx} ${ty}`;
}

export function GlobalRouteGlobe({ selectedSlug, onSelectCountry, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const prevSelected = useRef<string | null | undefined>(null);

  useEffect(() => {
    if (selectedSlug !== prevSelected.current) {
      prevSelected.current = selectedSlug;
      setAnimKey((key) => key + 1);
    }
  }, [selectedSlug]);

  const [fx, fy] = project(...FLORIDA);
  const selectedRoute = GLOBAL_ROUTE_DATA.find((route) => route.slug === selectedSlug) ?? null;
  const selectedAccent = selectedRoute?.hague ? "#C6A55A" : "#D87963";
  const selectedPath = selectedRoute ? buildArc(selectedRoute) : null;
  const ambientRoutes = GLOBAL_ROUTE_DATA.filter(
    (route, index) => route.slug !== selectedSlug && index % 5 === 0,
  ).slice(0, 10);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-[#C6A55A]/20 bg-[#050507] ${className ?? ""}`}
    >
      <style>{`
        @keyframes msAuthorityDraw {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes msAuthorityBreath {
          0%, 100% { opacity: .14; transform: scale(.96); }
          50% { opacity: .28; transform: scale(1.04); }
        }
        .ms-authority-route {
          animation: msAuthorityDraw 950ms cubic-bezier(.16,1,.3,1) forwards;
        }
        .ms-authority-halo {
          transform-box: fill-box;
          transform-origin: center;
          animation: msAuthorityBreath 9s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .ms-authority-route,
          .ms-authority-halo { animation: none !important; }
        }
      `}</style>

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.05] px-5 py-4 sm:px-6">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#C6A55A]/70">
            Authority Coverage
          </div>
          <div className="mt-1 text-[10px] text-white/34">
            Execution authority and destination coverage
          </div>
        </div>
        {selectedRoute ? (
          <div className="text-right">
            <div className="text-[12px] font-medium text-white">
              {selectedRoute.flag} {selectedRoute.name}
            </div>
            <div
              className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em]"
              style={{ color: selectedAccent }}
            >
              {selectedRoute.hague ? "Hague route" : "Authentication / consular route"}
            </div>
          </div>
        ) : (
          <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">
            Global context
          </div>
        )}
      </div>

      <div className="relative bg-[radial-gradient(circle_at_66%_38%,rgba(198,165,90,0.075),transparent_34%),linear-gradient(180deg,#08090c_0%,#040406_100%)] px-2 py-3 sm:px-4">
        <svg
          viewBox="0 0 480 460"
          className="block h-auto min-h-[320px] w-full"
          role="img"
          aria-label={selectedRoute ? `Authority coverage with active Florida to ${selectedRoute.name} corridor` : "Global authority coverage"}
        >
          <defs>
            <clipPath id={`globe-clip-${uid}`}>
              <circle cx={GLOBE_CX} cy={GLOBE_CY} r={GLOBE_R} />
            </clipPath>
            <radialGradient id={`globe-bg-${uid}`} cx="44%" cy="35%" r="72%">
              <stop offset="0%" stopColor="#111119" />
              <stop offset="62%" stopColor="#08090C" />
              <stop offset="100%" stopColor="#040406" />
            </radialGradient>
            <radialGradient id={`selected-halo-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={selectedAccent ?? "#C6A55A"} stopOpacity="0.25" />
              <stop offset="50%" stopColor={selectedAccent ?? "#C6A55A"} stopOpacity="0.07" />
              <stop offset="100%" stopColor={selectedAccent ?? "#C6A55A"} stopOpacity="0" />
            </radialGradient>
            <filter id={`authority-glow-${uid}`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx={GLOBE_CX}
            cy={GLOBE_CY}
            r={GLOBE_R}
            fill={`url(#globe-bg-${uid})`}
            stroke="#C6A55A"
            strokeWidth="0.8"
            strokeOpacity="0.25"
          />

          {/* Curved geographic field */}
          <g
            clipPath={`url(#globe-clip-${uid})`}
            fill="none"
            stroke="#C6A55A"
          >
            {[-60, -30, 0, 30, 60].map((lat) => {
              const y = GLOBE_CY + GLOBE_R - ((lat + 90) / 180) * (GLOBE_R * 2);
              return (
                <path
                  key={`lat-${lat}`}
                  d={`M ${GLOBE_CX - GLOBE_R} ${y} Q ${GLOBE_CX} ${y - 18} ${GLOBE_CX + GLOBE_R} ${y}`}
                  strokeWidth="0.55"
                  strokeOpacity="0.085"
                />
              );
            })}
            {[-120, -60, 0, 60, 120].map((lng) => {
              const x = GLOBE_CX - GLOBE_R + ((lng + 180) / 360) * (GLOBE_R * 2);
              return (
                <path
                  key={`lng-${lng}`}
                  d={`M ${x} ${GLOBE_CY - GLOBE_R} Q ${x - 24} ${GLOBE_CY} ${x} ${GLOBE_CY + GLOBE_R}`}
                  strokeWidth="0.5"
                  strokeOpacity="0.07"
                />
              );
            })}
          </g>

          {/* Dormant real execution corridors */}
          <g clipPath={`url(#globe-clip-${uid})`}>
            {ambientRoutes.map((route) => (
              <path
                key={`ambient-${route.slug}`}
                d={buildArc(route)}
                fill="none"
                stroke="#C6A55A"
                strokeWidth="0.75"
                strokeOpacity="0.075"
              />
            ))}
          </g>

          {/* Selected destination atmosphere and route */}
          {selectedRoute && selectedPath && (() => {
            const [tx, ty] = project(selectedRoute.lat, selectedRoute.lng);
            return (
              <g key={`selected-${selectedRoute.slug}-${animKey}`} clipPath={`url(#globe-clip-${uid})`}>
                <circle
                  className="ms-authority-halo"
                  cx={tx}
                  cy={ty}
                  r="56"
                  fill={`url(#selected-halo-${uid})`}
                />
                <path
                  d={selectedPath}
                  fill="none"
                  stroke={selectedAccent}
                  strokeWidth="6"
                  strokeOpacity="0.07"
                  filter={`url(#authority-glow-${uid})`}
                />
                <path
                  pathLength={1}
                  d={selectedPath}
                  fill="none"
                  stroke={selectedAccent}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeDasharray="1"
                  strokeDashoffset={reduceMotion ? 0 : 1}
                  className={reduceMotion ? undefined : "ms-authority-route"}
                />
                {!reduceMotion && (
                  <circle r="2.8" fill="#FFF6E2" filter={`url(#authority-glow-${uid})`}>
                    <animateMotion dur="4.2s" repeatCount="indefinite" path={selectedPath} />
                  </circle>
                )}
              </g>
            );
          })()}

          {/* Canonical destination nodes */}
          <g clipPath={`url(#globe-clip-${uid})`}>
            {GLOBAL_ROUTE_DATA.map((route) => {
              const [cx, cy] = project(route.lat, route.lng);
              const isSelected = selectedSlug === route.slug;
              const isHovered = hovered === route.slug;
              const nodeAccent = route.hague ? "#C6A55A" : "#D87963";
              const r = isSelected ? 5.2 : isHovered ? 4.2 : 3;

              return (
                <g
                  key={route.slug}
                  role={onSelectCountry ? "button" : undefined}
                  tabIndex={onSelectCountry ? 0 : undefined}
                  aria-label={onSelectCountry ? `Select ${route.name}` : undefined}
                  style={{ cursor: onSelectCountry ? "pointer" : "default" }}
                  onMouseEnter={() => setHovered(route.slug)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(route.slug)}
                  onBlur={() => setHovered(null)}
                  onClick={() => onSelectCountry?.(route.slug)}
                  onKeyDown={(event) => {
                    if (!onSelectCountry) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectCountry(route.slug);
                    }
                  }}
                >
                  {(isSelected || isHovered) && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r + (isSelected ? 7 : 4)}
                      fill="none"
                      stroke={nodeAccent}
                      strokeWidth={isSelected ? 1.2 : 0.8}
                      strokeOpacity={isSelected ? 0.62 : 0.32}
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={route.hague ? nodeAccent : "#050507"}
                    stroke={nodeAccent}
                    strokeWidth={route.hague ? 0.6 : 1}
                    fillOpacity={isSelected ? 1 : isHovered ? 0.75 : 0.42}
                    strokeOpacity={isSelected ? 0.95 : 0.52}
                  />
                </g>
              );
            })}
          </g>

          {/* Florida source */}
          <circle cx={fx} cy={fy} r="9" fill="none" stroke="#C6A55A" strokeWidth="1" strokeOpacity="0.4" />
          <circle cx={fx} cy={fy} r="4.5" fill="#C6A55A" filter={`url(#authority-glow-${uid})`} />
          <circle cx={fx} cy={fy} r="1.7" fill="#FFF6E2" />
          <text x={fx} y={fy - 14} textAnchor="middle" fill="#C6A55A" fontSize="9" fontFamily="monospace" opacity="0.72">
            FLORIDA
          </text>

          {/* Hover context */}
          {hovered && (() => {
            const route = GLOBAL_ROUTE_DATA.find((candidate) => candidate.slug === hovered);
            if (!route) return null;
            const [cx, cy] = project(route.lat, route.lng);
            const tx = cx > GLOBE_CX ? Math.max(70, cx - 104) : Math.min(340, cx + 10);
            const ty = cy < 70 ? cy + 28 : cy - 20;
            return (
              <g pointerEvents="none">
                <rect x={tx - 6} y={ty - 15} width="100" height="21" rx="5" fill="#09090D" stroke="#C6A55A" strokeWidth="0.55" strokeOpacity="0.42" />
                <text x={tx} y={ty} fill="#E8D9B5" fontSize="9" fontFamily="monospace">
                  {route.flag} {route.name}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] px-5 py-4 sm:px-6">
        <span className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/28">
          Florida origin · destination-aware routing
        </span>
        <Link
          href={selectedRoute ? `/map?country=${encodeURIComponent(selectedRoute.slug)}` : "/map"}
          className="inline-flex min-h-11 items-center rounded-full border border-[#C6A55A]/32 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#C6A55A] transition-colors hover:border-[#C6A55A] hover:bg-[#C6A55A]/[0.055]"
        >
          Open Atlas →
        </Link>
      </div>
    </div>
  );
}
