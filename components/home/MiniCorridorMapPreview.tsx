"use client";

import type { ReactElement } from "react";
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

function projectX(lng: number) {
  return ((lng + 180) / 360) * W;
}
function projectY(lat: number) {
  return ((90 - lat) / 180) * H;
}

export function MiniCorridorMapPreview({ corridor }: Props) {
  const hasDestination = corridor.lat !== 0 || corridor.lng !== 0;

  const ox = projectX(FLORIDA_ORIGIN.lng);
  const oy = projectY(FLORIDA_ORIGIN.lat);
  const dx = projectX(corridor.lng);
  const dy = projectY(corridor.lat);

  // Control point: midpoint lifted upward by ~30% of distance (perpendicular).
  const mx = (ox + dx) / 2;
  const my = (oy + dy) / 2;
  const vx = dx - ox;
  const vy = dy - oy;
  const dist = Math.hypot(vx, vy) || 1;
  // Perpendicular unit vector, lifted upward (negative y screen direction).
  let px = -vy / dist;
  let py = vx / dist;
  if (py > 0) {
    px = -px;
    py = -py;
  }
  const lift = dist * 0.3;
  const cx = mx + px * lift;
  const cy = my + py * lift;

  const graticule: ReactElement[] = [];
  for (let lng = -180; lng <= 180; lng += 30) {
    const x = projectX(lng);
    graticule.push(
      <line
        key={`v-${lng}`}
        x1={x}
        y1={0}
        x2={x}
        y2={H}
        stroke="#C6A55A"
        strokeWidth={0.4}
        opacity={0.08}
      />,
    );
  }
  for (let lat = -90; lat <= 90; lat += 30) {
    const y = projectY(lat);
    graticule.push(
      <line
        key={`h-${lat}`}
        x1={0}
        y1={y}
        x2={W}
        y2={y}
        stroke="#C6A55A"
        strokeWidth={0.4}
        opacity={0.08}
      />,
    );
  }

  return (
    <div className="rounded-xl border border-[#C6A55A]/20 bg-[#070709] p-4">
      <div className="mb-3">
        <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-[#C6A55A]/70">
          Execution Corridor Snapshot
        </p>
        <p className="mt-1 text-xs text-white/50">
          Florida origin → {corridor.country} destination
        </p>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg border border-[#C6A55A]/10 bg-[#050507]"
        role="img"
        aria-label={`Corridor map from Florida to ${corridor.country}`}
      >
        {graticule}
        <rect
          x={0.5}
          y={0.5}
          width={W - 1}
          height={H - 1}
          fill="none"
          stroke="#C6A55A"
          strokeWidth={0.5}
          opacity={0.15}
        />

        {hasDestination && (
          <>
            <path
              d={`M ${ox} ${oy} Q ${cx} ${cy} ${dx} ${dy}`}
              fill="none"
              stroke="#C6A55A"
              strokeWidth={1.2}
              strokeOpacity={0.7}
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
            <circle cx={ox} cy={oy} r={2.4} fill="#C6A55A" />
            <circle
              cx={dx}
              cy={dy}
              r={5}
              fill="none"
              stroke="#C6A55A"
              strokeWidth={1}
              opacity={0.5}
            >
              <animate
                attributeName="r"
                values="3;7;3"
                dur="2.4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0;0.6"
                dur="2.4s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={dx} cy={dy} r={2.8} fill="#C6A55A" />
          </>
        )}
      </svg>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-white/60">
          Florida → {corridor.country}
        </span>
        {corridor.hagueMember ? (
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
