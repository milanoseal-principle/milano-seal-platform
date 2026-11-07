"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Route } from "lucide-react";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { DOCUMENTS } from "@/components/landing/document-intelligence";
import { buildHomeCorridor } from "@/lib/intelligence/homeCorridors";
import { DestinationIntelligenceCard } from "@/components/landing/destination-intelligence-card";
import { MiniAtlasPreview } from "@/components/home/MiniAtlasPreview";
import { HomeShippingCorridorPanel } from "@/components/home/HomeShippingCorridorPanel";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";

function normalizedCountryName(name: string) {
  if (name === "UK") return "United Kingdom";
  return name;
}

export function HomepageRoutingPreview() {
  const [documentId, setDocumentId] = useState(DOCUMENTS[0].id);
  const document = DOCUMENTS.find((item) => item.id === documentId) ?? DOCUMENTS[0];

  const relevantDestinations = useMemo(() => {
    const names = new Set(document.countries.map(normalizedCountryName));
    const matched = DESTINATIONS.filter((destination) => names.has(destination.name));
    return matched.length > 0 ? matched : DESTINATIONS.slice(0, 8);
  }, [document]);

  const [selectedSlug, setSelectedSlug] = useState(relevantDestinations[0]?.slug ?? DESTINATIONS[0].slug);
  const selected =
    relevantDestinations.find((destination) => destination.slug === selectedSlug) ??
    relevantDestinations[0] ??
    DESTINATIONS[0];

  const reduceMotion = useMilanoReducedMotion();
  const corridor = buildHomeCorridor(selected);

  const selectDocument = (nextId: string) => {
    const nextDocument = DOCUMENTS.find((item) => item.id === nextId) ?? DOCUMENTS[0];
    const names = new Set(nextDocument.countries.map(normalizedCountryName));
    const nextDestinations = DESTINATIONS.filter((destination) => names.has(destination.name));
    setDocumentId(nextId);
    if (nextDestinations.length > 0) setSelectedSlug(nextDestinations[0].slug);
  };

  const selectDestination = (destination: Destination) => setSelectedSlug(destination.slug);

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
          <div className="max-w-3xl">
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.32em] text-[var(--ms-gold)]/65">Document + Corridor Intelligence</p>
            <h2 className="font-serif text-[clamp(1.8rem,7vw,2.6rem)] leading-tight text-white md:text-4xl">
              Execution Intelligence <em className="text-[var(--ms-gold)]">Workspace</em>
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/45 md:text-base">
              Choose what you are executing, then choose the destination. The document profile, corridor atlas, jurisdiction intelligence, custody path, and intake route operate as one synchronized module.
            </p>
          </div>
          <Link
            href={`/map?country=${selected.slug}`}
            className="inline-flex min-h-11 items-center gap-2 self-start border-b border-[var(--ms-gold)]/30 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ms-gold)] transition-colors hover:border-[var(--ms-gold)]"
          >
            Open Full Intelligence Map <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div
          className="relative overflow-hidden rounded-3xl border border-[var(--ms-gold)]/20 bg-[#08080A]/95 shadow-[0_35px_120px_rgba(0,0,0,0.55)]"
          data-atlas-corridor-module="unified"
          data-active-country={selected.slug}
          data-active-document={document.id}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--ms-gold)]/65 to-transparent" />

          <div className="border-b border-white/[0.06] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--ms-gold)]/55">01 · What are you executing?</p>
                <p className="mt-1 text-xs text-white/30">Document selection controls the priority destination set below.</p>
              </div>
              {document.bundle && <span className="hidden rounded-full border border-[var(--ms-gold)]/20 bg-[var(--ms-gold)]/[0.05] px-3 py-1.5 text-[9px] text-[var(--ms-gold)]/75 sm:inline-flex">{document.bundle}</span>}
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {DOCUMENTS.map((item) => {
                const Icon = item.Icon;
                const active = item.id === document.id;
                return (
                  <button key={item.id} type="button" onClick={() => selectDocument(item.id)} aria-pressed={active} className={`min-h-20 rounded-xl border p-3 text-left transition-all duration-300 ${active ? "border-[var(--ms-gold)]/50 bg-[var(--ms-gold)]/[0.07] text-white" : "border-white/[0.06] bg-white/[0.015] text-white/45 hover:border-[var(--ms-gold)]/20 hover:text-white/70"}`}>
                    <Icon className="h-4 w-4 text-[var(--ms-gold)]/65" strokeWidth={1.5} />
                    <span className="mt-3 block text-xs leading-snug">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-b border-white/[0.06] p-5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--ms-gold)]/55">02 · Choose destination corridor</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-2xl">{selected.flag}</span>
                  <div><p className="font-serif text-xl text-white">Florida → {selected.name}</p><p className="mt-0.5 text-xs text-white/28">{document.label}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:min-w-[620px]">
                {relevantDestinations.slice(0, 8).map((destination) => {
                  const active = destination.slug === selected.slug;
                  return (
                    <button key={destination.slug} type="button" onClick={() => selectDestination(destination)} aria-pressed={active} className={`min-h-11 rounded-lg border px-3 py-2 text-left transition-all duration-300 ${active ? "border-[var(--ms-gold)]/55 bg-[var(--ms-gold)]/[0.08] text-white shadow-[inset_0_0_24px_rgba(198,165,90,0.05)]" : "border-white/[0.06] bg-white/[0.015] text-white/42 hover:border-[var(--ms-gold)]/25 hover:text-white/70"}`}>
                      <span className="mr-2">{destination.flag}</span><span className="text-xs">{destination.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${document.id}:${selected.slug}`} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(5px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(4px)" }} transition={{ duration: reduceMotion ? 0.12 : 0.32, ease: [0.22, 1, 0.36, 1] }}>
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="space-y-5 border-b border-white/[0.06] p-5 sm:p-6 lg:border-b-0 lg:border-r">
                  <div className="rounded-xl border border-[var(--ms-gold)]/10 bg-[var(--ms-gold)]/[0.025] p-4">
                    <div className="mb-3 flex items-center gap-2"><Route className="h-3.5 w-3.5 text-[var(--ms-gold)]" /><span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--ms-gold)]/70">03 · Active execution corridor</span></div>
                    <div className="flex items-center gap-3 text-xs text-white/55"><span>Florida</span><span className="h-px flex-1 bg-gradient-to-r from-[var(--ms-gold)]/20 via-[var(--ms-gold)]/80 to-[var(--ms-gold)]/20" /><span className="text-white/90">{selected.name}</span></div>
                  </div>
                  <MiniAtlasPreview selected={selected} onSelect={selectDestination} autoCycle={false} />
                </div>
                <div className="p-5 sm:p-6 lg:p-8">
                  <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
                    <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--ms-gold)]/55">Selected Matter Profile</p>
                    <p className="mt-2 font-serif text-lg text-white">{document.label} · {selected.name}</p>
                    <p className="mt-1 text-xs text-white/32">Destination routing below remains jurisdiction-specific; document acceptance is still receiving-authority dependent.</p>
                  </div>
                  <DestinationIntelligenceCard destination={selected} variant="homepagePreview" />
                </div>
              </div>

              <div className="border-t border-white/[0.06] p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div><p className="font-mono text-[8px] uppercase tracking-[0.22em] text-[var(--ms-gold)]/55">04 · {selected.flag} {selected.name} controlled custody path</p><p className="mt-1 text-xs text-white/32">The route, custody, compliance, and CTAs below belong to the active document + jurisdiction state.</p></div>
                  <span className="hidden rounded-full border border-[var(--ms-gold)]/20 bg-[var(--ms-gold)]/[0.04] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--ms-gold)]/70 sm:inline-flex">{document.label}</span>
                </div>
                <HomeShippingCorridorPanel corridor={corridor} />
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link href={corridor.intakeHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--ms-gold)] px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#050507] transition-colors hover:bg-[var(--ms-gold)]/90">Begin {selected.name} Matter<ArrowRight className="h-3.5 w-3.5" /></Link>
                  <Link href={`/countries/${corridor.slug}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[var(--ms-gold)]/30 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ms-gold)] transition-colors hover:border-[var(--ms-gold)]/60">View {selected.name} Requirements</Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
