"use client";

import { useId } from "react";
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

// Refined dot-matrix world field. A sleek "global authority network" backdrop
// rather than hand-drawn continent polygons — reads premium and never amateur.
const DOT_COLS = 46;
const DOT_ROWS = 22;
const DOTS = Array.from({ length: DOT_COLS * DOT_ROWS }, (_, i) => {
  const col = i % DOT_COLS;
  const row = Math.floor(i / DOT_COLS);
  const x = (col + 0.5) * (W / DOT_COLS);
  const y = (row + 0.5) * (H / DOT_ROWS);
  // Deterministic opacity variation (no Math.random — stable SSR/CSR).
  const seed = (col * 13 + row * 29 + col * row * 7) % 11;
  const opacity = 0.05 + (seed % 4) * 0.02;
  const r = seed % 7 === 0 ? 0.9 : 0.6;
  return { x, y, r, opacity };
});

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
  const accent = hague ? "var(--ms-gold)" : "#E0876E";

  return (
    <div className="rounded-xl border border-[var(--ms-gold)]/20 bg-[#070709] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--ms-gold)]/70">
          Route Map
        </p>
        <span className="text-lg leading-none">{corridor.flag}</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg border border-[var(--ms-gold)]/10"
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
        <g stroke="var(--ms-gold)" strokeWidth={0.4} opacity={0.06}>
          {[-120, -60, 0, 60, 120].map((lng) => (
            <line key={`v${lng}`} x1={projectX(lng)} y1={0} x2={projectX(lng)} y2={H} />
          ))}
          {[-60, -30, 0, 30, 60].map((lat) => (
            <line key={`h${lat}`} x1={0} y1={projectY(lat)} x2={W} y2={projectY(lat)} />
          ))}
        </g>

        {/* Global dot-matrix field */}
        <g fill="var(--ms-gold)">
          {DOTS.map((dot, i) => (
            <circle key={i} cx={dot.x} cy={dot.y} r={dot.r} fillOpacity={dot.opacity} />
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
              fill="var(--ms-gold)"
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
          <span className="rounded-full border border-[var(--ms-gold)]/40 bg-[var(--ms-gold)]/[0.08] px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--ms-gold)]">
            Hague Route
          </span>
        ) : (
          <span className="rounded-full border border-[#C0563E]/40 bg-[#C0563E]/[0.1] px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-[#E0876E]">
            Consular Review
          </span>
        )}
      </div>
    </div>
  );
}
