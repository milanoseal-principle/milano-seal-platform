"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Globe2,
  Landmark,
  Languages,
  PackageCheck,
  Route,
  Users,
} from "lucide-react";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { buildDestinationIntelligence } from "@/components/landing/destination-intelligence-card";
import { getPublicCountryExecutionIntelligence } from "@/data/public-country-intelligence";

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
    title: "Hague / apostille-route review",
    description:
      "Current Hague-route destinations in the canonical routing registry. Document origin and matter-specific receiving-authority review still control the applicable path.",
  },
  non_hague: {
    title: "Non-Hague / authentication review",
    description:
      "Destinations where apostille is not the controlling route and authentication, embassy, consular, or receiving-authority review may apply.",
  },
};

function routeSignals(destination: Destination) {
  const path = destination.executionPath.join(" ").toLowerCase();
  const signals: Array<{
    label: string;
    Icon: typeof Languages;
    active: boolean;
  }> = [
    {
      label: /translation/.test(path) ? "Translation" : "Language review",
      Icon: Languages,
      active: /translation/.test(path),
    },
    {
      label: /witness/.test(path) ? "Witnesses" : "Signer review",
      Icon: Users,
      active: /witness/.test(path),
    },
    {
      label: destination.hague ? "Apostille review" : "Authentication",
      Icon: Landmark,
      active: true,
    },
    {
      label: /courier|delivery|release/.test(path) ? "Courier" : "Release",
      Icon: PackageCheck,
      active: /courier|delivery|release/.test(path),
    },
  ];

  return signals;
}

function CountryDirectoryDossier({ country }: { country: Destination }) {
  const intelligence = buildDestinationIntelligence(country);
  const compliance = getPublicCountryExecutionIntelligence(
    country.slug,
    country.name,
  );
  const signals = routeSignals(country);
  const routeSteps = country.executionPath.slice(0, 4);
  const matterTypes = Array.from(
    new Set(
      country.note
        .split("·")
        .map((item) => item.trim())
        .filter(Boolean)
        .concat(country.commonDocuments),
    ),
  ).slice(0, 4);

  const intakeHref = `/intake?destination=${encodeURIComponent(country.slug)}&country=${encodeURIComponent(country.name)}`;

  return (
    <article
      data-critical-card=""
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-[#0B0B0D] p-5 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 motion-reduce:transform-none ${
        country.hague
          ? "border-white/[0.08] hover:border-emerald-500/25 hover:shadow-[0_24px_70px_rgba(0,0,0,0.45),inset_0_0_36px_rgba(16,185,129,0.025)]"
          : "border-amber-500/15 hover:border-amber-500/32 hover:shadow-[0_24px_70px_rgba(0,0,0,0.48),inset_0_0_36px_rgba(245,158,11,0.035)]"
      }`}
      aria-label={`${country.name} execution dossier`}
    >
      <div
        className={`pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${
          country.hague ? "via-emerald-400/50" : "via-amber-400/55"
        }`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-3xl" aria-hidden="true">
            {country.flag}
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--ms-gold)]/48">
              Jurisdiction dossier
            </p>
            <h3 className="mt-1 font-serif text-2xl leading-tight text-white">
              {country.name}
            </h3>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[7px] uppercase tracking-[0.12em] ${
            country.hague
              ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300/85"
              : "border-amber-500/25 bg-amber-500/[0.07] text-amber-300/90"
          }`}
        >
          {country.hague ? "Hague route" : "Auth review"}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.018] p-3.5">
        <div className="flex items-center gap-2">
          <Route className="h-3.5 w-3.5 text-[var(--ms-gold)]" />
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--ms-gold)]/70">
            Controlling route
          </span>
        </div>
        <p className="mt-2 text-sm font-medium leading-5 text-white/82">
          {intelligence.routeLabel}
        </p>
        <p className="mt-1 text-[11px] leading-5 text-white/42">
          {country.hagueStatus}
        </p>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-[var(--ms-gold)]/75" />
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/38">
            Common matters
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {matterTypes.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/[0.07] bg-white/[0.018] px-2.5 py-1 text-[9px] text-white/56"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/38">
          Route checkpoints
        </p>
        <div className="mt-2 space-y-1.5">
          {routeSteps.map((step, index) => (
            <div
              key={`${country.slug}-${step}`}
              className="flex items-start gap-2 rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2"
            >
              <span className="mt-0.5 font-mono text-[8px] text-[var(--ms-gold)]/60">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[10px] leading-4 text-white/52">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {signals.map(({ label, Icon, active }) => (
          <div
            key={label}
            className={`rounded-lg border p-2 text-center ${
              active
                ? "border-[var(--ms-gold)]/14 bg-[var(--ms-gold)]/[0.025]"
                : "border-white/[0.045] bg-white/[0.01]"
            }`}
          >
            <Icon
              className={`mx-auto h-3.5 w-3.5 ${
                active ? "text-[var(--ms-gold)]/75" : "text-white/18"
              }`}
            />
            <p className={`mt-1 text-[7px] leading-3 ${active ? "text-white/48" : "text-white/24"}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-white/[0.055] pt-3">
        <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-[var(--ms-gold)]/45">
          Compliance gate
        </p>
        <p className="mt-1 line-clamp-3 text-[9px] leading-4 text-white/36">
          {compliance.complianceBoundary}
        </p>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
        <Link
          href={intakeHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--ms-gold)] px-3 py-2.5 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-[#050507] transition-colors hover:bg-[#D4B76A]"
        >
          Begin Intake
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          href={`/countries/${country.slug}`}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--ms-gold)]/20 px-3 py-2.5 text-center font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--ms-gold)]/72 transition-colors hover:border-[var(--ms-gold)]/45 hover:text-[var(--ms-gold)]"
        >
          Full Requirements
        </Link>
      </div>
    </article>
  );
}

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
              Hague / apostille-route review
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
              Non-Hague / authentication review
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
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((country) => (
            <CountryDirectoryDossier key={country.slug} country={country} />
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
