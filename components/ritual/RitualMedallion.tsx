import Image from "next/image";

interface RitualMedallionProps {
  reduced?: boolean;
}

const NODES: { angle: number; ring: number; size: number }[] = [
  { angle: 90,  ring: 1, size: 9 },
  { angle: 210, ring: 1, size: 9 },
  { angle: 330, ring: 1, size: 9 },
  { angle: 30,  ring: 2, size: 7 },
  { angle: 150, ring: 2, size: 7 },
  { angle: 270, ring: 2, size: 7 },
  { angle: 0,   ring: 3, size: 5.5 },
  { angle: 120, ring: 3, size: 5.5 },
  { angle: 240, ring: 3, size: 5.5 },
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
      {/* SVG orbital rings + nodes */}
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
          <radialGradient id="nodeCore" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FFF8DC" />
            <stop offset="40%" stopColor="#FFD966" />
            <stop offset="100%" stopColor="#C6A55A" stopOpacity="0" />
          </radialGradient>
          <filter id="nodeGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="outerGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer halo dots ring */}
        {Array.from({ length: 52 }, (_, i) => {
          const { x, y } = polarToXY(cx, cy, 158, (i / 52) * 360);
          return (
            <circle
              key={`halo-${i}`}
              cx={x}
              cy={y}
              r="1.2"
              fill={`rgba(212,175,55,${i % 4 === 0 ? 0.35 : 0.14})`}
            />
          );
        })}

        {/* 3 orbital rings */}
        {radii.map((r, i) => (
          <circle
            key={`ring-${i}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`rgba(212,175,55,${0.38 - i * 0.07})`}
            strokeWidth={i === 0 ? 1.4 : 0.9}
            strokeDasharray={i === 2 ? "3 7" : "none"}
            filter={i === 0 ? "url(#outerGlow)" : undefined}
          />
        ))}

        {/* Tilted ellipse rails */}
        <ellipse cx={cx} cy={cy} rx={102} ry={36} fill="none"
          stroke="rgba(212,175,55,0.15)" strokeWidth="0.8"
          transform={`rotate(-32 ${cx} ${cy})`} />
        <ellipse cx={cx} cy={cy} rx={102} ry={36} fill="none"
          stroke="rgba(212,175,55,0.11)" strokeWidth="0.8"
          transform={`rotate(32 ${cx} ${cy})`} />

        {/* Glowing nodes */}
        {NODES.map((n, i) => {
          const { x, y } = polarToXY(cx, cy, radii[n.ring - 1], n.angle);
          return (
            <g key={`node-${i}`} filter="url(#nodeGlow)">
              <circle cx={x} cy={y} r={n.size + 4} fill="url(#nodeCore)" opacity="0.5" />
              <circle cx={x} cy={y} r={n.size} fill="none"
                stroke="rgba(212,175,55,0.5)" strokeWidth="0.9" />
              <circle cx={x} cy={y} r={n.size * 0.52} fill="#FFF8DC" opacity="0.95" />
            </g>
          );
        })}
      </svg>

      {/* Central orb logo */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "clamp(140px, 19vw, 218px)",
          height: "clamp(140px, 19vw, 218px)",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at 40% 35%, #1a1208 0%, #050507 70%)",
          boxShadow: "0 0 40px rgba(212,175,55,0.18), inset 0 0 24px rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          src="/milano-seal-orb-v2.png"
          alt="The Milano Seal"
          width={320}
          height={320}
          priority
          style={{
            width: "90%",
            height: "90%",
            objectFit: "contain",
            filter: "drop-shadow(0 0 22px rgba(212,175,55,0.5))",
          }}
        />
      </div>

      {/* Mini M badge */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "#050507",
          border: "1.5px solid rgba(212,175,55,0.65)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3,
          boxShadow: "0 0 12px rgba(212,175,55,0.25)",
        }}
      >
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#C6A55A", lineHeight: 1 }}>
          M
        </span>
      </div>

      {/* CSS animation for node pulse — injected once */}
      {!reduced && (
        <style>{`
          @keyframes nodePulse {
            0%, 100% { opacity: 0.85; }
            50% { opacity: 1; }
          }
          @keyframes ringRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      )}
    </div>
  );
}
