import React from "react";

interface RitualMedallionProps {
  reduced?: boolean;
}

export function RitualMedallion({ reduced: _reduced }: RitualMedallionProps) {
  // 56 dots at r=166 for calibration halo
  const haloDots = Array.from({ length: 56 }, (_, i) => {
    const angle = (i / 56) * 2 * Math.PI;
    return {
      cx: 200 + 166 * Math.cos(angle),
      cy: 220 + 166 * Math.sin(angle),
    };
  });

  // 7 golden sphere node positions
  const nodes: [number, number][] = [
    [200, 49],   // top
    [112, 85],   // upper-left
    [288, 85],   // upper-right
    [68, 183],   // mid-left
    [332, 183],  // mid-right
    [112, 281],  // lower-left
    [288, 281],  // lower-right
  ];

  return (
    <svg
      viewBox="0 0 400 440"
      style={{
        width: "clamp(240px, 72vw, 310px)",
        height: "calc(clamp(240px, 72vw, 310px) * 1.1)",
        display: "block",
        overflow: "visible",
      }}
      aria-label="The Milano Seal Medallion"
    >
      <defs>
        {/* Gold foil linear gradient */}
        <linearGradient id="goldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a07830" />
          <stop offset="30%" stopColor="#c6a55a" />
          <stop offset="50%" stopColor="#f4e5b8" />
          <stop offset="70%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#a07830" />
        </linearGradient>

        {/* Rim gold gradient */}
        <linearGradient id="rimGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8c6b1a" />
          <stop offset="35%" stopColor="#d4af37" />
          <stop offset="60%" stopColor="#f4e5b8" />
          <stop offset="100%" stopColor="#c6a55a" />
        </linearGradient>

        {/* Node glow radial gradient */}
        <radialGradient id="nodeGlowGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FFF1B8" />
          <stop offset="45%" stopColor="#FFD978" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
        </radialGradient>

        {/* Disc background radial gradient */}
        <radialGradient id="discBg" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#1a1408" />
          <stop offset="55%" stopColor="#0a0806" />
          <stop offset="100%" stopColor="#050507" />
        </radialGradient>

        {/* Mini seal background */}
        <radialGradient id="miniSealBg" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#1a1408" />
          <stop offset="100%" stopColor="#050507" />
        </radialGradient>

        {/* Node glow filter */}
        <filter id="nodeGlowFilter" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Rim glow filter */}
        <filter id="rimGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Glint filter */}
        <filter id="glintFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Dotted calibration halo (56 dots at r=166) ── */}
      {haloDots.map((dot, i) => (
        <circle
          key={i}
          cx={dot.cx}
          cy={dot.cy}
          r="1.1"
          fill="rgba(212,175,55,0.22)"
        />
      ))}

      {/* ── Orbit rings ── */}
      {/* Dashed orbit ring r=155 */}
      <circle
        cx="200" cy="220" r="155"
        fill="none"
        stroke="rgba(212,175,55,0.28)"
        strokeWidth="0.8"
        strokeDasharray="3 8"
      />
      {/* Angled ellipse 1 */}
      <ellipse
        cx="200" cy="220" rx="155" ry="55"
        fill="none"
        stroke="rgba(212,175,55,0.18)"
        strokeWidth="0.7"
        transform="rotate(-28 200 220)"
      />
      {/* Angled ellipse 2 */}
      <ellipse
        cx="200" cy="220" rx="155" ry="55"
        fill="none"
        stroke="rgba(212,175,55,0.14)"
        strokeWidth="0.7"
        transform="rotate(28 200 220)"
      />
      {/* Inner node circle r=136 */}
      <circle
        cx="200" cy="220" r="136"
        fill="none"
        stroke="rgba(212,175,55,0.32)"
        strokeWidth="1"
      />

      {/* ── Black obsidian disc ── */}
      <circle cx="200" cy="220" r="104" fill="url(#discBg)" />

      {/* ── Thick gold rim ring with glow ── */}
      <circle
        cx="200" cy="220" r="110"
        fill="none"
        stroke="url(#rimGold)"
        strokeWidth="4"
        filter="url(#rimGlow)"
      />

      {/* ── Brand mark PNG ── */}
      <image
        href="/milano-seal-gold-transparent-512.png"
        x="104" y="129"
        width="192" height="192"
        opacity="0.96"
      />

      {/* ── 7 Golden sphere nodes ── */}
      {nodes.map(([cx, cy], i) => (
        <g key={i} filter="url(#nodeGlowFilter)">
          {/* Outer glow halo */}
          <circle cx={cx} cy={cy} r="11" fill="url(#nodeGlowGrad)" />
          {/* Ring stroke */}
          <circle
            cx={cx} cy={cy} r="8.5"
            fill="none"
            stroke="rgba(212,175,55,0.55)"
            strokeWidth="0.8"
          />
          {/* Bright core */}
          <circle cx={cx} cy={cy} r="5" fill="#FFF1B8" opacity="0.97" />
        </g>
      ))}

      {/* ── Upper-right rim glint ellipse ── */}
      <ellipse
        cx="268" cy="138"
        rx="22" ry="11"
        fill="white"
        opacity="0.06"
        transform="rotate(-30 268 138)"
        filter="url(#glintFilter)"
      />

      {/* ── Mini-seal coin at (200, 334) r=24 ── */}
      <g>
        {/* Dark disc */}
        <circle cx="200" cy="334" r="24" fill="url(#miniSealBg)" />
        {/* Gold rim */}
        <circle
          cx="200" cy="334" r="24"
          fill="none"
          stroke="url(#goldFoil)"
          strokeWidth="1.8"
          filter="url(#rimGlow)"
        />
        {/* Dashed inner ring */}
        <circle
          cx="200" cy="334" r="18"
          fill="none"
          stroke="rgba(212,175,55,0.38)"
          strokeWidth="0.7"
          strokeDasharray="2 4"
        />
        {/* M text */}
        <text
          x="200" y="339"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="14"
          fontWeight="300"
          letterSpacing="0.05em"
          fill="url(#goldFoil)"
        >
          M
        </text>
      </g>

      {/* ── Subtle arcs from lower nodes to mini-seal ── */}
      <path
        d="M 112 281 Q 156 320 200 334"
        fill="none"
        stroke="rgba(212,175,55,0.18)"
        strokeWidth="0.7"
        strokeDasharray="2 5"
      />
      <path
        d="M 288 281 Q 244 320 200 334"
        fill="none"
        stroke="rgba(212,175,55,0.18)"
        strokeWidth="0.7"
        strokeDasharray="2 5"
      />

      {/* ── Lower-right feather flourish ── */}
      {/* Curved stem */}
      <path
        d="M 245 295 C 268 288, 305 265, 342 248"
        fill="none"
        stroke="rgba(212,175,55,0.5)"
        strokeWidth="1.2"
      />
      {/* Upper feather blades */}
      <path d="M 255 290 C 258 280, 265 275, 272 272" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="0.8" />
      <path d="M 265 285 C 270 274, 278 270, 285 267" fill="none" stroke="rgba(212,175,55,0.32)" strokeWidth="0.8" />
      <path d="M 277 279 C 282 268, 292 264, 299 262" fill="none" stroke="rgba(212,175,55,0.28)" strokeWidth="0.8" />
      <path d="M 291 272 C 297 261, 307 258, 315 256" fill="none" stroke="rgba(212,175,55,0.24)" strokeWidth="0.8" />
      <path d="M 306 265 C 312 255, 322 252, 330 251" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="0.8" />
      {/* Lower feather blades */}
      <path d="M 253 298 C 256 307, 262 310, 270 309" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="0.8" />
      <path d="M 263 293 C 267 303, 274 306, 282 304" fill="none" stroke="rgba(212,175,55,0.27)" strokeWidth="0.8" />
      <path d="M 275 287 C 280 297, 289 299, 297 297" fill="none" stroke="rgba(212,175,55,0.23)" strokeWidth="0.8" />
      <path d="M 289 280 C 295 290, 305 291, 313 289" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="0.8" />
      <path d="M 304 272 C 311 282, 321 283, 329 281" fill="none" stroke="rgba(212,175,55,0.17)" strokeWidth="0.8" />
    </svg>
  );
}
