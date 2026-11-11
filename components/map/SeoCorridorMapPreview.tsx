"use client";

import { useId } from "react";
import Link from "next/link";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";
import {
  GLOBAL_ROUTE_DATA,
  getGlobalRoute,
} from "@/src/features/corridors/globalRouteData";

interface Props {
  slug: string;
  className?: string;
}

const W = 720;
const H = 360;
const PAD_X = 54;
const PAD_Y = 44;
const FLORIDA = { lat: 27.6648, lng: -81.5158 };

function project(lat: number, lng: number) {
  return {
    x: PAD_X + ((lng + 180) / 360) * (W - PAD_X * 2),
    y: PAD_Y + ((90 - lat) / 180) * (H - PAD_Y * 2),
  };
}

function routePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
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
  const lift = Math.min(82, Math.max(34, dist * 0.22));
  return `M ${from.x} ${from.y} Q ${mx + px * lift} ${my + py * lift} ${to.x} ${to.y}`;
}

export function SeoCorridorMapPreview({ slug, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const reduceMotion = useMilanoReducedMotion();
  const route = getGlobalRoute(slug);
  if (!route) return null;

  const source = project(FLORIDA.lat, FLORIDA.lng);
  const destination = project(route.lat, route.lng);
  const activePath = routePath(source, destination);
  const accent = route.verificationRequired
    ? "#D3B35A"
    : route.hague
      ? "#C6A55A"
      : "#D87963";
  const routeLabel = route.verificationRequired
    ? "Route verification required"
    : route.hague
      ? "Hague execution corridor"
      : "Authentication / consular corridor";
  const contextRoutes = GLOBAL_ROUTE_DATA.filter(
    (candidate) => candidate.slug !== route.slug,
  )
    .filter((_, index) => index % 4 === 0)
    .slice(0, 11);

  return (
    <div
      data-critical-card=""
      className={`relative w-full overflow-visible rounded-2xl border border-[#C6A55A]/25 bg-[#060608] ${className ?? ""}`}
      style={{ fontFamily: "monospace" }}
    >
      <style>{`
        @keyframes msCorridorDraw {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes msCorridorHalo {
          0%, 100% { opacity: .18; transform: scale(.94); }
          50% { opacity: .36; transform: scale(1.04); }
        }
        .ms-corridor-active-path {
          animation: msCorridorDraw 980ms cubic-bezier(.16,1,.3,1) forwards;
        }
        .ms-corridor-halo {
          transform-box: fill-box;
          transform-origin: center;
          animation: msCorridorHalo 8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .ms-corridor-active-path,
          .ms-corridor-halo { animation: none !important; }
        }
      `}</style>

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.055] px-5 py-4 sm:px-6">
        <div>
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[#C6A55A]/60">
            Corridor Preview
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">{route.flag}</span>
            <div>
              <div className="text-[15px] font-semibold text-white">Florida → {route.name}</div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.13em] text-white/35">
                {routeLabel}
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px] uppercase tracking-[0.16em] text-white/30">Typical route</div>
          <div className="mt-1 text-[10px] text-[#C6A55A]">{route.timeline}</div>
        </div>
      </div>

      <div className="relative overflow-hidden border-b border-white/[0.05] bg-[radial-gradient(circle_at_78%_38%,rgba(198,165,90,0.085),transparent_28%),linear-gradient(180deg,#08090c_0%,#040406_100%)]">
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          className="block min-h-[270px] w-full sm:min-h-[320px]"
          role="img"
          aria-label={`Execution corridor from Florida to ${route.name}`}
        >
          <defs>
            <radialGradient id={`dest-halo-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
              <stop offset="45%" stopColor={accent} stopOpacity="0.09" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`active-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#C6A55A" stopOpacity="0.42" />
              <stop offset="45%" stopColor={accent} stopOpacity="1" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.78" />
            </linearGradient>
            <filter id={`glow-${uid}`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g fill="none" stroke="#C6A55A">
            {[90, 180, 270].map((y) => (
              <path
                key={`lat-${y}`}
                d={`M 18 ${y} Q ${W / 2} ${y - 22} ${W - 18} ${y}`}
                strokeWidth="0.55"
                strokeOpacity="0.075"
              />
            ))}
            {[150, 300, 450, 600].map((x) => (
              <path
                key={`lng-${x}`}
                d={`M ${x} 22 Q ${x - 26} ${H / 2} ${x} ${H - 22}`}
                strokeWidth="0.5"
                strokeOpacity="0.06"
              />
            ))}
          </g>

          <g>
            {contextRoutes.slice(0, 5).map((candidate) => {
              const point = project(candidate.lat, candidate.lng);
              return (
                <path
                  key={`ghost-route-${candidate.slug}`}
                  d={routePath(source, point)}
                  fill="none"
                  stroke="#C6A55A"
                  strokeWidth="0.7"
                  strokeOpacity="0.065"
                />
              );
            })}
            {contextRoutes.map((candidate) => {
              const point = project(candidate.lat, candidate.lng);
              return (
                <circle
                  key={`context-${candidate.slug}`}
                  cx={point.x}
                  cy={point.y}
                  r="2.2"
                  fill={candidate.hague ? "#C6A55A" : "none"}
                  stroke="#C6A55A"
                  strokeWidth="0.7"
                  fillOpacity="0.16"
                  strokeOpacity="0.18"
                />
              );
            })}
          </g>

          <circle
            className="ms-corridor-halo"
            cx={destination.x}
            cy={destination.y}
            r="76"
            fill={`url(#dest-halo-${uid})`}
          />
          <circle
            cx={destination.x}
            cy={destination.y}
            r="36"
            fill="none"
            stroke={accent}
            strokeWidth="0.7"
            strokeOpacity="0.16"
          />
          <circle
            cx={destination.x}
            cy={destination.y}
            r="20"
            fill="none"
            stroke={accent}
            strokeWidth="0.6"
            strokeOpacity="0.12"
          />

          <path
            d={activePath}
            fill="none"
            stroke={accent}
            strokeWidth="7"
            strokeOpacity="0.08"
            filter={`url(#glow-${uid})`}
          />
          <path
            pathLength={1}
            d={activePath}
            fill="none"
            stroke={`url(#active-${uid})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="1"
            strokeDashoffset={reduceMotion ? 0 : 1}
            className={reduceMotion ? undefined : "ms-corridor-active-path"}
          />

          {!reduceMotion && (
            <circle r="3" fill="#FFF6E2" filter={`url(#glow-${uid})`}>
              <animateMotion dur="3.8s" repeatCount="indefinite" path={activePath} />
            </circle>
          )}

          <circle cx={source.x} cy={source.y} r="8" fill="none" stroke="#C6A55A" strokeWidth="1" strokeOpacity="0.32" />
          <circle cx={source.x} cy={source.y} r="4" fill="#C6A55A" filter={`url(#glow-${uid})`} />
          <circle cx={source.x} cy={source.y} r="1.7" fill="#FFF6E2" />
          <text x={source.x} y={source.y - 14} textAnchor="middle" fill="#C6A55A" fontSize="10" opacity="0.78">
            FLORIDA
          </text>

          <circle cx={destination.x} cy={destination.y} r="11" fill="none" stroke={accent} strokeWidth="1.2" strokeOpacity="0.55" />
          <circle cx={destination.x} cy={destination.y} r="5.5" fill={accent} filter={`url(#glow-${uid})`} />
          <circle cx={destination.x} cy={destination.y} r="2" fill="#FFF6E2" />
          <text
            x={Math.min(Math.max(destination.x, 72), W - 72)}
            y={Math.max(34, destination.y - 20)}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="11"
            fontWeight="600"
          >
            {route.name.toUpperCase()}
          </text>
        </svg>
      </div>

      <div className="relative z-10 grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="mb-3 text-[9px] uppercase tracking-[0.17em] text-white/35">Execution Path</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {route.executionPath.map((step, index) => (
              <div key={`${route.slug}-${index}`} className="flex min-w-0 items-start gap-2">
                <span className="mt-[1px] min-w-4 text-[9px] text-[#C6A55A]">0{index + 1}</span>
                <span className="text-[10px] leading-5 text-white/58">{step}</span>
              </div>
            ))}
          </div>
          {route.translationRequired && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-[#C6A55A]/14 bg-[#C6A55A]/[0.05] px-3 py-2 text-[9px] uppercase tracking-[0.12em] text-[#C6A55A]">
              Translation review required
            </div>
          )}
        </div>

        <Link
          href={`/intake?destination=${slug}`}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#C6A55A]/45 px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-[#C6A55A] transition-colors hover:border-[#C6A55A] hover:bg-[#C6A55A]/[0.06]"
        >
          Begin Intake →
        </Link>
      </div>
    </div>
  );
}
