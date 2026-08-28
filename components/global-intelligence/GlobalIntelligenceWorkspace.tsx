"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Globe2, ListTree, Map, ShieldCheck } from "lucide-react";
import { CountriesDirectoryInteractive } from "@/components/countries/CountriesDirectoryInteractive";
import { ProgressiveCertaintyExplorer } from "@/components/progressive-certainty/ProgressiveCertaintyExplorer";

const LazyGlobalMap = dynamic(
  () => import("@/components/landing/global-map").then((module) => module.GlobalMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="mx-auto flex min-h-[34rem] max-w-7xl items-center justify-center rounded-[2rem] border border-white/[0.07] bg-[#080809] px-6 text-center"
        role="status"
        aria-live="polite"
      >
        <div>
          <div className="mx-auto h-10 w-10 rounded-full border border-[#C6A65B]/30 bg-[#C6A65B]/[0.04] motion-safe:animate-pulse" />
          <p className="mt-5 font-serif text-2xl text-white">Preparing the intelligence atlas</p>
          <p className="mt-2 text-sm text-white/35">The interactive map loads only when you open Atlas view.</p>
        </div>
      </div>
    ),
  },
);

const LazyRoutingIntelligence = dynamic(
  () =>
    import("@/components/landing/routing-intelligence-section").then(
      (module) => module.RoutingIntelligenceSection,
    ),
  { ssr: false },
);

type IntelligenceView = "directory" | "map";

export function GlobalIntelligenceWorkspace({
  initialView = "directory",
  initialCountry,
}: {
  initialView?: IntelligenceView;
  initialCountry?: string;
}) {
  const [view, setView] = useState<IntelligenceView>(initialView);

  const viewCopy = useMemo(
    () =>
      view === "directory"
        ? {
            eyebrow: "Country Directory",
            title: "Start with jurisdiction intelligence.",
            body: "Structure the destination, document, origin, and signer posture before moving into the full geographic atlas.",
          }
        : {
            eyebrow: "Interactive Atlas",
            title: "Explore the execution corridor.",
            body: "Open the geographic intelligence layer only when the map adds value. The route engine remains governed by the same country data underneath it.",
          },
    [view],
  );

  return (
    <section className="pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-[2rem] border border-white/[0.07] bg-[#09090A] p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-2" role="tablist" aria-label="Global intelligence view">
            <button
              type="button"
              role="tab"
              aria-selected={view === "directory"}
              onClick={() => setView("directory")}
              className={`min-h-12 rounded-xl px-5 text-left transition-colors ${
                view === "directory"
                  ? "bg-[#C6A65B] text-[#060606]"
                  : "bg-white/[0.025] text-white/55 hover:bg-white/[0.045] hover:text-white/80"
              }`}
            >
              <span className="flex items-center gap-3">
                <ListTree className="h-4 w-4" />
                <span className="text-sm font-semibold">Country Directory</span>
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "map"}
              onClick={() => setView("map")}
              className={`min-h-12 rounded-xl px-5 text-left transition-colors ${
                view === "map"
                  ? "bg-[#C6A65B] text-[#060606]"
                  : "bg-white/[0.025] text-white/55 hover:bg-white/[0.045] hover:text-white/80"
              }`}
            >
              <span className="flex items-center gap-3">
                <Map className="h-4 w-4" />
                <span className="text-sm font-semibold">Interactive Atlas</span>
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 border-b border-white/[0.055] py-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C6A65B]/65">{viewCopy.eyebrow}</p>
            <h2 className="mt-4 font-serif text-3xl text-white sm:text-4xl">{viewCopy.title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/42">{viewCopy.body}</p>
          </div>
          <div className="rounded-2xl border border-[#C6A65B]/14 bg-[#C6A65B]/[0.02] p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#C6A65B]" />
              <p className="text-sm leading-6 text-white/46">
                Country intelligence identifies the operational pathway. Document-specific and receiving-authority requirements remain subject to Matter review.
              </p>
            </div>
          </div>
        </div>
      </div>

      {view === "directory" ? (
        <div className="mt-4">
          <ProgressiveCertaintyExplorer />
          <CountriesDirectoryInteractive />
          <div className="mx-auto mt-8 flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
            <p className="max-w-2xl text-sm leading-6 text-white/34">
              Need a Matter-specific review? Carry the destination into secure intake rather than relying on general country information alone.
            </p>
            <Link
              href="/intake?source=global-intelligence-directory"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#C6A65B]/30 px-5 text-sm font-medium text-[#C6A65B] transition-colors hover:border-[#C6A65B]/60 hover:text-[#E0C57D]"
            >
              Structure a Matter <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <LazyGlobalMap initialCountry={initialCountry} />
          <LazyRoutingIntelligence />
          <div className="mx-auto mt-8 flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
            <div className="flex items-center gap-3 text-sm text-white/36">
              <Globe2 className="h-4 w-4 text-[#C6A65B]/65" />
              Existing country authority pages remain available for deeper jurisdiction-specific detail.
            </div>
            <Link
              href="/countries"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/[0.1] px-5 text-sm font-medium text-white/60 transition-colors hover:border-[#C6A65B]/30 hover:text-[#C6A65B]"
            >
              Open Country Directory <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
