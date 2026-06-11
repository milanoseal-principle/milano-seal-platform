"use client";

interface RitualMedallionProps {
  reduced?: boolean;
}

const NODES: { angle: number; ring: number; size: number; delay: number }[] = [
  { angle: 90,  ring: 1, size: 9,   delay: 0    },
  { angle: 210, ring: 1, size: 9,   delay: 0.55 },
  { angle: 330, ring: 1, size: 9,   delay: 1.1  },
  { angle: 30,  ring: 2, size: 7,   delay: 0.28 },
  { angle: 150, ring: 2, size: 7,   delay: 0.83 },
  { angle: 270, ring: 2, size: 7,   delay: 1.38 },
  { angle: 0,   ring: 3, size: 5.5, delay: 0.14 },
  { angle: 120, ring: 3, size: 5.5, delay: 0.69 },
  { angle: 240, ring: 3, size: 5.5, delay: 1.24 },
];

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function RitualMedallion({ reduced }: RitualMedallionProps) {
  const cx = 200;
  const cy = 200;
  const radii = [72, 102, 132];

  return (
    <div
      style={{
        position: "relative",
        width: "clamp(260px, 36vw, 400px)",
        height: "clamp(260px, 36vw, 400px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox="0 0 400 400"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
        aria-hidden="true"
      >
        <defs>
          {/* Node glow */}
          <filter id="nodeGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Outer ring glow */}
          <filter id="outerGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Central orb glow */}
          <filter id="orbGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* M text glow */}
          <filter id="mGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gold gradients */}
          <radialGradient id="nodeCore" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FFF8DC" />
            <stop offset="40%" stopColor="#FFD966" />
            <stop offset="100%" stopColor="#C6A55A" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="orbBg" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#1a1208" />
            <stop offset="50%" stopColor="#0d0d0f" />
            <stop offset="100%" stopColor="#050507" />
          </radialGradient>

          <radialGradient id="orbSheen" cx="35%" cy="25%" r="70%">
            <stop offset="0%" stopColor="rgba(212,175,55,0.12)" />
            <stop offset="60%" stopColor="rgba(212,175,55,0.03)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0)" />
          </radialGradient>

          <linearGradient id="goldM" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF0A0" />
            <stop offset="30%" stopColor="#E4C879" />
            <stop offset="65%" stopColor="#C6A55A" />
            <stop offset="100%" stopColor="#A0813A" />
          </linearGradient>

          <linearGradient id="quillGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E4C879" />
            <stop offset="100%" stopColor="#8B6914" />
          </linearGradient>

          {/* Clipping for orb */}
          <clipPath id="orbClip">
            <circle cx={cx} cy={cy} r="58" />
          </clipPath>
        </defs>

        {/* ── World-dot background halo ── */}
        {Array.from({ length: 64 }, (_, i) => {
          const { x, y } = polarToXY(cx, cy, 158, (i / 64) * 360);
          return (
            <circle
              key={`halo-${i}`}
              cx={x}
              cy={y}
              r="1.1"
              fill={`rgba(212,175,55,${i % 4 === 0 ? 0.38 : i % 2 === 0 ? 0.18 : 0.08})`}
            />
          );
        })}

        {/* ── Faint world-map latitude dots ── */}
        {Array.from({ length: 30 }, (_, i) => {
          const { x, y } = polarToXY(cx, cy, 148, (i / 30) * 360);
          return (
            <circle key={`lat-${i}`} cx={x} cy={y} r="0.7" fill="rgba(212,175,55,0.08)" />
          );
        })}

        {/* ── 3 orbital rings (ring[2] rotates slowly) ── */}
        {/* Outer static ring with glow */}
        <circle
          cx={cx} cy={cy} r={radii[0]}
          fill="none"
          stroke="rgba(212,175,55,0.42)"
          strokeWidth="1.4"
          filter="url(#outerGlow)"
        />
        {/* Middle ring */}
        <circle
          cx={cx} cy={cy} r={radii[1]}
          fill="none"
          stroke="rgba(212,175,55,0.28)"
          strokeWidth="0.9"
        />
        {/* Inner dashed ring — rotates */}
        <circle
          cx={cx} cy={cy} r={radii[2]}
          fill="none"
          stroke="rgba(212,175,55,0.20)"
          strokeWidth="0.9"
          strokeDasharray="4 8"
          style={reduced ? undefined : {
            transformOrigin: `${cx}px ${cy}px`,
            animation: "ringSpinSlow 28s linear infinite",
          }}
        />

        {/* ── Tilted ellipse rails ── */}
        <ellipse cx={cx} cy={cy} rx={102} ry={34} fill="none"
          stroke="rgba(212,175,55,0.13)" strokeWidth="0.7"
          transform={`rotate(-32 ${cx} ${cy})`}
          style={reduced ? undefined : {
            transformOrigin: `${cx}px ${cy}px`,
            animation: "ringSpinMed 42s linear infinite",
          }}
        />
        <ellipse cx={cx} cy={cy} rx={102} ry={34} fill="none"
          stroke="rgba(212,175,55,0.09)" strokeWidth="0.7"
          transform={`rotate(32 ${cx} ${cy})`}
          style={reduced ? undefined : {
            transformOrigin: `${cx}px ${cy}px`,
            animation: "ringSpinMedRev 38s linear infinite reverse",
          }}
        />

        {/* ── Glowing orbital nodes ── */}
        {NODES.map((n, i) => {
          const { x, y } = polarToXY(cx, cy, radii[n.ring - 1], n.angle);
          return (
            <g
              key={`node-${i}`}
              filter="url(#nodeGlow)"
              style={reduced ? undefined : {
                animation: `nodePulse 3.2s ease-in-out ${n.delay}s infinite`,
              }}
            >
              <circle cx={x} cy={y} r={n.size + 5} fill="url(#nodeCore)" opacity="0.4" />
              <circle cx={x} cy={y} r={n.size} fill="none"
                stroke="rgba(212,175,55,0.55)" strokeWidth="0.9" />
              <circle cx={x} cy={y} r={n.size * 0.48} fill="#FFF8DC" opacity="0.92" />
            </g>
          );
        })}

        {/* ── Central orb disc ── */}
        {/* Outer ambient glow ring */}
        <circle cx={cx} cy={cy} r={68}
          fill="none"
          stroke="rgba(212,175,55,0.22)"
          strokeWidth="1"
          filter="url(#orbGlow)"
        />

        {/* Dark orb body */}
        <circle cx={cx} cy={cy} r="60"
          fill="url(#orbBg)"
        />

        {/* Orb inner sheen */}
        <circle cx={cx} cy={cy} r="60"
          fill="url(#orbSheen)"
        />

        {/* Orb border ring */}
        <circle cx={cx} cy={cy} r="60"
          fill="none"
          stroke="rgba(212,175,55,0.45)"
          strokeWidth="1.2"
        />

        {/* ── Milano "M" mark — full SVG path, no font dependency ── */}
        {/* M constructed as 5 vertical strokes + diagonals */}
        <g filter="url(#mGlow)"
          style={reduced ? undefined : {
            animation: "mBreath 4s ease-in-out infinite",
          }}
        >
          {/* Left vertical stroke */}
          <rect x="164" y="175" width="7" height="46" rx="2" fill="url(#goldM)" />
          {/* Right vertical stroke */}
          <rect x="229" y="175" width="7" height="46" rx="2" fill="url(#goldM)" />
          {/* Left diagonal (down-right) */}
          <polygon
            points="164,175 171,175 200,207 200,215"
            fill="url(#goldM)"
            opacity="0.95"
          />
          {/* Right diagonal (down-left) */}
          <polygon
            points="236,175 229,175 200,207 200,215"
            fill="url(#goldM)"
            opacity="0.95"
          />
          {/* Center peak diamond */}
          <polygon
            points="200,207 195,215 200,220 205,215"
            fill="#FFD966"
            opacity="0.9"
          />

          {/* Quill feather — diagonal below M, right side */}
          <g opacity="0.72" transform={`translate(${cx}, ${cy})`}>
            {/* Quill shaft */}
            <line x1="14" y1="22" x2="28" y2="38"
              stroke="url(#quillGold)" strokeWidth="1.5" strokeLinecap="round" />
            {/* Quill barbs */}
            {[0, 1, 2, 3].map((b) => (
              <line key={b}
                x1={16 + b * 3.5} y1={24 + b * 4}
                x2={22 + b * 2.5} y2={20 + b * 4}
                stroke="#C6A55A" strokeWidth="0.8" strokeLinecap="round" opacity="0.7"
              />
            ))}
            {[0, 1, 2, 3].map((b) => (
              <line key={`r${b}`}
                x1={16 + b * 3.5} y1={24 + b * 4}
                x2={12 + b * 2} y2={20 + b * 4.5}
                stroke="#C6A55A" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"
              />
            ))}
          </g>
        </g>

        {/* Seal of Authenticity text arc — inner ring */}
        <defs>
          <path id="textArcTop"
            d={`M ${cx - 50},${cy} A 50,50 0 0,1 ${cx + 50},${cy}`}
          />
          <path id="textArcBot"
            d={`M ${cx - 44},${cy + 8} A 44,44 0 0,0 ${cx + 44},${cy + 8}`}
          />
        </defs>
        <text fontSize="6.5" fill="rgba(198,165,90,0.55)" letterSpacing="0.22em" fontFamily="Georgia, serif">
          <textPath href="#textArcTop" startOffset="8%">THE MILANO SEAL™</textPath>
        </text>
        <text fontSize="5.5" fill="rgba(198,165,90,0.38)" letterSpacing="0.18em" fontFamily="Georgia, serif">
          <textPath href="#textArcBot" startOffset="12%">SEALING TRUST IN EVERY SIGNATURE</textPath>
        </text>

        {/* ── Mini M badge at bottom ── */}
        <circle cx={cx} cy={cy + 82} r="16"
          fill="#050507"
          stroke="rgba(212,175,55,0.6)"
          strokeWidth="1.4"
        />
        <circle cx={cx} cy={cy + 82} r="16"
          fill="none"
          stroke="rgba(212,175,55,0.15)"
          strokeWidth="4"
          filter="url(#outerGlow)"
        />
        <text
          x={cx} y={cy + 87}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="13"
          fontWeight="600"
          fill="#C6A55A"
        >
          M
        </text>
      </svg>

      {/* CSS keyframes */}
      {!reduced && (
        <style>{`
          @keyframes nodePulse {
            0%, 100% { opacity: 0.78; transform: scale(1); }
            50%       { opacity: 1;    transform: scale(1.12); }
          }
          @keyframes ringSpinSlow {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes ringSpinMed {
            from { transform: rotate(-32deg); }
            to   { transform: rotate(328deg); }
          }
          @keyframes ringSpinMedRev {
            from { transform: rotate(32deg); }
            to   { transform: rotate(392deg); }
          }
          @keyframes mBreath {
            0%, 100% { opacity: 0.88; filter: url(#mGlow); }
            50%       { opacity: 1;    filter: url(#mGlow) brightness(1.15); }
          }
        `}</style>
      )}
    </div>
  );
}
