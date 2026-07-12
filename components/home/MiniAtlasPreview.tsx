"use client";

/**
 * MiniAtlasPreview — the homepage "command widget".
 *
 * This is intentionally NOT the full Atlas. Embedding the real Leaflet world
 * map made the homepage *be* Atlas instead of teasing it. Instead this is a
 * minimal, cinematic HUD — a living corridor readout (Florida → destination)
 * with orbital arcs, a self-drawing gold route, marker pulses and a scan beam.
 *
 * It still speaks the canonical Atlas language: canonical `DESTINATIONS` data,
 * gold palette, Hague / Consular badge vocabulary, Florida execution origin —
 * and it deep-links into the full Atlas (`/map?country=<slug>`), which remains
 * the place where users actually explore the world.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { setActiveCorridor } from "@/lib/homepage/activeCorridorStore";

interface Props {
  selected: Destination;
  onSelect: (dest: Destination) => void;
  /** When false, the auto-cycle is suspended. */
  autoCycle?: boolean;
}

// Priority cycle order (canonical supported destinations first, then the rest).
const PRIORITY_SLUGS = [
  "italy", "germany", "uae", "mexico", "brazil",
  "spain", "france", "portugal", "united-kingdom", "canada",
];

function buildCycleOrder(): Destination[] {
  const bySlug = new Map(DESTINATIONS.map((d) => [d.slug, d]));
  const ordered: Destination[] = [];
  const seen = new Set<string>();
  for (const slug of PRIORITY_SLUGS) {
    const d = bySlug.get(slug);
    if (d && !seen.has(slug)) { ordered.push(d); seen.add(slug); }
  }
  for (const d of DESTINATIONS) {
    if (!seen.has(d.slug)) { ordered.push(d); seen.add(d.slug); }
  }
  return ordered;
}

const CYCLE_ORDER = buildCycleOrder();
const CYCLE_INTERVAL_MS = 5000;

function translationLikely(d: Destination): boolean {
  return d.executionPath.some((s) => /translation/i.test(s));
}

export function MiniAtlasPreview({ selected, onSelect, autoCycle = true }: Props) {
  const pausedRef = useRef(false);
  const [analyzing, setAnalyzing] = useState(false);

  const idx = CYCLE_ORDER.findIndex((d) => d.slug === selected.slug);
  const nextDest = CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];

  // Auto-cycle through canonical destinations, pausing on hover/focus/manual.
  useEffect(() => {
    if (!autoCycle) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      const i = CYCLE_ORDER.findIndex((d) => d.slug === selected.slug);
      const next = CYCLE_ORDER[(i + 1) % CYCLE_ORDER.length];
      if (next) onSelect(next);
    }, CYCLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [selected.slug, autoCycle, onSelect]);

  // Brief "Analyzing…" → badge reveal each time the corridor changes.
  useEffect(() => {
    setAnalyzing(true);
    const t = setTimeout(() => setAnalyzing(false), 850);
    return () => clearTimeout(t);
  }, [selected.slug]);

  // Publish the featured corridor so the Milano Trust Core engine can sync to it.
  useEffect(() => {
    setActiveCorridor(selected.slug);
  }, [selected.slug]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  const hague = selected.hague;
  const accent = hague ? "var(--ms-gold)" : "#E0876E";
  const translate = translationLikely(selected);

  return (
    <div
      className="ms-mini-atlas relative overflow-hidden rounded-2xl border border-[var(--ms-gold)]/20 bg-[#060608]"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ms-gold)]/70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--ms-gold)]" />
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/75">
            Global Execution Network
          </span>
        </div>
        <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">Live Corridor</span>
      </div>

      {/* Cinematic corridor stage */}
      <div className="relative">
        <svg viewBox="0 0 320 260" className="h-[240px] w-full sm:h-[268px]" role="img" aria-label={`Live corridor from Florida to ${selected.name}`}>
          <defs>
            <radialGradient id="ma-bg" cx="50%" cy="42%" r="75%">
              <stop offset="0%" stopColor="#0C0D12" />
              <stop offset="100%" stopColor="#040406" />
            </radialGradient>
            <linearGradient id="ma-route" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
              <stop offset="50%" stopColor={accent} stopOpacity="1" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.5" />
            </linearGradient>
            <filter id="ma-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect x={0} y={0} width={320} height={260} fill="url(#ma-bg)" />

          {/* Region illumination — soft light where the destination sits */}
          <ellipse cx={222} cy={188} rx={70} ry={44} fill={accent} opacity={0.05} />

          {/* Orbital arcs — hint of a globe without a full map */}
          <g stroke="var(--ms-gold)" fill="none" opacity={0.14}>
            <ellipse cx={160} cy={150} rx={130} ry={44} strokeWidth={0.5}>
              <animateTransform attributeName="transform" type="rotate" from="0 160 150" to="360 160 150" dur="34s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx={160} cy={150} rx={96} ry={78} strokeWidth={0.5} opacity={0.7}>
              <animateTransform attributeName="transform" type="rotate" from="360 160 150" to="0 160 150" dur="46s" repeatCount="indefinite" />
            </ellipse>
          </g>

          {/* Curved horizon — global network without continents */}
          <path d="M -20 236 Q 160 176 340 236" fill="none" stroke="var(--ms-gold)" strokeWidth={0.8} opacity={0.16} />
          <path d="M -20 246 Q 160 190 340 246" fill="none" stroke="var(--ms-gold)" strokeWidth={0.5} opacity={0.08} />

          {/* Drifting particles */}
          <g fill="var(--ms-gold)">
            {[
              { x: 54, y: 74, d: "7s" }, { x: 260, y: 96, d: "9s" }, { x: 120, y: 52, d: "8s" },
              { x: 210, y: 60, d: "6.5s" }, { x: 80, y: 120, d: "10s" }, { x: 250, y: 150, d: "7.5s" },
            ].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={0.9} fillOpacity={0.5}>
                <animate attributeName="opacity" values="0.1;0.6;0.1" dur={p.d} repeatCount="indefinite" />
                <animate attributeName="cy" values={`${p.y};${p.y - 6};${p.y}`} dur={p.d} repeatCount="indefinite" />
              </circle>
            ))}
          </g>

          {/* Scan beam sweep */}
          <line x1={160} y1={150} x2={160} y2={30} stroke={accent} strokeWidth={0.8} opacity={0.16}>
            <animateTransform attributeName="transform" type="rotate" from="0 160 150" to="360 160 150" dur="9s" repeatCount="indefinite" />
          </line>

          {/* Self-drawing route — re-mounts (keyed) each corridor change */}
          <g key={selected.slug}>
            <path
              d="M 86 96 Q 160 118 226 190"
              fill="none"
              stroke="url(#ma-route)"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeDasharray="220"
              strokeDashoffset="220"
            >
              <animate attributeName="stroke-dashoffset" from="220" to="0" dur="1.1s" fill="freeze" calcMode="spline" keySplines="0.16 1 0.3 1" keyTimes="0;1" />
            </path>
            {/* Travelling pulse */}
            <circle r={2.1} fill="#FFF6E2">
              <animateMotion dur="2.8s" repeatCount="indefinite" path="M 86 96 Q 160 118 226 190" />
            </circle>
          </g>

          {/* Florida origin node */}
          <circle cx={86} cy={96} r={3} fill="var(--ms-gold)" filter="url(#ma-glow)" />
          <circle cx={86} cy={96} r={1.3} fill="#FFF6E2" />
          <text x={86} y={84} textAnchor="middle" fontSize={7} fontFamily="monospace" fill="var(--ms-gold)" opacity={0.8}>FLORIDA</text>

          {/* Destination node + ping */}
          <circle cx={226} cy={190} r={5} fill="none" stroke={accent} strokeWidth={1}>
            <animate attributeName="r" values="4;10;4" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx={226} cy={190} r={3.2} fill={accent} filter="url(#ma-glow)" />
          <circle cx={226} cy={190} r={1.5} fill="#FFF6E2" />
        </svg>

        {/* Destination readout overlay */}
        <div className="pointer-events-none absolute right-4 top-1/2 z-10 max-w-[52%] -translate-y-1/2 text-right">
          <div className="mb-1 flex items-center justify-end gap-1.5">
            <span className="text-xl leading-none">{selected.flag}</span>
            <span className="font-serif text-lg leading-tight text-white">{selected.name}</span>
          </div>
          <div className="flex items-center justify-end">
            {analyzing ? (
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/40">Analyzing…</span>
            ) : (
              <span
                className={`rounded-full border px-2 py-0.5 font-mono text-[7.5px] uppercase tracking-[0.14em] ${
                  hague
                    ? "border-[var(--ms-gold)]/40 bg-[var(--ms-gold)]/[0.08] text-[var(--ms-gold)]"
                    : "border-[#C0563E]/40 bg-[#C0563E]/[0.1] text-[#E0876E]"
                }`}
              >
                {hague ? "Hague Member ✓" : "Consular Review"}
              </span>
            )}
          </div>
          {!analyzing && translate && (
            <p className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-white/35">Translation Review</p>
          )}
        </div>
      </div>

      {/* Footer — next corridor + Atlas link */}
      <div className="relative z-10 flex items-center justify-between gap-3 border-t border-white/[0.05] px-4 py-3">
        <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">
          Next <span className="text-white/55">{nextDest?.name}</span>
        </span>
        <Link
          href={`/map?country=${encodeURIComponent(selected.slug)}`}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--ms-gold)]/35 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ms-gold)] transition-colors hover:border-[var(--ms-gold)] hover:bg-[var(--ms-gold)]/[0.06]"
        >
          Launch Atlas <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
