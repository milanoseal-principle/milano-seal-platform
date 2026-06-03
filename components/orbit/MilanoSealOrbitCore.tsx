"use client";

import { useEffect, useRef, useState } from "react";
import { ORBIT_STATE_MAP, OrbitMode, OrbitState } from "@/lib/orbit/orbitStateMap";

export interface OrbitCoreProps {
  state?: OrbitState;
  mode?: OrbitMode;
  size?: number;
  showLabel?: boolean;
  crestSrc?: string;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function MilanoSealOrbitCore({
  state = "idle",
  mode = "dashboard",
  size = 160,
  showLabel = true,
  crestSrc,
}: OrbitCoreProps) {
  const cfg = ORBIT_STATE_MAP[state];
  const reduced = useReducedMotion();
  const cx = size / 2;
  const cy = size / 2;
  const crestR = size * 0.18;
  const rings = Array.from({ length: cfg.ringCount }, (_, i) => ({
    r: crestR + (i + 1) * (size * 0.085),
    delay: i * 0.6,
    opacity: cfg.glowIntensity * (1 - i * 0.22),
    dashLen: 4 + i * 2,
    dashGap: 6 + i * 3,
    rotateDir: i % 2 === 0 ? 1 : -1,
  }));

  const animDuration = reduced ? "0s" : `${cfg.pulseSpeed}s`;

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        userSelect: "none",
      }}
      aria-label={`Matter status: ${cfg.label}`}
      role="img"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id={`og-${state}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={cfg.color} stopOpacity={cfg.glowIntensity * 0.6} />
            <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
          </radialGradient>
          <filter id={`glow-${state}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={size * 0.03} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ambient glow */}
        <circle
          cx={cx}
          cy={cy}
          r={size * 0.38}
          fill={`url(#og-${state})`}
        />

        {/* orbit rings */}
        {rings.map((ring, i) => (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r={ring.r}
              stroke={cfg.color}
              strokeWidth={0.75}
              strokeOpacity={ring.opacity * 0.5}
              strokeDasharray={`${ring.dashLen} ${ring.dashGap}`}
            >
              {!reduced && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`0 ${cx} ${cy}`}
                  to={`${ring.rotateDir * 360} ${cx} ${cy}`}
                  dur={`${cfg.pulseSpeed * (2.5 + i * 0.7)}s`}
                  repeatCount="indefinite"
                />
              )}
            </circle>
            {/* orbit node */}
            <circle r={2.5} fill={cfg.color} opacity={ring.opacity}>
              {!reduced && (
                <animateMotion
                  dur={`${cfg.pulseSpeed * (2.5 + i * 0.7)}s`}
                  repeatCount="indefinite"
                  path={`M ${cx + ring.r} ${cy} A ${ring.r} ${ring.r} 0 1 ${ring.rotateDir > 0 ? 0 : 1} ${cx + ring.r - 0.001} ${cy}`}
                />
              )}
            </circle>
          </g>
        ))}

        {/* crest medallion */}
        <circle
          cx={cx}
          cy={cy}
          r={crestR}
          fill="rgba(8,5,1,0.97)"
          stroke={cfg.color}
          strokeWidth={1.5}
          filter={`url(#glow-${state})`}
        />

        {crestSrc ? (
          <image
            href={crestSrc}
            x={cx - crestR * 0.8}
            y={cy - crestR * 0.8}
            width={crestR * 1.6}
            height={crestR * 1.6}
            style={{ borderRadius: "50%" }}
          />
        ) : (
          <text
            x={cx}
            y={cy + size * 0.032}
            textAnchor="middle"
            fontSize={size * 0.13}
            fontFamily="'Playfair Display', Georgia, serif"
            fontWeight={700}
            fill={cfg.color}
          >
            M
          </text>
        )}

        {/* pulse ring */}
        {!reduced && (
          <circle cx={cx} cy={cy} r={crestR} stroke={cfg.color} strokeWidth={1} fill="none">
            <animate
              attributeName="r"
              values={`${crestR};${crestR * 1.6};${crestR}`}
              dur={animDuration}
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-opacity"
              values={`${cfg.glowIntensity};0;${cfg.glowIntensity}`}
              dur={animDuration}
              repeatCount="indefinite"
            />
          </circle>
        )}
      </svg>

      {showLabel && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: size * 0.08,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 600,
              color: cfg.color,
              letterSpacing: "0.05em",
            }}
          >
            {cfg.label}
          </div>
          <div
            style={{
              fontSize: size * 0.065,
              color: "rgba(198,165,90,0.55)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            {cfg.sublabel}
          </div>
        </div>
      )}
    </div>
  );
}
