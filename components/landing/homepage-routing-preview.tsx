"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { DestinationIntelligenceCard } from "@/components/landing/destination-intelligence-card";
import { buildHomeCorridor } from "@/lib/intelligence/homeCorridors";
import { MiniCorridorMapPreview } from "@/components/home/MiniCorridorMapPreview";
import { HomeShippingCorridorPanel } from "@/components/home/HomeShippingCorridorPanel";

const ROUTE_TYPE_LABEL: Record<string, string> = {
  apostille: "Hague Apostille",
  legalization: "Authentication / Consular",
  manual_review: "Authority Review",
  domestic: "Domestic Authentication",
};

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

  const routeChips = [
    {
      step: "01",
      label: "Destination",
      value: `${selected.flag} ${selected.name}`,
    },
    {
      step: "02",
      label: "Route",
      value: ROUTE_TYPE_LABEL[corridor.routeType] ?? "Receiving-Authority Review",
    },
    {
      step: "03",
      label: "Release",
      value: "Payment-Gated",
    },
  ];

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

      <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-6">
        {/* Route Command Header — replaces the duplicate top globe; the lower
            corridor map below is the primary spatial preview. */}
        <header className="animate-fade-up relative mb-7 overflow-hidden rounded-2xl border border-[var(--ms-gold)]/22 bg-[rgba(10,10,10,0.92)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.5),inset_0_0_44px_rgba(212,175,55,0.045)] sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px)",
              backgroundSize: "40px 40px, 40px 40px",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(212,175,55,0.14), transparent 70%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--ms-gold)]/70 to-transparent"
          />
          <span aria-hidden="true" className="ms-command-scan" />

          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.32em] text-[var(--ms-gold)]/65">
                Smart Intake Routing
              </p>
              <h2 className="font-serif text-3xl text-[#f5f1e8] md:text-4xl">
                Routing <em className="not-italic text-[var(--ms-gold)]">Preview</em>
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#f5f1e8]/62 md:text-[15px]">
                Choose a destination to preview the execution route, custody
                path, and receiving-authority review before intake.
              </p>
            </div>

            <div
              key={selected.slug}
              className="animate-fade-in grid w-full gap-2 sm:grid-cols-3 lg:w-auto lg:min-w-[420px]"
              role="list"
              aria-label="Routing dimensions for the selected corridor"
            >
              {routeChips.map((chip) => (
                <div
                  key={chip.step}
                  role="listitem"
                  className="rounded-xl border border-[var(--ms-gold)]/18 bg-[var(--ms-gold)]/[0.04] px-3.5 py-3"
                >
                  <span className="font-mono text-[8px] text-[var(--ms-gold)]/60">
                    {chip.step}
                  </span>
                  <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.18em] text-[#f5f1e8]/45">
                    {chip.label}
                  </p>
                  <p className="mt-1 truncate text-[13px] text-[#f5f1e8]/90">
                    {chip.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={corridor.intakeHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--ms-gold)] px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#050507] transition-colors hover:bg-[#D4B76A]"
            >
              Start Controlled Intake
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/map"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--ms-gold)]/30 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ms-gold)] transition-colors hover:border-[var(--ms-gold)]/60"
            >
              Open Full Intelligence Map
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <div className="animate-fade-up grid overflow-hidden rounded-2xl border border-white/[0.07] bg-[#08080A]/90 shadow-[0_30px_90px_rgba(0,0,0,0.45)] lg:grid-cols-[5fr_7fr]">
          <div className="space-y-5 border-b border-white/[0.06] p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <div>
              <p className="mb-4 font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--ms-gold)]/55">
                Destination Corridors
              </p>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                {PRIORITY_DESTINATIONS.map((destination) => {
                  const active = destination.slug === selected.slug;
                  return (
                    <button
                      key={destination.slug}
                      type="button"
                      onClick={() => setSelected(destination)}
                      className={`min-h-12 rounded-lg border px-3 py-2 text-left transition-all duration-300 ${
                        active
                          ? "border-[var(--ms-gold)]/60 bg-[var(--ms-gold)]/[0.1] text-white shadow-[0_0_0_1px_rgba(212,175,55,0.25),0_8px_24px_rgba(212,175,55,0.08)]"
                          : "border-white/[0.06] bg-white/[0.015] text-white/45 hover:-translate-y-px hover:border-[var(--ms-gold)]/25 hover:text-white/70"
                      }`}
                      aria-pressed={active}
                      aria-label={`Preview routing for ${destination.name}`}
                    >
                      <span className="mr-2">{destination.flag}</span>
                      <span className="text-xs">{destination.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <MiniCorridorMapPreview corridor={corridor} />
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            <DestinationIntelligenceCard
              key={selected.slug}
              destination={selected}
              variant="homepagePreview"
            />
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <HomeShippingCorridorPanel corridor={corridor} />

          <div className="rounded-2xl border border-white/[0.07] bg-[#08080A]/90 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={corridor.intakeHref}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--ms-gold)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#050507] transition-colors hover:bg-[#D4B76A]"
              >
                Start Controlled Intake
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href={`/countries/${corridor.slug}`}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--ms-gold)]/30 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ms-gold)] transition-colors hover:border-[var(--ms-gold)]/60"
              >
                View Country Requirements
              </Link>
            </div>
            <p className="mt-3 text-center text-[10px] leading-5 text-white/35">
              Final routing is confirmed after document review, payment
              confirmation, execution, and apostille requirements are validated.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
