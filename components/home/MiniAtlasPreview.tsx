"use client";

/**
 * MiniAtlasPreview — a TRUE scaled-down reuse of the canonical /map Atlas.
 *
 * Rather than a hand-drawn SVG teaser, this embeds the SAME interactive
 * component the full Atlas uses (`GlobalIntelMapInteractive`) inside a compact
 * frame. It therefore inherits the canonical world choropleth, the canonical
 * `DESTINATIONS` country data, the Florida execution origin, the gold palette,
 * the HAGUE / NON-HAGUE badge language, and the marker/typography system.
 *
 * Selection is lifted to the parent so the homepage Execution Intelligence card
 * stays in sync, and "Open Full Atlas" deep-links to /map carrying the country
 * slug so the full Atlas opens already focused on the same corridor.
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { GlobalIntelMapInteractive } from "@/components/landing/global-intel-map-interactive";

interface Props {
  selected: Destination;
  onSelect: (dest: Destination) => void;
  /** When false, the auto-cycle is suspended (e.g. parent knows user is interacting). */
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
    if (d && !seen.has(slug)) {
      ordered.push(d);
      seen.add(slug);
    }
  }
  for (const d of DESTINATIONS) {
    if (!seen.has(d.slug)) {
      ordered.push(d);
      seen.add(d.slug);
    }
  }
  return ordered;
}

const CYCLE_ORDER = buildCycleOrder();
const CYCLE_INTERVAL_MS = 5000;

export function MiniAtlasPreview({ selected, onSelect, autoCycle = true }: Props) {
  const pausedRef = useRef(false);

  // Auto-cycle through canonical destinations, pausing on hover/focus/manual.
  useEffect(() => {
    if (!autoCycle) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      const idx = CYCLE_ORDER.findIndex((d) => d.slug === selected.slug);
      const next = CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
      if (next) onSelect(next);
    }, CYCLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [selected.slug, autoCycle, onSelect]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  return (
    <div
      className="overflow-hidden rounded-2xl border border-[var(--ms-gold)]/20 bg-[#070709]"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
      onPointerDownCapture={pause}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70 whitespace-nowrap">
            Mini Atlas
          </span>
          <span className="hidden sm:inline text-white/15">·</span>
          <span className="hidden sm:inline font-serif text-xs text-white/70 truncate">
            Scaled Intelligence Preview
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-[var(--ms-gold)]/20 bg-[var(--ms-gold)]/[0.04] px-2.5 py-1">
          <MapPin className="h-3 w-3 text-[var(--ms-gold)]/70" />
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/55">Florida origin</span>
        </div>
      </div>

      {/* True canonical Atlas map — compact frame */}
      <div className="relative h-[300px] sm:h-[340px]">
        <GlobalIntelMapInteractive
          onSelect={(dest) => { if (dest) onSelect(dest); }}
          selectedDest={selected}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/[0.05] px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/75 truncate">
            FL → {selected.name}
          </span>
          <span
            className={`flex-shrink-0 rounded-full border px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.14em] ${
              selected.hague
                ? "border-[var(--ms-gold)]/40 bg-[var(--ms-gold)]/[0.08] text-[var(--ms-gold)]"
                : "border-[#C0563E]/40 bg-[#C0563E]/[0.1] text-[#E0876E]"
            }`}
          >
            {selected.hague ? "Hague" : "Consular"}
          </span>
        </div>
        <Link
          href={`/map?country=${encodeURIComponent(selected.slug)}`}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[var(--ms-gold)]/35 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ms-gold)] transition-colors hover:border-[var(--ms-gold)]"
        >
          Open Full Atlas <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
