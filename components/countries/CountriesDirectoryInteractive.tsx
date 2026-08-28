"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Globe2 } from "lucide-react";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { DestinationIntelligenceCard } from "@/components/landing/destination-intelligence-card";

const FEATURED_SLUGS = [
  "italy",
  "spain",
  "germany",
  "portugal",
  "uae",
  "mexico",
  "brazil",
  "greece",
  "france",
  "united-kingdom",
  "australia",
  "canada",
] as const;

type DirectoryFilter = "featured" | "hague" | "non_hague";

const featured = FEATURED_SLUGS.map((slug) =>
  DESTINATIONS.find((destination) => destination.slug === slug),
).filter((destination): destination is Destination => Boolean(destination));

const FILTER_COPY: Record<
  DirectoryFilter,
  { title: string; description: string }
> = {
  featured: {
    title: "Priority corridors",
    description:
      "High-demand jurisdictions with structured document-routing intelligence.",
  },
  hague: {
    title: "Hague Convention destinations",
    description:
      "Current Hague-member destinations in the canonical routing registry. Matter-specific receiving-authority review still applies.",
  },
  non_hague: {
    title: "Non-member / consular-review destinations",
    description:
      "Destinations where apostille is not the controlling route and authentication, embassy, consular, or receiving-authority review may apply.",
  },
};

export function CountriesDirectoryInteractive() {
  const [filter, setFilter] = useState<DirectoryFilter>("featured");

  const destinations = useMemo(() => {
    if (filter === "featured") return featured;

    return [...DESTINATIONS]
      .filter((destination) =>
        filter === "hague" ? destination.hague : !destination.hague,
      )
      .sort((a, b) => b.demand - a.demand || a.name.localeCompare(b.name));
  }, [filter]);

  const copy = FILTER_COPY[filter];

  return (
    <>
      <section className="pb-4 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => setFilter("featured")}
              aria-pressed={filter === "featured"}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                filter === "featured"
                  ? "border-[#C6A55A]/55 bg-[#C6A55A]/10 text-[#E2C979]"
                  : "border-white/[0.08] bg-white/[0.02] text-[#8A8A8A] hover:border-[#C6A55A]/25 hover:text-[#C6A55A]"
              }`}
            >
              <Globe2 className="h-4 w-4" />
              Featured Corridors
            </button>

            <button
              type="button"
              onClick={() => setFilter("hague")}
              aria-pressed={filter === "hague"}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                filter === "hague"
                  ? "border-emerald-500/45 bg-emerald-500/[0.08] text-emerald-300"
                  : "border-white/[0.08] bg-white/[0.02] text-[#8A8A8A] hover:border-emerald-500/25 hover:text-emerald-300"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              Hague Convention member — apostille accepted
            </button>

            <button
              type="button"
              onClick={() => setFilter("non_hague")}
              aria-pressed={filter === "non_hague"}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                filter === "non_hague"
                  ? "border-amber-500/45 bg-amber-500/[0.08] text-amber-300"
                  : "border-white/[0.08] bg-white/[0.02] text-[#8A8A8A] hover:border-amber-500/25 hover:text-amber-300"
              }`}
            >
              <span className="h-4 w-4 rounded-full border border-current" />
              Non-member — consular legalization required
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-[#C6A55A]/12 bg-[#C6A55A]/[0.025] px-4 py-3 text-center">
            <p className="text-sm font-medium text-white/80">
              {copy.title} · {destinations.length} jurisdiction{destinations.length === 1 ? "" : "s"}
            </p>
            <p className="mx-auto mt-1 max-w-3xl text-xs leading-5 text-white/40">
              {copy.description}
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 px-4 sm:px-6" aria-live="polite">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {destinations.map((country) => (
            <DestinationIntelligenceCard
              key={country.slug}
              destination={country}
              variant="countryDirectory"
            />
          ))}
        </div>

        {destinations.length === 0 && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-10 text-center">
            <p className="text-base text-white/70">
              No jurisdictions are currently classified in this filter.
            </p>
            <p className="mt-2 text-sm text-white/40">
              The Milano Seal fails closed when current treaty or routing authority is not established.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
