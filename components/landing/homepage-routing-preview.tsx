"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Route } from "lucide-react";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { DestinationIntelligenceCard } from "@/components/landing/destination-intelligence-card";
import { buildHomeCorridor } from "@/lib/intelligence/homeCorridors";
import { MiniCorridorMapPreview } from "@/components/home/MiniCorridorMapPreview";
import { HomeExecutionPathCards } from "@/components/home/HomeExecutionPathCards";
import { HomeShippingCorridorPanel } from "@/components/home/HomeShippingCorridorPanel";
import { GlobalRouteGlobe } from "@/components/globe/GlobalRouteGlobe";

const PRIORITY_SLUGS = [
  "italy",
  "spain",
  "portugal",
  "greece",
  "brazil",
  "mexico",
  "uae",
  "canada",
] as const;

const PRIORITY_DESTINATIONS = PRIORITY_SLUGS.map((slug) =>
  DESTINATIONS.find((destination) => destination.slug === slug),
).filter((destination): destination is Destination => Boolean(destination));

export function HomepageRoutingPreview() {
  const [selected, setSelected] = useState<Destination>(
    PRIORITY_DESTINATIONS[0],
  );

  const corridor = buildHomeCorridor(selected);

  return (
    <section className="relative overflow-hidden bg-[#050507] py-14 md:py-18">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 22% 52%, rgba(198,165,90,0.08), transparent 32%), linear-gradient(rgba(198,165,90,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(198,165,90,0.025) 1px, transparent 1px)",
          backgroundSize: "auto, 42px 42px, 42px 42px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.32em] text-[var(--ms-gold)]/65">
              Smart Intake Routing
            </p>
            <h2 className="font-serif text-3xl text-white md:text-4xl">
              Routing <em className="text-[var(--ms-gold)]">Preview</em>
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/45 md:text-base">
              Select a priority corridor to prepare a secure intake pathway.
            </p>
          </div>
          <Link
            href="/map"
            className="inline-flex min-h-11 items-center gap-2 self-start border-b border-[var(--ms-gold)]/30 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ms-gold)] transition-colors hover:border-[var(--ms-gold)]"
          >
            Open Full Intelligence Map
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Authority globe — compact teaser above the main routing panel */}
        <div className="mb-6 hidden lg:flex items-center gap-6 rounded-xl border border-white/[0.05] bg-[#050507]/80 p-4 overflow-hidden">
          <GlobalRouteGlobe selectedSlug={selected.slug} onSelectCountry={(slug) => { const d = DESTINATIONS.find(x => x.slug === slug); if (d) setSelected(d); }} className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/55 mb-2">Global Authority Network</p>
            <p className="font-serif text-white/80 text-base leading-snug mb-3">
              Click any country on the globe to explore its apostille corridor.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/map" className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--ms-gold)] border-b border-[var(--ms-gold)]/30 pb-0.5 hover:border-[var(--ms-gold)] transition-colors">
                Open Full Atlas <ArrowRight className="w-3 h-3" />
              </Link>
              <Link href="/countries" className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 border-b border-white/10 pb-0.5 hover:text-white/60 hover:border-white/20 transition-colors">
                Country Directory <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid overflow-hidden rounded-2xl border border-white/[0.07] bg-[#08080A]/90 shadow-[0_30px_90px_rgba(0,0,0,0.45)] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6 border-b border-white/[0.06] p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <div>
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--ms-gold)]/55">
                  Priority Destination Corridors
                </span>
                <span className="font-mono text-[8px] text-white/25">
                  Florida origin
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                {PRIORITY_DESTINATIONS.map((destination) => {
                  const active = destination.slug === selected.slug;
                  return (
                    <button
                      key={destination.slug}
                      type="button"
                      onClick={() => setSelected(destination)}
                      className={`min-h-12 rounded-lg border px-3 py-2 text-left transition-all ${
                        active
                          ? "border-[var(--ms-gold)]/55 bg-[var(--ms-gold)]/[0.08] text-white"
                          : "border-white/[0.06] bg-white/[0.015] text-white/45 hover:border-[var(--ms-gold)]/25 hover:text-white/70"
                      }`}
                      aria-pressed={active}
                    >
                      <span className="mr-2">{destination.flag}</span>
                      <span className="text-xs">{destination.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border border-[var(--ms-gold)]/10 bg-[var(--ms-gold)]/[0.025] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Route className="h-3.5 w-3.5 text-[var(--ms-gold)]" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--ms-gold)]/70">
                    Simplified Corridor Logic
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/55">
                  <span>Florida</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-[var(--ms-gold)]/20 via-[var(--ms-gold)]/70 to-[var(--ms-gold)]/20" />
                  <span className="text-white/85">{selected.name}</span>
                </div>
              </div>
            </div>

            <MiniCorridorMapPreview corridor={corridor} />
          </div>

          <div className="space-y-6 p-5 sm:p-6 lg:p-8">
            <DestinationIntelligenceCard
              key={selected.slug}
              destination={selected}
              variant="homepagePreview"
            />
            <HomeExecutionPathCards />
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <HomeShippingCorridorPanel corridor={corridor} />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={corridor.intakeHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--ms-gold)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#050507] transition-colors hover:bg-[var(--ms-gold)]/90"
            >
              Begin Secure Intake
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/countries/${corridor.slug}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[var(--ms-gold)]/30 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ms-gold)] transition-colors hover:border-[var(--ms-gold)]/60"
            >
              View Country Requirements
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
