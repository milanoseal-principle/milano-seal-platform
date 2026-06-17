"use client";

import { useId } from "react";
import Link from "next/link";
import {
  FLORIDA_ORIGIN,
  type HomeExecutionCorridor,
} from "@/lib/intelligence/homeCorridors";

interface Props {
  corridor: HomeExecutionCorridor;
}

const W = 360;
const H = 180;

// Equirectangular projection. With W=360/H=180 this reduces to:
//   x = lng + 180 ,  y = 90 - lat
function projectX(lng: number) {
  return ((lng + 180) / 360) * W;
}
function projectY(lat: number) {
  return ((90 - lat) / 180) * H;
}

// Simplified continent silhouettes in screen-space (equirectangular).
// Low-detail on purpose — a refined cartographic backdrop, not the full Atlas.
const CONTINENTS: string[] = [
  // North America
  "M52 40 L70 30 L95 27 L112 33 L116 44 L104 52 L101 60 L95 64 L90 75 L84 70 L82 58 L72 56 L64 50 L56 48 Z",
  // Greenland
  "M120 22 L133 20 L135 30 L124 33 Z",
  // South America
  "M100 80 L113 78 L123 87 L125 101 L117 121 L110 139 L104 132 L106 112 L100 98 Z",
  // Europe
  "M168 38 L186 33 L201 35 L209 42 L199 48 L188 47 L178 51 L170 46 Z",
  // Africa
  "M176 56 L201 54 L215 63 L221 81 L211 101 L201 117 L193 110 L189 92 L181 78 L175 66 Z",
  // Asia
  "M210 32 L251 26 L291 30 L321 40 L327 52 L311 60 L291 58 L271 64 L251 60 L236 66 L223 58 L214 46 Z",
  // India peninsula
  "M250 62 L263 64 L259 79 L252 72 Z",
  // Australia
  "M296 104 L321 102 L333 112 L327 126 L309 128 L299 118 Z",
];

export function MiniCorridorMapPreview({ corridor }: Props) {
  const uid = useId().replace(/:/g, "");
  const hasDestination = corridor.lat !== 0 || corridor.lng !== 0;

  const ox = projectX(FLORIDA_ORIGIN.lng);
  const oy = projectY(FLORIDA_ORIGIN.lat);
  const dx = projectX(corridor.lng);
  const dy = projectY(corridor.lat);

  // Control point: midpoint lifted perpendicular (upward) by ~32% of distance.
  const mx = (ox + dx) / 2;
  const my = (oy + dy) / 2;
  const vx = dx - ox;
  const vy = dy - oy;
  const dist = Math.hypot(vx, vy) || 1;
  let px = -vy / dist;
  let py = vx / dist;
  if (py > 0) {
    px = -px;
    py = -py;
  }
  const lift = dist * 0.32;
  const cx = mx + px * lift;
  const cy = my + py * lift;

  const arcPath = `M ${ox} ${oy} Q ${cx} ${cy} ${dx} ${dy}`;
  const hague = corridor.hagueMember;
  const accent = hague ? "#C6A55A" : "#E0876E";

  return (
    <div className="rounded-xl border border-[#C6A55A]/20 bg-[#070709] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-[#C6A55A]/70">
            Execution Corridor Snapshot
          </p>
          <p className="mt-1 text-xs text-white/50">
            Florida origin → {corridor.country} destination
          </p>
        </div>
        <span className="mt-0.5 text-lg leading-none">{corridor.flag}</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg border border-[#C6A55A]/10"
        role="img"
        aria-label={`Corridor map from Florida to ${corridor.country}`}
      >
        <defs>
          <radialGradient id={`bg-${uid}`} cx="50%" cy="42%" r="75%">
            <stop offset="0%" stopColor="#0B0C10" />
            <stop offset="100%" stopColor="#040406" />
          </radialGradient>
          <linearGradient id={`arc-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
            <stop offset="50%" stopColor={accent} stopOpacity="1" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.55" />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x={0} y={0} width={W} height={H} fill={`url(#bg-${uid})`} />

        {/* Graticule */}
        <g stroke="#C6A55A" strokeWidth={0.4} opacity={0.06}>
          {[-120, -60, 0, 60, 120].map((lng) => (
            <line key={`v${lng}`} x1={projectX(lng)} y1={0} x2={projectX(lng)} y2={H} />
          ))}
          {[-60, -30, 0, 30, 60].map((lat) => (
            <line key={`h${lat}`} x1={0} y1={projectY(lat)} x2={W} y2={projectY(lat)} />
          ))}
        </g>

        {/* Continents */}
        <g
          fill="#C6A55A"
          fillOpacity={0.07}
          stroke="#C6A55A"
          strokeOpacity={0.22}
          strokeWidth={0.5}
        >
          {CONTINENTS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {hasDestination && (
          <>
            {/* Arc glow base */}
            <path
              d={arcPath}
              fill="none"
              stroke={accent}
              strokeWidth={3.5}
              strokeOpacity={0.18}
              strokeLinecap="round"
              filter={`url(#glow-${uid})`}
            />
            {/* Arc body */}
            <path
              d={arcPath}
              fill="none"
              stroke={`url(#arc-${uid})`}
              strokeWidth={1.4}
              strokeLinecap="round"
            />
            {/* Flowing dash overlay */}
            <path
              d={arcPath}
              fill="none"
              stroke={accent}
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeDasharray="2 10"
              opacity={0.9}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-48"
                dur="1.6s"
                repeatCount="indefinite"
              />
            </path>
            {/* Travelling pulse */}
            <circle r={2.2} fill="#FFF6E2">
              <animateMotion dur="2.6s" repeatCount="indefinite" path={arcPath} />
            </circle>

            {/* Origin marker */}
            <circle cx={ox} cy={oy} r={3} fill={accent} filter={`url(#glow-${uid})`} />
            <circle cx={ox} cy={oy} r={1.4} fill="#FFF6E2" />

            {/* Destination marker + ping */}
            <circle cx={dx} cy={dy} r={5} fill="none" stroke={accent} strokeWidth={1}>
              <animate attributeName="r" values="3;8;3" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={dx} cy={dy} r={3.2} fill={accent} filter={`url(#glow-${uid})`} />
            <circle cx={dx} cy={dy} r={1.5} fill="#FFF6E2" />

            {/* Labels */}
            <text
              x={ox}
              y={oy + 12}
              textAnchor="middle"
              fontSize={7}
              fontFamily="monospace"
              fill="#C6A55A"
              opacity={0.75}
            >
              FLORIDA
            </text>
            <text
              x={Math.min(Math.max(dx, 22), W - 22)}
              y={dy - 9}
              textAnchor="middle"
              fontSize={7.5}
              fontFamily="monospace"
              fill="#FFFFFF"
              opacity={0.85}
            >
              {corridor.country.toUpperCase()}
            </text>
          </>
        )}
      </svg>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-white/60">
          Florida → {corridor.country}
        </span>
        {hague ? (
          <span className="rounded-full border border-[#C6A55A]/40 bg-[#C6A55A]/[0.08] px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-[#C6A55A]">
            Hague Route
          </span>
        ) : (
          <span className="rounded-full border border-[#C0563E]/40 bg-[#C0563E]/[0.1] px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-[#E0876E]">
            Manual Review
          </span>
        )}
      </div>

      <p className="mt-3 text-[10px] leading-5 text-white/30">
        Preview only. Open the full Intelligence Atlas for country-level routing.
      </p>

      <Link
        href="/map"
        className="mt-2 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#C6A55A] transition-colors hover:text-[#C6A55A]/80"
      >
        Open Full Intelligence Map →
      </Link>
    </div>
  );
}
