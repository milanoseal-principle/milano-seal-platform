"use client";

interface RitualMedallionProps {
  reduced?: boolean;
}

const CX = 200;
const CY = 200;

const RING_RADII = [68, 96, 124];

const ARCS: { sa: number; sw: number; r: number; op: number; delay: number }[] = [
  { sa: -20,  sw: 110, r: 114, op: 0.55, delay: 0    },
  { sa: 140,  sw: 95,  r: 114, op: 0.40, delay: 0.18 },
  { sa: 280,  sw: 70,  r: 114, op: 0.30, delay: 0.32 },
  { sa: 55,   sw: 130, r: 138, op: 0.35, delay: 0.08 },
  { sa: 220,  sw: 100, r: 138, op: 0.28, delay: 0.24 },
  { sa: -40,  sw: 80,  r: 152, op: 0.22, delay: 0.40 },
  { sa: 160,  sw: 90,  r: 152, op: 0.18, delay: 0.50 },
];

const NODES: { a: number; ri: number; s: number; d: number }[] = [
  { a: 85,  ri: 0, s: 5.5, d: 0.00 },
  { a: 200, ri: 0, s: 5.5, d: 0.12 },
  { a: 320, ri: 0, s: 5.5, d: 0.24 },
  { a: 30,  ri: 1, s: 4.5, d: 0.36 },
  { a: 145, ri: 1, s: 4.5, d: 0.48 },
  { a: 265, ri: 1, s: 4.5, d: 0.60 },
  { a: 10,  ri: 2, s: 3.5, d: 0.72 },
  { a: 130, ri: 2, s: 3.5, d: 0.84 },
  { a: 250, ri: 2, s: 3.5, d: 0.96 },
];

const DUST: { x: number; y: number; r: number; op: number; d: number }[] = Array.from(
  { length: 24 },
  (_, i) => {
    const ang = (i / 24) * Math.PI * 2;
    const dist = 74 + (i % 3) * 14;
    return {
      x: Math.round(CX + dist * Math.cos(ang)),
      y: Math.round(CY + dist * Math.sin(ang)),
      r: i % 5 === 0 ? 2.2 : i % 3 === 0 ? 1.6 : 1.0,
      op: i % 5 === 0 ? 0.5 : i % 3 === 0 ? 0.3 : 0.18,
      d: (i * 0.08) % 1.8,
    };
  },
);

function arcPath(
  cx: number, cy: number, r: number, startDeg: number, sweepDeg: number,
): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const sx = cx + r * Math.cos(toRad(startDeg));
  const sy = cy + r * Math.sin(toRad(startDeg));
  const ex = cx + r * Math.cos(toRad(startDeg + sweepDeg));
  const ey = cy + r * Math.sin(toRad(startDeg + sweepDeg));
  const large = sweepDeg > 180 ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
}

function nodePos(ri: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const r = RING_RADII[ri];
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

export function RitualMedallion({ reduced }: RitualMedallionProps) {
  const size = "clamp(260px, 38vw, 420px)";

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!reduced && (
        <style>{`
          @keyframes msAssembleDisc {
            0%   { opacity: 0; transform: scale(0.7); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes msTraceRing {
            0%   { stroke-dashoffset: 440; opacity: 0; }
            30%  { opacity: 0.9; }
            100% { stroke-dashoffset: 0; opacity: 0.7; }
          }
          @keyframes msDrawArc {
            0%   { stroke-dashoffset: 600; opacity: 0; }
            20%  { opacity: 1; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes msIgniteNode {
            0%   { opacity: 0; transform: scale(0.3); }
            60%  { opacity: 1; transform: scale(1.25); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes msUnlockPulse {
            0%   { opacity: 0; transform: scale(0.9); }
            40%  { opacity: 0.6; transform: scale(1.12); }
            100% { opacity: 0; transform: scale(1.35); }
          }
          @keyframes msNodePulse {
            0%, 100% { opacity: 0.75; }
            50%      { opacity: 1; }
          }
          @keyframes msRingOrbit {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes msDustDrift {
            0%, 100% { opacity: var(--d-op); transform: translate(0,0) scale(1); }
            50%      { opacity: calc(var(--d-op) * 1.8); transform: translate(0,-2px) scale(1.3); }
          }
          @keyframes msArcPulse {
            0%, 100% { opacity: var(--a-op); }
            50%      { opacity: calc(var(--a-op) * 1.5); }
          }
        `}</style>
      )}

      <svg
        viewBox="0 0 400 400"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <defs>
          <filter id="ms-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="ms-glow-sm" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="ms-disc-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="ms-disc-bg" cx="45%" cy="38%" r="60%">
            <stop offset="0%"   stopColor="#10100c" />
            <stop offset="55%"  stopColor="#060604" />
            <stop offset="100%" stopColor="#020201" />
          </radialGradient>
          <radialGradient id="ms-disc-sheen" cx="38%" cy="28%" r="65%">
            <stop offset="0%"   stopColor="rgba(212,175,55,0.10)" />
            <stop offset="60%"  stopColor="rgba(212,175,55,0.03)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0)" />
          </radialGradient>
        </defs>

        {/* Outer ambient glow */}
        <circle
          cx={CX} cy={CY} r="76"
          fill="rgba(212,175,55,0.07)"
          filter="url(#ms-disc-glow)"
          style={reduced ? undefined : { animation: "msAssembleDisc 0.3s ease-out 0s both" }}
        />

        {/* Route arcs */}
        {ARCS.map((arc, i) => {
          const pathLen = (arc.sw / 360) * 2 * Math.PI * arc.r;
          return (
            <path
              key={`arc-${i}`}
              d={arcPath(CX, CY, arc.r, arc.sa, arc.sw)}
              fill="none"
              stroke="#d4af37"
              strokeWidth="1.2"
              strokeLinecap="round"
              filter="url(#ms-glow-sm)"
              style={{
                "--a-op": arc.op,
                opacity: reduced ? arc.op : 0,
                strokeDasharray: pathLen,
                strokeDashoffset: reduced ? 0 : pathLen,
                ...(reduced ? {} : {
                  animation: `msDrawArc 0.9s cubic-bezier(0.22,1,0.36,1) ${1.4 + arc.delay + i * 0.15}s both, msArcPulse 5s ease-in-out ${3.2 + i * 0.3}s infinite`,
                }),
              } as React.CSSProperties}
            />
          );
        })}

        {/* Orbital rings */}
        {RING_RADII.map((r, i) => {
          const circ = 2 * Math.PI * r;
          return (
            <circle
              key={`ring-${i}`}
              cx={CX} cy={CY} r={r}
              fill="none"
              stroke="rgba(212,175,55,0.38)"
              strokeWidth={i === 0 ? 1.4 : i === 1 ? 1.0 : 0.7}
              strokeDasharray={i === 2 ? "5 9" : undefined}
              filter={i === 0 ? "url(#ms-glow)" : undefined}
              style={{
                opacity: reduced ? 0.7 : 0,
                strokeDashoffset: reduced ? 0 : circ,
                ...(reduced ? {} : {
                  animation: `msTraceRing 1.0s cubic-bezier(0.22,1,0.36,1) ${0.9 + i * 0.22}s both${i === 2 ? `, msRingOrbit 32s linear 2.5s infinite` : ""}`,
                  transformOrigin: `${CX}px ${CY}px`,
                }),
              } as React.CSSProperties}
            />
          );
        })}

        {/* Particle dust */}
        {DUST.map((d, i) => (
          <circle
            key={`dust-${i}`}
            cx={d.x} cy={d.y} r={d.r}
            fill="#d4af37"
            style={{
              "--d-op": d.op,
              opacity: d.op,
              ...(reduced ? {} : {
                animation: `msDustDrift ${3.2 + d.d}s ease-in-out ${d.d}s infinite`,
              }),
            } as React.CSSProperties}
          />
        ))}

        {/* Glowing route nodes */}
        {NODES.map((n, i) => {
          const { x, y } = nodePos(n.ri, n.a);
          return (
            <g
              key={`node-${i}`}
              filter="url(#ms-glow)"
              style={{
                opacity: reduced ? 1 : 0,
                ...(reduced ? {} : {
                  animation: `msIgniteNode 0.45s cubic-bezier(0.22,1,0.36,1) ${2.6 + n.d}s both, msNodePulse 3.8s ease-in-out ${3.6 + n.d}s infinite`,
                }),
              } as React.CSSProperties}
            >
              <circle cx={x} cy={y} r={n.s + 6} fill="rgba(212,175,55,0.12)" />
              <circle cx={x} cy={y} r={n.s} fill="none" stroke="rgba(212,175,55,0.7)" strokeWidth="0.8" />
              <circle cx={x} cy={y} r={n.s * 0.42} fill="#fffbe8" opacity="0.95" />
            </g>
          );
        })}

        {/* Dark disc background */}
        <circle
          cx={CX} cy={CY} r="66"
          fill="none" stroke="rgba(212,175,55,0.25)" strokeWidth="1"
          filter="url(#ms-glow)"
          style={reduced ? undefined : { opacity: 0, animation: "msAssembleDisc 0.4s ease-out 0.3s both" }}
        />
        {/* Gold rim */}
        <circle
          cx={CX} cy={CY} r="63"
          fill="none" stroke="rgba(212,175,55,0.5)" strokeWidth="1.2"
          style={reduced ? undefined : { opacity: 0, animation: "msAssembleDisc 0.35s ease-out 0.3s both" }}
        />

        {!reduced && (
          <circle
            cx={CX} cy={CY} r="66"
            fill="none" stroke="rgba(212,175,55,0.6)" strokeWidth="2"
            style={{ opacity: 0, animation: "msUnlockPulse 0.7s ease-out 3.6s 1 both" }}
          />
        )}
      </svg>

      {/* Orb PNG — always visible, parent motion.div provides entrance animation */}
      <img
        src="/milano-seal-orb-v2.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "33%",
          height: "33%",
          objectFit: "cover",
          borderRadius: "50%",
          zIndex: 2,
          opacity: 1,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
