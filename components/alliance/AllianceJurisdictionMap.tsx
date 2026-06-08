"use client";

type Props = {
  supportedJurisdictions: string[];
  partnerType?: string;
};

// Hague convention countries with approximate SVG positions (x, y) on a 800x400 viewBox
const HAGUE_COUNTRIES: Array<{ name: string; cx: number; cy: number }> = [
  { name: "Italy", cx: 420, cy: 150 },
  { name: "Spain", cx: 380, cy: 158 },
  { name: "France", cx: 395, cy: 140 },
  { name: "Germany", cx: 415, cy: 130 },
  { name: "Portugal", cx: 368, cy: 158 },
  { name: "Mexico", cx: 165, cy: 195 },
  { name: "Brazil", cx: 255, cy: 265 },
  { name: "Argentina", cx: 235, cy: 310 },
  { name: "Colombia", cx: 215, cy: 232 },
  { name: "Netherlands", cx: 408, cy: 126 },
  { name: "Belgium", cx: 405, cy: 128 },
  { name: "Switzerland", cx: 412, cy: 140 },
  { name: "Australia", cx: 665, cy: 310 },
  { name: "Japan", cx: 708, cy: 158 },
  { name: "South Korea", cx: 695, cy: 160 },
  { name: "China", cx: 668, cy: 168 },
  { name: "India", cx: 590, cy: 195 },
  { name: "UAE", cx: 555, cy: 195 },
  { name: "UK", cx: 388, cy: 122 },
  { name: "Canada", cx: 155, cy: 110 },
];

// Florida origin dot
const FLORIDA = { cx: 197, cy: 178, r: 3.5 };

// Simplified continent shapes as flat rectangles/polygons
const CONTINENTS = [
  // North America
  { d: "M 120 90 L 210 90 L 220 100 L 200 210 L 150 210 L 130 180 L 115 140 Z" },
  // Central America / Caribbean (tiny)
  { d: "M 150 200 L 200 205 L 195 225 L 155 220 Z" },
  // South America
  { d: "M 195 225 L 265 220 L 285 290 L 270 340 L 220 340 L 200 290 Z" },
  // Europe
  { d: "M 360 100 L 450 100 L 455 170 L 435 175 L 360 165 Z" },
  // Africa
  { d: "M 380 175 L 450 175 L 460 295 L 420 310 L 380 280 Z" },
  // Asia
  { d: "M 455 90 L 730 90 L 730 215 L 600 220 L 550 200 L 460 170 Z" },
  // Oceania
  { d: "M 640 285 L 720 280 L 730 335 L 650 340 Z" },
];

export function AllianceJurisdictionMap({ supportedJurisdictions, partnerType }: Props) {
  const supportedSet = new Set(supportedJurisdictions.map((j) => j.trim()));
  const hasJurisdictions = supportedJurisdictions.length > 0;

  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{
        background: "rgba(8,5,1,0.96)",
        border: "1px solid rgba(198,165,90,0.1)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: "rgba(198,165,90,0.08)" }}
      >
        <h3
          className="text-sm font-light"
          style={{
            fontFamily: "var(--font-playfair),Georgia,serif",
            color: "rgba(246,241,230,0.85)",
          }}
        >
          Jurisdiction Coverage
        </h3>
        {partnerType && (
          <p
            className="text-[10px] font-mono uppercase tracking-[0.15em] mt-0.5"
            style={{ color: "rgba(198,165,90,0.45)" }}
          >
            {partnerType} Partner
          </p>
        )}
      </div>

      {/* Map */}
      <div className="relative" style={{ paddingBottom: "50%" }}>
        <svg
          viewBox="0 0 800 400"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full"
          aria-label="Jurisdiction map"
        >
          {/* Ocean background */}
          <rect width="800" height="400" fill="rgba(8,5,1,0)" />

          {/* Continents */}
          {CONTINENTS.map((c, i) => (
            <path
              key={i}
              d={c.d}
              fill="rgba(255,255,255,0.04)"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />
          ))}

          {/* Florida origin — always gold, slightly larger */}
          <circle
            cx={FLORIDA.cx}
            cy={FLORIDA.cy}
            r={FLORIDA.r}
            fill="#C6A55A"
            fillOpacity="0.9"
          />
          <circle
            cx={FLORIDA.cx}
            cy={FLORIDA.cy}
            r={FLORIDA.r + 2}
            fill="none"
            stroke="#C6A55A"
            strokeWidth="0.5"
            strokeOpacity="0.3"
          />

          {/* Hague countries */}
          {HAGUE_COUNTRIES.map((country) => {
            const isSupported = supportedSet.has(country.name);
            return (
              <circle
                key={country.name}
                cx={country.cx}
                cy={country.cy}
                r={isSupported ? 2.5 : 1.8}
                fill={isSupported ? "#C6A55A" : "rgba(168,162,154,0.35)"}
                fillOpacity={isSupported ? 0.85 : 1}
              />
            );
          })}
        </svg>
      </div>

      {/* Legend & empty state */}
      <div
        className="px-5 py-4 border-t"
        style={{ borderColor: "rgba(198,165,90,0.06)" }}
      >
        {!hasJurisdictions ? (
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            No jurisdictions configured yet.
          </p>
        ) : (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: "#C6A55A" }}
              />
              <span className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                Partner Supported
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "rgba(168,162,154,0.35)" }}
              />
              <span className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.25)" }}>
                Hague Convention
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border"
                style={{ background: "#C6A55A", borderColor: "rgba(198,165,90,0.4)" }}
              />
              <span className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.25)" }}>
                Florida Origin
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
