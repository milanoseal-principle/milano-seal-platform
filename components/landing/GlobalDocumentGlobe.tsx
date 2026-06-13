"use client";

import React, { useState, useEffect } from "react";

/* ── Types ──────────────────────────────────────────────────────────────── */
type HagueStatus = "HAGUE" | "NON_HAGUE" | "AUTHORITY_REVIEW" | "CONSULAR_REVIEW";

interface GlobeDestination {
  id: string;
  country: string;
  cityLabel: string;
  routeLabel: string;
  x: number;
  y: number;
  arcHeight: number;
  delay: number;
  hagueStatus: HagueStatus;
  useCases: string[];
  safeSummary: string;
}

/* ── Florida origin (SVG 0–100 coordinate space) ────────────────────────── */
const ORIGIN = { x: 32, y: 48 };

/* ── Destinations ───────────────────────────────────────────────────────── */
const DESTINATIONS: GlobeDestination[] = [
  {
    id: "italy", country: "Italy", cityLabel: "Italy",
    routeLabel: "Hague Apostille Route",
    x: 72, y: 36, arcHeight: 34, delay: 0.1,
    hagueStatus: "HAGUE",
    useCases: ["Citizenship", "POA", "Affidavit", "Civil Records", "Real Estate"],
    safeSummary: "Florida-origin documents routed for Italian receiving-authority review.",
  },
  {
    id: "spain", country: "Spain", cityLabel: "Spain",
    routeLabel: "Hague Apostille Route",
    x: 66, y: 42, arcHeight: 28, delay: 0.2,
    hagueStatus: "HAGUE",
    useCases: ["Real Estate", "Residency", "POA", "Corporate", "Family"],
    safeSummary: "Structured U.S. execution support for Spanish destination use.",
  },
  {
    id: "portugal", country: "Portugal", cityLabel: "Portugal",
    routeLabel: "Hague Apostille Route",
    x: 62, y: 44, arcHeight: 26, delay: 0.3,
    hagueStatus: "HAGUE",
    useCases: ["Residency", "D8", "POA", "Banking", "Private Client"],
    safeSummary: "U.S. document execution support for Portugal residency and private-client matters.",
  },
  {
    id: "greece", country: "Greece", cityLabel: "Greece",
    routeLabel: "Hague Apostille Route",
    x: 78, y: 45, arcHeight: 36, delay: 0.4,
    hagueStatus: "HAGUE",
    useCases: ["Citizenship", "Property", "Inheritance", "Maritime", "Family Office"],
    safeSummary: "Boutique U.S. execution coordination for Greek international matters.",
  },
  {
    id: "brazil", country: "Brazil", cityLabel: "Brazil",
    routeLabel: "Hague Apostille Route",
    x: 58, y: 72, arcHeight: 32, delay: 0.5,
    hagueStatus: "HAGUE",
    useCases: ["Corporate", "Medical", "POA", "Academic", "Family"],
    safeSummary: "Florida-origin documents routed for Brazilian receiving-authority review.",
  },
  {
    id: "mexico", country: "Mexico", cityLabel: "Mexico",
    routeLabel: "Authority Review Required",
    x: 36, y: 55, arcHeight: 18, delay: 0.6,
    hagueStatus: "AUTHORITY_REVIEW",
    useCases: ["Real Estate", "Family", "Corporate", "Consular Review", "Translation"],
    safeSummary: "Cross-border U.S. execution coordination requiring destination-specific review.",
  },
  {
    id: "uae", country: "United Arab Emirates", cityLabel: "UAE",
    routeLabel: "Consular Legalization Review",
    x: 84, y: 50, arcHeight: 42, delay: 0.7,
    hagueStatus: "CONSULAR_REVIEW",
    useCases: ["Corporate", "Private Wealth", "Commercial", "Authentication", "Embassy Review"],
    safeSummary: "Non-standard authentication and consular review may apply.",
  },
  {
    id: "united-kingdom", country: "United Kingdom", cityLabel: "UK",
    routeLabel: "Hague Apostille Route",
    x: 65, y: 30, arcHeight: 30, delay: 0.8,
    hagueStatus: "HAGUE",
    useCases: ["Corporate", "Estate", "Academic", "POA", "Identity"],
    safeSummary: "U.S. document execution support for United Kingdom destination use.",
  },
  {
    id: "canada", country: "Canada", cityLabel: "Canada",
    routeLabel: "Apostille / Authentication Review",
    x: 38, y: 25, arcHeight: 20, delay: 0.9,
    hagueStatus: "AUTHORITY_REVIEW",
    useCases: ["Corporate", "Academic", "Immigration", "Identity", "Private Client"],
    safeSummary: "Destination-specific review required based on document and receiving authority.",
  },
  {
    id: "colombia", country: "Colombia", cityLabel: "Colombia",
    routeLabel: "Hague Apostille Route",
    x: 45, y: 67, arcHeight: 24, delay: 1.0,
    hagueStatus: "HAGUE",
    useCases: ["Family", "Real Estate", "Corporate", "Academic", "POA"],
    safeSummary: "U.S. execution coordination for Colombian destination matters.",
  },
];

const MOBILE_IDS = new Set(["italy", "portugal", "spain", "mexico", "uae"]);

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function arcPath(dest: GlobeDestination): string {
  const cx = (ORIGIN.x + dest.x) / 2;
  const cy = Math.min(ORIGIN.y, dest.y) - dest.arcHeight;
  return `M ${ORIGIN.x} ${ORIGIN.y} Q ${cx} ${cy} ${dest.x} ${dest.y}`;
}

function hagueStyle(status: HagueStatus) {
  switch (status) {
    case "HAGUE":
      return { dot: "#D4AF37", arc: "rgba(212,175,55,0.55)", badge: "#D4AF37", dashed: false };
    case "AUTHORITY_REVIEW":
      return { dot: "#C8A03E", arc: "rgba(200,160,62,0.45)", badge: "#C8A03E", dashed: true };
    case "CONSULAR_REVIEW":
      return { dot: "#B8842A", arc: "rgba(184,132,42,0.40)", badge: "#B8842A", dashed: true };
    case "NON_HAGUE":
      return { dot: "#A07428", arc: "rgba(160,116,40,0.35)", badge: "#A07428", dashed: true };
  }
}

/* ── Latitude grid ellipses ──────────────────────────────────────────────── */
const LAT_LINES = [20, 30, 40, 50, 60, 70, 80];

function latParams(y: number) {
  const ratio = Math.sqrt(Math.max(0, 1 - Math.pow((y - 50) / 46, 2)));
  return { rx: 46 * ratio, ry: Math.max(1.5, 5.5 * ratio) };
}

/* ── Component ───────────────────────────────────────────────────────────── */
export function GlobalDocumentGlobe() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mounted,   setMounted]   = useState(false);
  const [reduced,   setReduced]   = useState(false);
  const [isMobile,  setIsMobile]  = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq  = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mob = window.matchMedia("(max-width: 639px)");
    setReduced(mq.matches);
    setIsMobile(mob.matches);
    const onRM  = (e: MediaQueryListEvent) => setReduced(e.matches);
    const onMob = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onRM);
    mob.addEventListener("change", onMob);
    return () => { mq.removeEventListener("change", onRM); mob.removeEventListener("change", onMob); };
  }, []);

  // Route only activates on hover — no auto-cycle
  const activeId = hoveredId;

  const visibleDests = isMobile
    ? DESTINATIONS.filter(d => MOBILE_IDS.has(d.id))
    : DESTINATIONS;

  const hovered = DESTINATIONS.find(d => d.id === hoveredId) ?? null;

  return (
    <div
      className="relative w-full select-none"
      style={{ maxWidth: 520, margin: "0 auto" }}
      role="region"
      aria-label="Global Document Intelligence Globe"
    >
      {/* Outer seal halo */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: "-10%",
          background: "radial-gradient(circle, rgba(212,175,55,0.07) 0%, rgba(212,175,55,0.02) 50%, transparent 68%)",
          animation: reduced ? "none" : "msGlobeHalo 8s ease-in-out infinite",
        }}
      />

      {/* Globe shell */}
      <div
        className="relative w-full rounded-full"
        style={{
          aspectRatio: "1 / 1",
          background: "radial-gradient(circle at 38% 36%, #1C1C24 0%, #111218 40%, #0C0C12 72%, #06060A 100%)",
          boxShadow:
            "0 0 0 1px rgba(212,175,55,0.13), 0 0 80px rgba(0,0,0,0.85), inset 0 0 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* ── SVG: grid + arcs + nodes ─────────────────────────────── */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
          style={{ overflow: "visible" }}
          aria-hidden="true"
        >
          <defs>
            <clipPath id="gdg-clip"><circle cx="50" cy="50" r="46" /></clipPath>
            <radialGradient id="gdg-bg" cx="38%" cy="36%" r="60%">
              <stop offset="0%"   stopColor="#1C1C24" />
              <stop offset="60%"  stopColor="#111218" />
              <stop offset="100%" stopColor="#06060A" />
            </radialGradient>
          </defs>

          {/* Sphere fill */}
          <circle cx="50" cy="50" r="46" fill="url(#gdg-bg)" />

          {/* Grid — clipped */}
          <g clipPath="url(#gdg-clip)" opacity="0.16">
            {LAT_LINES.map(y => {
              const { rx, ry } = latParams(y);
              return rx > 2 ? (
                <ellipse key={y} cx="50" cy={y} rx={rx} ry={ry}
                  fill="none" stroke="#D4AF37" strokeWidth="0.28" />
              ) : null;
            })}
            {[0, 30, 60, 90, 120, 150].map(a => (
              <ellipse key={a} cx="50" cy="50" rx="1.8" ry="46"
                fill="none" stroke="#D4AF37" strokeWidth="0.28"
                transform={`rotate(${a}, 50, 50)`} />
            ))}
          </g>

          {/* Atmosphere rings */}
          <circle cx="50" cy="50" r="46"   fill="none" stroke="rgba(212,175,55,0.18)" strokeWidth="0.45" />
          <circle cx="50" cy="50" r="47.8" fill="none" stroke="rgba(212,175,55,0.05)" strokeWidth="1.8" />

          {/* Specular highlight */}
          <ellipse cx="41" cy="31" rx="9" ry="5.5" fill="rgba(255,255,255,0.025)" />

          {/* ── Route arcs — one primary active at a time ───────── */}
          {visibleDests.map(dest => {
            const { arc, dashed } = hagueStyle(dest.hagueStatus);
            const isActive = activeId === dest.id;

            return (
              <g key={dest.id} style={{ pointerEvents: "none" }}>
                {/* Always-visible idle arc — very faint */}
                <path
                  d={arcPath(dest)}
                  fill="none"
                  stroke={arc}
                  strokeWidth="0.35"
                  strokeDasharray={dashed ? "1.4 1.4" : undefined}
                  opacity={isActive ? 0 : 0.06}
                  style={{ transition: "opacity 0.8s ease" }}
                />
                {/* Active arc — draws on activation */}
                {mounted && !reduced && (
                  <path
                    key={`${dest.id}-active`}
                    d={arcPath(dest)}
                    fill="none"
                    stroke={arc}
                    strokeWidth="0.72"
                    strokeDasharray={dashed ? "1.4 1.4" : undefined}
                    pathLength="1"
                    style={{
                      opacity: isActive ? 0.82 : 0,
                      strokeDashoffset: isActive ? undefined : "1",
                      animation: isActive ? "msRouteDraw 4.5s cubic-bezier(0.16,1,0.3,1) 0.4s both" : "none",
                      transition: "opacity 0.8s ease",
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* ── Destination nodes ───────────────────────────────────── */}
          {visibleDests.map(dest => {
            const { dot } = hagueStyle(dest.hagueStatus);
            const isActive = hoveredId === dest.id;

            return (
              <g
                key={dest.id}
                role="button"
                tabIndex={0}
                aria-label={`Florida to ${dest.country} — ${dest.routeLabel}`}
                style={{ cursor: "pointer", outline: "none" }}
                onMouseEnter={() => setHoveredId(dest.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(dest.id)}
                onBlur={() => setHoveredId(null)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setHoveredId(dest.id); }}
              >
                {/* Outer glow */}
                <circle cx={dest.x} cy={dest.y} r={isActive ? 4 : 2.8}
                  fill={dot} opacity={isActive ? 0.22 : 0.10}
                  style={{ transition: "r 0.2s ease, opacity 0.2s ease" }}
                />
                {/* Core dot */}
                <circle cx={dest.x} cy={dest.y} r={isActive ? 2 : 1.5}
                  fill={dot}
                  style={{
                    filter: `drop-shadow(0 0 2.5px ${dot})`,
                    transition: "r 0.2s ease",
                  }}
                />
                {/* Label */}
                <text
                  x={dest.x + (dest.x > 55 ? 3 : -3)}
                  y={dest.y - 2}
                  fontSize="3"
                  fill="#F5F1E8"
                  opacity={isActive ? 1 : 0.65}
                  textAnchor={dest.x > 55 ? "start" : "end"}
                  style={{
                    fontFamily: "var(--font-geist, var(--font-inter, sans-serif))",
                    letterSpacing: "0.025em",
                    pointerEvents: "none",
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {dest.cityLabel}
                </text>
              </g>
            );
          })}

          {/* ── Seal Core — routing intelligence brain ─────────────── */}
          <g aria-hidden="true" style={{ pointerEvents: "none" }}>
            {/* Radial glow behind mark */}
            <circle
              cx="50" cy="50" r="7"
              fill="rgba(214,170,69,0.07)"
              style={{
                animation: reduced ? "none" : (activeId ? "msCoreWake 1.4s ease-out both" : "msCoreIdle 10s ease-in-out infinite"),
              }}
            />
            {/* Inner orbit ring — draws on activate */}
            <circle
              cx="50" cy="50" r="5.5"
              fill="none"
              stroke="rgba(214,170,69,0.35)"
              strokeWidth="0.3"
              strokeDasharray="1 0.6"
              style={{
                opacity: activeId ? 0.7 : 0.15,
                transition: "opacity 0.7s ease",
                transformOrigin: "50px 50px",
                animation: reduced ? "none" : (activeId ? "msCoreRingDraw 2.2s ease-out both" : "none"),
              }}
            />
            {/* Outward pulse on activate */}
            {activeId && !reduced && (
              <circle
                cx="50" cy="50" r="6"
                fill="none"
                stroke="rgba(214,170,69,0.45)"
                strokeWidth="0.4"
                style={{ animation: "msCoreOutPulse 0.9s ease-out both" }}
              />
            )}
            {/* Minimal M mark — readable at globe center scale */}
            <text
              x="50" y="52.5"
              textAnchor="middle"
              fontSize="5"
              fontFamily="Georgia,'Times New Roman',serif"
              fontWeight="600"
              fill="rgba(212,175,55,0.9)"
              style={{
                opacity: activeId ? 0.85 : 0.2,
                transition: "opacity 0.7s ease",
                filter: activeId ? "drop-shadow(0 0 1px rgba(212,175,55,0.8))" : "none",
                pointerEvents: "none",
              }}
            >M</text>
          </g>

          {/* ── Florida origin node ─────────────────────────────────── */}
          <g aria-label="Florida Execution Hub — U.S. notarization and apostille coordination">
            {/* Pulse ring */}
            <circle cx={ORIGIN.x} cy={ORIGIN.y} r="6"
              fill="none" stroke="rgba(212,175,55,0.22)" strokeWidth="0.35"
              style={{ animation: reduced ? "none" : "msOriginPulse 10s ease-in-out infinite" }}
            />
            {/* Mid glow */}
            <circle cx={ORIGIN.x} cy={ORIGIN.y} r="3.8" fill="rgba(212,175,55,0.14)" />
            {/* Core */}
            <circle cx={ORIGIN.x} cy={ORIGIN.y} r="2.4" fill="#D4AF37"
              style={{ filter: "drop-shadow(0 0 4px rgba(212,175,55,0.9))" }}
            />
            {/* Inner bright */}
            <circle cx={ORIGIN.x} cy={ORIGIN.y} r="0.9" fill="#F5F1E8" />
            {/* Label */}
            <text
              x={ORIGIN.x}
              y={ORIGIN.y + 5.5}
              fontSize="2.6"
              fill="#D4AF37"
              opacity="0.9"
              textAnchor="middle"
              style={{
                fontFamily: "var(--font-geist, var(--font-inter, sans-serif))",
                letterSpacing: "0.06em",
                pointerEvents: "none",
              }}
            >
              FLORIDA
            </text>
          </g>
        </svg>

        {/* ── Tooltips ───────────────────────────────────────────────── */}
        {hovered && (() => {
          const { badge, dashed } = hagueStyle(hovered.hagueStatus);
          const left  = hovered.x > 62 ? "auto" : `${hovered.x + 2}%`;
          const right = hovered.x > 62 ? `${103 - hovered.x}%` : "auto";
          const top   = hovered.y < 55 ? `${hovered.y + 6}%` : "auto";
          const bottom = hovered.y >= 55 ? `${102 - hovered.y}%` : "auto";

          return (
            <div
              className="absolute z-30"
              style={{
                left, right, top, bottom,
                width: "min(200px, 45vw)",
                pointerEvents: "none",
              }}
              role="tooltip"
              id={`gdg-tip-${hovered.id}`}
            >
              <div
                style={{
                  background: "rgba(8,8,11,0.97)",
                  border: `1px solid ${badge}35`,
                  borderRadius: 2,
                  padding: "10px 12px",
                  backdropFilter: "blur(24px)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.85), 0 0 0 1px rgba(212,175,55,0.05)",
                }}
              >
                <p style={{ color: "#F5F1E8", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>
                  Florida → {hovered.country}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                    background: dashed ? "transparent" : badge,
                    border: dashed ? `1px solid ${badge}` : "none",
                  }} />
                  <p style={{ color: badge, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {hovered.routeLabel}
                  </p>
                </div>
                <p style={{ color: "#8A8480", fontSize: 9, marginBottom: 5 }}>
                  {hovered.useCases.slice(0, 3).join(" · ")}
                </p>
                <p style={{ color: "#5A5450", fontSize: 8, lineHeight: 1.55, marginBottom: 8 }}>
                  {hovered.safeSummary}
                </p>
                <a
                  href="/intake"
                  style={{
                    display: "block",
                    background: "rgba(212,175,55,0.10)",
                    border: "1px solid rgba(212,175,55,0.28)",
                    color: "#D4AF37",
                    fontSize: 8,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    padding: "5px 8px",
                    textAlign: "center",
                    textDecoration: "none",
                    borderRadius: 1,
                    pointerEvents: "auto",
                  }}
                >
                  Begin Secure Intake →
                </a>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Caption */}
      <p
        className="text-center mt-3 px-4"
        style={{
          color: "rgba(212,175,55,0.32)",
          fontSize: 8,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontFamily: "var(--font-geist, monospace)",
          lineHeight: 1.6,
        }}
      >
        Example jurisdiction pathways shown · Final routing depends on document type,
        signer location, destination country, and receiving authority
      </p>
    </div>
  );
}
