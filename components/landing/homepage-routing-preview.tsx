"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Route } from "lucide-react";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { DestinationIntelligenceCard } from "@/components/landing/destination-intelligence-card";

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
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.32em] text-[#C6A55A]/65">
              Smart Intake Routing
            </p>
            <h2 className="font-serif text-3xl text-white md:text-4xl">
              Routing <em className="text-[#C6A55A]">Preview</em>
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/45 md:text-base">
              Select a priority corridor to prepare a secure intake pathway.
            </p>
          </div>
          <Link
            href="/map"
            className="inline-flex min-h-11 items-center gap-2 self-start border-b border-[#C6A55A]/30 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#C6A55A] transition-colors hover:border-[#C6A55A]"
          >
            Open Full Intelligence Map
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid overflow-hidden rounded-2xl border border-white/[0.07] bg-[#08080A]/90 shadow-[0_30px_90px_rgba(0,0,0,0.45)] lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border-b border-white/[0.06] p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-[#C6A55A]/55">
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
                        ? "border-[#C6A55A]/55 bg-[#C6A55A]/[0.08] text-white"
                        : "border-white/[0.06] bg-white/[0.015] text-white/45 hover:border-[#C6A55A]/25 hover:text-white/70"
                    }`}
                    aria-pressed={active}
                  >
                    <span className="mr-2">{destination.flag}</span>
                    <span className="text-xs">{destination.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border border-[#C6A55A]/10 bg-[#C6A55A]/[0.025] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Route className="h-3.5 w-3.5 text-[#C6A55A]" />
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#C6A55A]/70">
                  Simplified Corridor Logic
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/55">
                <span>Florida</span>
                <span className="h-px flex-1 bg-gradient-to-r from-[#C6A55A]/20 via-[#C6A55A]/70 to-[#C6A55A]/20" />
                <span className="text-white/85">{selected.name}</span>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            <DestinationIntelligenceCard
              key={selected.slug}
              destination={selected}
              variant="homepagePreview"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
