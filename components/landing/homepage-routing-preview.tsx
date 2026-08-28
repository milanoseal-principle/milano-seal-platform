"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Route } from "lucide-react";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { buildHomeCorridor } from "@/lib/intelligence/homeCorridors";
import { DestinationIntelligenceCard } from "@/components/landing/destination-intelligence-card";
import { MiniAtlasPreview } from "@/components/home/MiniAtlasPreview";
import { HomeShippingCorridorPanel } from "@/components/home/HomeShippingCorridorPanel";

const PRIORITY_DESTINATIONS: Destination[] = DESTINATIONS.slice(0, 8);

export function HomepageRoutingPreview() {
  const [selected, setSelected] = useState<Destination>(PRIORITY_DESTINATIONS[0]);
  const reduceMotion = useReducedMotion();
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
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.32em] text-[var(--ms-gold)]/65">Smart Intake Routing</p>
            <h2 className="font-serif text-[clamp(1.65rem,7vw,2.4rem)] leading-tight text-white md:text-4xl">
              Atlas Corridor <em className="text-[var(--ms-gold)]">Intelligence</em>
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/45 md:text-base">
              One synchronized corridor module. Select a destination and the atlas, execution intelligence, custody path, compliance posture, and intake route update together.
            </p>
          </div>
          <Link
            href={`/map?country=${selected.slug}`}
            className="inline-flex min-h-11 items-center gap-2 self-start border-b border-[var(--ms-gold)]/30 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ms-gold)] transition-colors hover:border-[var(--ms-gold)]"
          >
            Open Full Intelligence Map
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div
          className="relative overflow-hidden rounded-3xl border border-[var(--ms-gold)]/20 bg-[#08080A]/95 shadow-[0_35px_120px_rgba(0,0,0,0.55)]"
          data-atlas-corridor-module="unified"
          data-active-country={selected.slug}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--ms-gold)]/65 to-transparent" />

          <div className="border-b border-white/[0.06] p-5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--ms-gold)]/55">Priority Destination Corridors</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-2xl">{selected.flag}</span>
                  <div>
                    <p className="font-serif text-xl text-white">Florida → {selected.name}</p>
                    <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.13em] text-white/28">Active jurisdiction state</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[620px]">
                {PRIORITY_DESTINATIONS.map((destination) => {
                  const active = destination.slug === selected.slug;
                  return (
                    <button
                      key={destination.slug}
                      type="button"
                      onClick={() => setSelected(destination)}
                      className={`min-h-11 rounded-lg border px-3 py-2 text-left transition-all duration-300 ${
                        active
                          ? "border-[var(--ms-gold)]/55 bg-[var(--ms-gold)]/[0.08] text-white shadow-[inset_0_0_24px_rgba(198,165,90,0.05)]"
                          : "border-white/[0.06] bg-white/[0.015] text-white/42 hover:border-[var(--ms-gold)]/25 hover:text-white/70"
                      }`}
                      aria-pressed={active}
                    >
                      <span className="mr-2">{destination.flag}</span>
                      <span className="text-xs">{destination.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selected.slug}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: reduceMotion ? 0.12 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="space-y-5 border-b border-white/[0.06] p-5 sm:p-6 lg:border-b-0 lg:border-r">
                  <div className="rounded-xl border border-[var(--ms-gold)]/10 bg-[var(--ms-gold)]/[0.025] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Route className="h-3.5 w-3.5 text-[var(--ms-gold)]" />
                      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--ms-gold)]/70">Corridor Logic</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/55">
                      <span>Florida</span>
                      <span className="h-px flex-1 bg-gradient-to-r from-[var(--ms-gold)]/20 via-[var(--ms-gold)]/80 to-[var(--ms-gold)]/20" />
                      <span className="text-white/90">{selected.name}</span>
                    </div>
                  </div>

                  <MiniAtlasPreview selected={selected} onSelect={setSelected} />
                </div>

                <div className="p-5 sm:p-6 lg:p-8">
                  <DestinationIntelligenceCard destination={selected} variant="homepagePreview" />
                </div>
              </div>

              <div className="border-t border-white/[0.06] p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-[var(--ms-gold)]/55">{selected.flag} {selected.name} · Controlled custody path</p>
                    <p className="mt-1 text-xs text-white/32">This route block belongs to the active jurisdiction above and changes with it.</p>
                  </div>
                  <span className="hidden rounded-full border border-[var(--ms-gold)]/20 bg-[var(--ms-gold)]/[0.04] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--ms-gold)]/70 sm:inline-flex">Active: {selected.name}</span>
                </div>

                <HomeShippingCorridorPanel corridor={corridor} />

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={corridor.intakeHref}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--ms-gold)] px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#050507] transition-colors hover:bg-[var(--ms-gold)]/90"
                  >
                    Begin {selected.name} Matter
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/countries/${corridor.slug}`}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[var(--ms-gold)]/30 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ms-gold)] transition-colors hover:border-[var(--ms-gold)]/60"
                  >
                    View {selected.name} Requirements
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
