"use client";

import { useEffect, useRef, useState } from "react";

function seededRand(seed: number) {
  let s = seed;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 4294967295;
  };
}

interface Region {
  x: number; y: number; w: number; h: number; count: number;
  minR: number; maxR: number; minO: number; maxO: number;
}

function generateDots(regions: Region[]) {
  const dots: { cx: number; cy: number; r: number; opacity: number }[] = [];
  regions.forEach((reg, ri) => {
    const rng = seededRand(ri * 7919 + 31337);
    for (let i = 0; i < reg.count; i++) {
      dots.push({
        cx:      reg.x + rng() * reg.w,
        cy:      reg.y + rng() * reg.h,
        r:       reg.minR + rng() * (reg.maxR - reg.minR),
        opacity: reg.minO + rng() * (reg.maxO - reg.minO),
      });
    }
  });
  return dots;
}

const CONTINENT_REGIONS: Region[] = [
  { x: 152, y: 75,  w: 32,  h: 38,  count: 14,  minR: 0.5, maxR: 1.8, minO: 0.12, maxO: 0.32 },
  { x: 55,  y: 105, w: 78,  h: 52,  count: 48,  minR: 0.5, maxR: 2.5, minO: 0.18, maxO: 0.52 },
  { x: 112, y: 148, w: 40,  h: 45,  count: 22,  minR: 0.5, maxR: 1.8, minO: 0.15, maxO: 0.45 },
  { x: 55,  y: 148, w: 30,  h: 50,  count: 18,  minR: 0.5, maxR: 1.5, minO: 0.12, maxO: 0.40 },
  { x: 88,  y: 205, w: 32,  h: 30,  count: 10,  minR: 0.4, maxR: 1.2, minO: 0.10, maxO: 0.32 },
  { x: 92,  y: 228, w: 68,  h: 45,  count: 36,  minR: 0.5, maxR: 2.2, minO: 0.15, maxO: 0.48 },
  { x: 102, y: 268, w: 50,  h: 48,  count: 24,  minR: 0.5, maxR: 1.8, minO: 0.12, maxO: 0.40 },
  { x: 195, y: 98,  w: 52,  h: 55,  count: 38,  minR: 0.4, maxR: 1.8, minO: 0.18, maxO: 0.52 },
  { x: 238, y: 112, w: 32,  h: 45,  count: 18,  minR: 0.4, maxR: 1.5, minO: 0.15, maxO: 0.42 },
  { x: 195, y: 158, w: 72,  h: 48,  count: 38,  minR: 0.5, maxR: 2.0, minO: 0.15, maxO: 0.45 },
  { x: 198, y: 202, w: 65,  h: 70,  count: 42,  minR: 0.5, maxR: 2.2, minO: 0.15, maxO: 0.48 },
  { x: 258, y: 142, w: 52,  h: 52,  count: 24,  minR: 0.4, maxR: 1.8, minO: 0.15, maxO: 0.45 },
  { x: 258, y: 78,  w: 115, h: 72,  count: 58,  minR: 0.4, maxR: 1.8, minO: 0.10, maxO: 0.38 },
  { x: 270, y: 165, w: 35,  h: 55,  count: 22,  minR: 0.4, maxR: 1.8, minO: 0.15, maxO: 0.45 },
  { x: 295, y: 118, w: 72,  h: 68,  count: 50,  minR: 0.4, maxR: 2.0, minO: 0.15, maxO: 0.48 },
  { x: 352, y: 128, w: 22,  h: 45,  count: 14,  minR: 0.4, maxR: 1.4, minO: 0.12, maxO: 0.38 },
  { x: 305, y: 190, w: 65,  h: 52,  count: 25,  minR: 0.4, maxR: 1.5, minO: 0.12, maxO: 0.38 },
  { x: 312, y: 235, w: 68,  h: 48,  count: 28,  minR: 0.5, maxR: 2.2, minO: 0.15, maxO: 0.45 },
  { x: 368, y: 268, w: 14,  h: 22,  count: 6,   minR: 0.4, maxR: 1.2, minO: 0.12, maxO: 0.35 },
];

const FRONT_DOTS = generateDots(CONTINENT_REGIONS);
const ALL_DOTS = [
  ...FRONT_DOTS,
  ...FRONT_DOTS.map(d => ({ ...d, cx: d.cx + 400 })),
];

export function GlobalTrustCoreHero() {
  const [visible,  setVisible]  = useState(false);
  const [rotating, setRotating] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) {
      setVisible(true);
      setRotating(true);
      return;
    }
    timers.current.push(setTimeout(() => setVisible(true),  80));
    timers.current.push(setTimeout(() => setRotating(true), 400));
    return () => timers.current.forEach(clearTimeout);
  }, []);

  return (
    <div className="ms-globe-container" aria-hidden="true">
      {/* Gold bloom behind sphere */}
      <div className="ms-globe-bloom" />

      {/* Glass sphere */}
      <div
        className={[
          "ms-globe-sphere",
          visible  && "ms-globe-sphere--visible",
          rotating && "ms-globe-sphere--rotating",
        ].filter(Boolean).join(" ")}
      >
        {/* Latitude / longitude atmospheric grid — defocused (far hemisphere) */}
        <svg viewBox="0 0 400 400" className="ms-globe-grid-svg ms-globe-grid-svg--defocus" aria-hidden="true">
          <ellipse cx="200" cy="200" rx="193" ry="40"  fill="none" stroke="#C6A55A" strokeWidth="0.4" opacity="0.10" />
          <ellipse cx="200" cy="145" rx="171" ry="32"  fill="none" stroke="#C6A55A" strokeWidth="0.3" opacity="0.07" />
          <ellipse cx="200" cy="255" rx="171" ry="32"  fill="none" stroke="#C6A55A" strokeWidth="0.3" opacity="0.07" />
          <ellipse cx="200" cy="200" rx="40"  ry="193" fill="none" stroke="#C6A55A" strokeWidth="0.3" opacity="0.08" />
          <ellipse cx="200" cy="200" rx="103" ry="193" fill="none" stroke="#C6A55A" strokeWidth="0.2" opacity="0.05" />
          <ellipse cx="200" cy="200" rx="156" ry="193" fill="none" stroke="#C6A55A" strokeWidth="0.2" opacity="0.04" />
        </svg>

        {/* Continent molecule dots — 200% wide, animates for rotation illusion */}
        <svg viewBox="0 0 800 400" className="ms-globe-dots-layer" aria-hidden="true">
          {ALL_DOTS.map((dot, i) => (
            <circle
              key={i}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill="#C6A55A"
              opacity={dot.opacity}
            />
          ))}
        </svg>

        {/* Glass specular cap — top-left diagonal highlight */}
        <div className="ms-globe-glass-cap" />

        {/* Enhanced inner specular */}
        <div className="ms-globe-inner-specular" style={{
          position:'absolute', inset:0, borderRadius:'50%',
          background:'radial-gradient(ellipse 60% 40% at 38% 28%, rgba(255,255,255,0.06) 0%, transparent 65%)',
          pointerEvents:'none',
        }} />

        {/* Crest glow pulse — sibling to crest, below it in z */}
        <div className="ms-globe-crest-glow" />

        {/* Center crest — official Milano Seal™ mark via CSS */}
        <div className="ms-globe-crest" aria-hidden="true" />

        {/* Top-left spotlight highlight */}
        <div className="ms-globe-spotlight" />
      </div>

      {/* Orbit rings */}
      <div className="ms-orbit-ring ms-orbit-ring--main" />
      <div className="ms-orbit-ring ms-orbit-ring--outer" />

      {/* Label row */}
      <div className={`ms-globe-label${visible ? " ms-globe-label--visible" : ""}`}>
        <span className="ms-globe-label-text">Global Trust Core™</span>
        <span className="ms-globe-label-sub">Hague Route Reviewed · Structured International Release</span>
      </div>
    </div>
  );
}
