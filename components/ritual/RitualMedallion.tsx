import React from "react";

interface RitualMedallionProps {
  reduced?: boolean;
}

export function RitualMedallion({ reduced: _reduced }: RitualMedallionProps) {
  const haloDots = Array.from({ length: 56 }, (_, i) => {
    const angle = (i / 56) * 2 * Math.PI;
    return {
      cx: 200 + 166 * Math.cos(angle),
      cy: 220 + 166 * Math.sin(angle),
    };
  });

  const nodes: [number, number][] = [
    [200, 49],
    [112, 85],
    [288, 85],
    [68, 183],
    [332, 183],
    [112, 281],
    [288, 281],
  ];

  return (
    <svg
      viewBox="0 0 400 440"
      style={{
        width: "clamp(360px, 40vw, 520px)",
        height: "calc(clamp(360px, 40vw, 520px) * 1.1)",
        display: "block",
        overflow: "visible",
      }}
      aria-label="The Milano Seal Medallion"
    >
      <defs>
        <linearGradient id="goldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a07830" />
          <stop offset="30%" stopColor="#c6a55a" />
          <stop offset="50%" stopColor="#f4e5b8" />
          <stop offset="70%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#a07830" />
        </linearGradient>

        <linearGradient id="rimGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8c6b1a" />
          <stop offset="35%" stopColor="#d4af37" />
          <stop offset="60%" stopColor="#f4e5b8" />
          <stop offset="100%" stopColor="#c6a55a" />
        </linearGradient>

        <radialGradient id="nodeGlowGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FFF1B8" />
          <stop offset="45%" stopColor="#FFD978" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="discBg" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#1a1408" />
          <stop offset="55%" stopColor="#0a0806" />
          <stop offset="100%" stopColor="#050507" />
        </radialGradient>

        <radialGradient id="miniSealBg" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#1a1408" />
          <stop offset="100%" stopColor="#050507" />
        </radialGradient>

        <filter id="nodeGlowFilter" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="rimGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {haloDots.map((dot, i) => (
        <circle key={i} cx={dot.cx} cy={dot.cy} r="1.1" fill="rgba(212,175,55,0.22)" />
      ))}

      <circle cx="200" cy="220" r="155" fill="none" stroke="rgba(212,175,55,0.28)" strokeWidth="0.8" strokeDasharray="3 8" />
      <ellipse cx="200" cy="220" rx="155" ry="55" fill="none" stroke="rgba(212,175,55,0.18)" strokeWidth="0.7" transform="rotate(-28 200 220)" />
      <ellipse cx="200" cy="220" rx="155" ry="55" fill="none" stroke="rgba(212,175,55,0.14)" strokeWidth="0.7" transform="rotate(28 200 220)" />
      <circle cx="200" cy="220" r="136" fill="none" stroke="rgba(212,175,55,0.32)" strokeWidth="1" />

      <circle cx="200" cy="220" r="104" fill="url(#discBg)" />
      <circle cx="200" cy="220" r="110" fill="none" stroke="url(#rimGold)" strokeWidth="4" filter="url(#rimGlow)" />

      <text x="172" y="270" textAnchor="middle" fontFamily="Georgia, serif" fontSize="136" fontWeight="500" fill="url(#goldFoil)" filter="url(#rimGlow)">M</text>
      <text x="235" y="255" textAnchor="middle" fontFamily="Georgia, serif" fontSize="104" fontWeight="500" fill="url(#goldFoil)" filter="url(#rimGlow)">❧</text>

      {nodes.map(([cx, cy], i) => (
        <g key={i} filter="url(#nodeGlowFilter)">
          <circle cx={cx} cy={cy} r="11" fill="url(#nodeGlowGrad)" />
          <circle cx={cx} cy={cy} r="8.5" fill="none" stroke="rgba(212,175,55,0.55)" strokeWidth="0.8" />
          <circle cx={cx} cy={cy} r="5" fill="#FFF1B8" opacity="0.97" />
        </g>
      ))}

      <ellipse cx="268" cy="138" rx="22" ry="11" fill="white" opacity="0.08" transform="rotate(-30 268 138)" filter="url(#rimGlow)" />

      <g>
        <circle cx="200" cy="334" r="24" fill="url(#miniSealBg)" />
        <circle cx="200" cy="334" r="24" fill="none" stroke="url(#goldFoil)" strokeWidth="1.8" filter="url(#rimGlow)" />
        <circle cx="200" cy="334" r="18" fill="none" stroke="rgba(212,175,55,0.38)" strokeWidth="0.7" strokeDasharray="2 4" />
        <text x="200" y="340" textAnchor="middle" fontFamily="Georgia, serif" fontSize="16" fill="url(#goldFoil)">M</text>
      </g>

      <text x="302" y="310" textAnchor="middle" fontFamily="Georgia, serif" fontSize="84" fill="url(#goldFoil)" opacity="0.78" filter="url(#rimGlow)">❧</text>
    </svg>
  );
}
