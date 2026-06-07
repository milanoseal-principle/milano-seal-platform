"use client";

import React from "react";

export type MilanoGlobeCourierLoaderProps = {
  label?: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg";
  mode?: "route" | "payment" | "courier" | "release" | "atlas" | "vault";
  reducedMotion?: boolean;
};

const MODE_DEFAULTS: Record<
  NonNullable<MilanoGlobeCourierLoaderProps["mode"]>,
  { label: string; sublabel: string }
> = {
  route: {
    label: "Reviewing international route",
    sublabel: "Preparing destination-country routing intelligence.",
  },
  payment: {
    label: "Confirming payment gate",
    sublabel: "Verifying secure payment status before execution.",
  },
  courier: {
    label: "Preparing courier custody",
    sublabel: "Loading carrier status and document release tracking.",
  },
  release: {
    label: "Preparing release review",
    sublabel: "Confirming custody, delivery, and release readiness.",
  },
  atlas: {
    label: "Searching the Atlas",
    sublabel: "Loading destination-country document intelligence.",
  },
  vault: {
    label: "Opening The Vault",
    sublabel: "Preparing secure document visibility.",
  },
};

const SIZE_MAP = {
  sm: { globe: 64, wrapper: 80 },
  md: { globe: 96, wrapper: 120 },
  lg: { globe: 128, wrapper: 160 },
};

export function MilanoGlobeCourierLoader({
  label,
  sublabel,
  size = "md",
  mode = "route",
  reducedMotion = false,
}: MilanoGlobeCourierLoaderProps) {
  const defaults = MODE_DEFAULTS[mode];
  const resolvedLabel = label ?? defaults.label;
  const resolvedSublabel = sublabel ?? defaults.sublabel;
  const { globe: globeSize, wrapper: wrapperSize } = SIZE_MAP[size];

  const orbitRadius = wrapperSize / 2 - 8;
  const cx = wrapperSize / 2;
  const cy = wrapperSize / 2;

  return (
    <>
      {!reducedMotion && (
        <style>{`
          @keyframes ms-globe-breathe {
            0%, 100% { opacity: 0.85; }
            50% { opacity: 1; }
          }
          @keyframes ms-orbit {
            from { transform: rotate(0deg) translateX(${orbitRadius}px) rotate(0deg); }
            to   { transform: rotate(360deg) translateX(${orbitRadius}px) rotate(-360deg); }
          }
          @keyframes ms-meridian-drift {
            from { stroke-dashoffset: 0; }
            to   { stroke-dashoffset: -120; }
          }
          @keyframes ms-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .ms-globe-breathe {
            animation: ms-globe-breathe 2.4s ease-in-out infinite;
          }
          .ms-orbit-packet {
            transform-origin: ${cx}px ${cy}px;
            animation: ms-orbit 3.2s linear infinite;
          }
          .ms-meridian {
            animation: ms-meridian-drift 6s linear infinite;
            stroke-dasharray: 8 4;
          }
          .ms-loader-fadein {
            animation: ms-fade-in 0.6s ease-out forwards;
          }
        `}</style>
      )}
      {reducedMotion && (
        <style>{`
          @keyframes ms-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .ms-loader-fadein {
            animation: ms-fade-in 1.2s ease-out forwards;
          }
        `}</style>
      )}

      <div
        className="ms-loader-fadein"
        role="status"
        aria-live="polite"
        aria-label={resolvedLabel}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          background: "#0A0A0A",
          padding: "32px 24px",
        }}
      >
        {/* Globe SVG */}
        <div
          style={{
            position: "relative",
            width: wrapperSize,
            height: wrapperSize,
          }}
        >
          <svg
            width={wrapperSize}
            height={wrapperSize}
            viewBox={`0 0 ${wrapperSize} ${wrapperSize}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={reducedMotion ? undefined : "ms-globe-breathe"}
            aria-hidden="true"
          >
            {/* Defs for metallic gold gradient */}
            <defs>
              <radialGradient
                id="ms-globe-grad"
                cx="40%"
                cy="35%"
                r="60%"
                fx="40%"
                fy="35%"
              >
                <stop offset="0%" stopColor="#E8C96A" />
                <stop offset="45%" stopColor="#C5A059" />
                <stop offset="100%" stopColor="#6B4E1A" />
              </radialGradient>
              <radialGradient
                id="ms-globe-sheen"
                cx="35%"
                cy="30%"
                r="40%"
              >
                <stop offset="0%" stopColor="rgba(255,240,180,0.22)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
              <clipPath id="ms-globe-clip">
                <circle cx={cx} cy={cy} r={globeSize / 2} />
              </clipPath>
            </defs>

            {/* Globe body */}
            <circle
              cx={cx}
              cy={cy}
              r={globeSize / 2}
              fill="url(#ms-globe-grad)"
              stroke="#C5A059"
              strokeWidth="1.5"
            />

            {/* Meridian lines clipped to globe */}
            <g clipPath="url(#ms-globe-clip)">
              {/* Equator */}
              <ellipse
                cx={cx}
                cy={cy}
                rx={globeSize / 2}
                ry={globeSize / 8}
                stroke="rgba(197,160,89,0.45)"
                strokeWidth="1"
                fill="none"
                className={reducedMotion ? undefined : "ms-meridian"}
              />
              {/* Tropic lines */}
              <ellipse
                cx={cx}
                cy={cy - globeSize / 6}
                rx={globeSize / 2.4}
                ry={globeSize / 14}
                stroke="rgba(197,160,89,0.3)"
                strokeWidth="0.8"
                fill="none"
                className={reducedMotion ? undefined : "ms-meridian"}
              />
              <ellipse
                cx={cx}
                cy={cy + globeSize / 6}
                rx={globeSize / 2.4}
                ry={globeSize / 14}
                stroke="rgba(197,160,89,0.3)"
                strokeWidth="0.8"
                fill="none"
                className={reducedMotion ? undefined : "ms-meridian"}
              />
              {/* Prime meridian */}
              <ellipse
                cx={cx}
                cy={cy}
                rx={globeSize / 12}
                ry={globeSize / 2}
                stroke="rgba(197,160,89,0.35)"
                strokeWidth="0.8"
                fill="none"
                className={reducedMotion ? undefined : "ms-meridian"}
              />
              {/* Secondary meridian */}
              <ellipse
                cx={cx}
                cy={cy}
                rx={globeSize / 4}
                ry={globeSize / 2}
                stroke="rgba(197,160,89,0.2)"
                strokeWidth="0.8"
                fill="none"
                className={reducedMotion ? undefined : "ms-meridian"}
              />
            </g>

            {/* Sheen overlay */}
            <circle
              cx={cx}
              cy={cy}
              r={globeSize / 2}
              fill="url(#ms-globe-sheen)"
            />

            {/* Outer ring */}
            <circle
              cx={cx}
              cy={cy}
              r={globeSize / 2 + 4}
              stroke="rgba(197,160,89,0.15)"
              strokeWidth="1"
              fill="none"
            />

            {/* Orbiting document packet */}
            {!reducedMotion && (
              <g className="ms-orbit-packet">
                {/* Document packet icon at orbit position */}
                <rect
                  x={cx - 6}
                  y={cy - 8}
                  width={12}
                  height={14}
                  rx={2}
                  fill="#0A0A0A"
                  stroke="#C5A059"
                  strokeWidth="1.5"
                />
                <line
                  x1={cx - 3}
                  y1={cy - 4}
                  x2={cx + 3}
                  y2={cy - 4}
                  stroke="#C5A059"
                  strokeWidth="1"
                />
                <line
                  x1={cx - 3}
                  y1={cy - 1}
                  x2={cx + 3}
                  y2={cy - 1}
                  stroke="#C5A059"
                  strokeWidth="1"
                />
                <line
                  x1={cx - 3}
                  y1={cy + 2}
                  x2={cx + 1}
                  y2={cy + 2}
                  stroke="rgba(197,160,89,0.6)"
                  strokeWidth="1"
                />
              </g>
            )}
          </svg>
        </div>

        {/* Labels */}
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <p
            style={{
              fontFamily: "serif",
              fontSize: size === "sm" ? 14 : size === "lg" ? 20 : 16,
              color: "#C5A059",
              margin: "0 0 6px",
              letterSpacing: "0.02em",
            }}
          >
            {resolvedLabel}
          </p>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: size === "sm" ? 10 : 11,
              color: "#A3A3A3",
              margin: 0,
              letterSpacing: "0.04em",
              lineHeight: 1.5,
            }}
          >
            {resolvedSublabel}
          </p>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* MilanoLoadingOverlay                                                  */
/* ------------------------------------------------------------------ */

export type MilanoLoadingOverlayProps = {
  open: boolean;
  mode?: MilanoGlobeCourierLoaderProps["mode"];
  label?: string;
  sublabel?: string;
  reducedMotion?: boolean;
};

export function MilanoLoadingOverlay({
  open,
  mode = "route",
  label,
  sublabel,
  reducedMotion = false,
}: MilanoLoadingOverlayProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10,10,10,0.82)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      role="dialog"
      aria-modal="true"
    >
      <MilanoGlobeCourierLoader
        mode={mode}
        label={label}
        sublabel={sublabel}
        size="md"
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
