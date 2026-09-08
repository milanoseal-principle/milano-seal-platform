"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CircleDot,
  Clock3,
  FileCheck2,
  FileText,
  Globe2,
  HeartHandshake,
  Languages,
  Landmark,
  MapPinned,
  Plane,
  Scale,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRoundCheck,
} from "lucide-react";
import flagStyles from "./FlagTakeover.module.css";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { getCountryExecutionIntelligence } from "@/data/country-execution-intelligence";

const GlobalIntelMapInteractive = dynamic(
  () =>
    import("@/components/landing/global-intel-map-interactive").then(
      (module) => module.GlobalIntelMapInteractive,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[520px] items-center justify-center bg-[#070808] text-center">
        <div>
          <div className="mx-auto h-10 w-10 rounded-full border border-[#C6A65B]/35 bg-[#C6A65B]/[0.04] motion-safe:animate-pulse" />
          <p className="mt-4 font-serif text-xl text-white/80">Preparing live route intelligence</p>
        </div>
      </div>
    ),
  },
);

type DocumentKey =
  | "power-of-attorney"
  | "name-discrepancy"
  | "fbi-background"
  | "birth-certificate"
  | "corporate-resolution"
  | "general-affidavit"
  | "marriage-certificate"
  | "estate-inheritance";

const DOCUMENTS: Array<{
  key: DocumentKey;
  title: string;
  subtitle: string;
  icon: typeof FileText;
}> = [
  { key: "power-of-attorney", title: "Power of Attorney", subtitle: "Legal authorization", icon: ScrollText },
  { key: "name-discrepancy", title: "Name Discrepancy Affidavit", subtitle: "Identity verification", icon: FileCheck2 },
  { key: "fbi-background", title: "FBI Background Check", subtitle: "Criminal history", icon: ShieldCheck },
  { key: "birth-certificate", title: "Birth Certificate", subtitle: "Identity document", icon: FileText },
  { key: "corporate-resolution", title: "Corporate Resolution", subtitle: "Business authorization", icon: Building2 },
  { key: "general-affidavit", title: "General Affidavit", subtitle: "Sworn statement", icon: Scale },
  { key: "marriage-certificate", title: "Marriage Certificate", subtitle: "Civil status", icon: HeartHandshake },
  { key: "estate-inheritance", title: "Estate / Inheritance", subtitle: "Succession documentation", icon: Landmark },
];

const COUNTRY_SLUGS = ["italy", "spain", "greece", "argentina", "colombia"] as const;

function destinationForSlug(slug: string): Destination | null {
  return DESTINATIONS.find((destination) => destination.slug === slug) ?? null;
}

function documentLabel(key: DocumentKey) {
  return DOCUMENTS.find((document) => document.key === key)?.title ?? "Document";
}

function routeDistance(slug: string) {
  const distances: Record<string, string> = {
    italy: "4,761 mi",
    spain: "4,386 mi",
    greece: "5,762 mi",
    argentina: "4,373 mi",
    colombia: "1,696 mi",
  };
  return distances[slug] ?? "International";
}

function routeTimeline(slug: string) {
  const timelines: Record<string, string> = {
    italy: "10–14 days",
    spain: "10–14 days",
    greece: "10–15 days",
    argentina: "12–18 days",
    colombia: "10–15 days",
  };
  return timelines[slug] ?? "Authority dependent";
}

export function ExecutionIntelligenceWorkspace({ initialCountry }: { initialCountry?: string }) {
  const initialSlug = COUNTRY_SLUGS.includes(initialCountry as (typeof COUNTRY_SLUGS)[number])
    ? (initialCountry as (typeof COUNTRY_SLUGS)[number])
    : "italy";

  const [documentKey, setDocumentKey] = useState<DocumentKey>("birth-certificate");
  const [countrySlug, setCountrySlug] = useState<string>(initialSlug);

  const selectedDestination = useMemo(() => destinationForSlug(countrySlug), [countrySlug]);
  const intel = useMemo(() => getCountryExecutionIntelligence(countrySlug), [countrySlug]);
  const intakeHref = `/intake?source=execution-intelligence&document=${encodeURIComponent(documentKey)}&country=${encodeURIComponent(countrySlug)}`;

  // Cinematic destination flag-takeover atmosphere over the real Leaflet map.
  // Presentational only — replays the v2 "country enters the room" wash when the
  // destination changes; never affects map geometry, destination state, or data.
  const flagWashRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = flagWashRef.current;
    if (!el) return;
    el.classList.remove(flagStyles.settled);
    el.classList.remove(flagStyles.takeover);
    // Force reflow so the animation restarts on each destination change.
    void el.offsetWidth;
    el.classList.add(flagStyles.takeover);
    const timer = window.setTimeout(() => {
      el.classList.remove(flagStyles.takeover);
      el.classList.add(flagStyles.settled);
    }, 4850);
    return () => window.clearTimeout(timer);
  }, [countrySlug]);

  const custodySteps = useMemo(() => {
    const authentication = intel.routeType === "hague_apostille" ? "Apostille" : "Authentication";
    return [
      { n: 1, title: "Florida Origin", detail: "Document collection" },
      { n: 2, title: "RON / Notarial Execution", detail: "Notarization (FL)" },
      { n: 3, title: "Florida Department of State", detail: authentication },
      { n: 4, title: "Secure Courier Release", detail: "DHL / FedEx / UPS" },
      { n: 5, title: `${intel.displayName} Receiving Authority`, detail: "Client counsel / authority" },
    ];
  }, [intel]);

  const intelligenceChecks = useMemo(() => {
    const routeCheck =
      intel.routeType === "hague_apostille"
        ? "Apostille route review (Hague Convention)"
        : "Authentication / consular route review";
    return [
      "Notarization with Florida-commissioned notary",
      routeCheck,
      "Receiving-authority acceptance review",
      `Translation review (${intel.translationRisk})`,
      "Courier release / final delivery",
    ];
  }, [intel]);

  return (
    <div className="relative overflow-hidden bg-[#050706] text-[#F4F1E8]">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 76% 7%, rgba(205,166,75,0.13), transparent 23%), radial-gradient(circle at 13% 54%, rgba(205,166,75,0.055), transparent 24%), linear-gradient(180deg,#050706 0%,#070908 48%,#050706 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[1500px] px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden border-b border-[#C6A65B]/30 pb-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#C6A65B]">
                1 document / corridor intelligence
              </p>
              <h1 className="mt-3 font-serif text-4xl leading-[1.02] tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl">
                Execution Intelligence <em className="font-normal text-[#E0B44F]">Workspace</em>
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/48 sm:text-base">
                Choose what you are executing, then choose the destination. Document profile, corridor atlas,
                jurisdiction intelligence, custody path, and intake route operate as one synchronized module.
              </p>
            </div>
            <div className="hidden justify-self-end lg:block">
              <div className="rounded-full border border-[#C6A65B]/25 bg-black/25 px-5 py-2 text-right">
                <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/36">Documents without borders™</p>
                <p className="mt-1 text-sm italic text-[#D9B45B]">Same document. A greater horizon.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-2xl border border-[#A77D2E]/55 bg-[#080A09]/92 shadow-[0_18px_70px_rgba(0,0,0,0.42)]">
          <div className="border-b border-[#A77D2E]/42 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#D3A641]">01 · What are you executing?</p>
                <p className="mt-1 text-xs text-white/34">Document selection controls the priority destination set below.</p>
              </div>
              <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#A77D2E]/55 bg-[#C6A65B]/[0.04] px-4 text-[11px] text-[#DAB35B]">
                <BadgeCheck className="h-4 w-4" /> Citizenship Support Bundle
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {DOCUMENTS.map((document) => {
                const Icon = document.icon;
                const selected = documentKey === document.key;
                return (
                  <button
                    key={document.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setDocumentKey(document.key)}
                    className={`group min-h-[84px] rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                      selected
                        ? "border-[#D3A641] bg-[#D3A641]/[0.09] shadow-[0_0_28px_rgba(211,166,65,0.12)]"
                        : "border-white/[0.09] bg-white/[0.012] hover:border-[#C6A65B]/35 hover:bg-[#C6A65B]/[0.03]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${selected ? "text-[#E0B44F]" : "text-[#C6A65B]"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white/84">{document.title}</p>
                        <p className="mt-1 text-[11px] text-white/31">{document.subtitle}</p>
                      </div>
                      {selected ? <Check className="h-4 w-4 text-[#E0B44F]" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-b border-[#A77D2E]/42 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#D3A641]">02 · Choose destination corridor</p>
                <p className="mt-1 text-xs text-white/34">Select a destination to update jurisdiction requirements, route posture, and timeline.</p>
              </div>
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/34">
                <Globe2 className="h-4 w-4 text-[#C6A65B]" /> Country intelligence updates in real time
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {COUNTRY_SLUGS.map((slug) => {
                const destination = destinationForSlug(slug);
                if (!destination) return null;
                const selected = countrySlug === slug;
                return (
                  <button
                    key={slug}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCountrySlug(slug)}
                    className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 text-left transition-all ${
                      selected
                        ? "border-[#D3A641] bg-[#D3A641]/[0.085] shadow-[0_0_24px_rgba(211,166,65,0.12)]"
                        : "border-white/[0.09] bg-white/[0.012] hover:border-[#C6A65B]/35"
                    }`}
                  >
                    <span className="text-lg">{destination.flag}</span>
                    <span className="text-sm text-white/80">{destination.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2 p-2 lg:grid-cols-[minmax(0,2.15fr)_minmax(320px,0.85fr)]">
            <section className="overflow-hidden rounded-xl border border-[#A77D2E]/55 bg-[#050706]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#A77D2E]/30 px-4 py-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#D3A641]">03 · Execution corridor</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/28">Global execution network</p>
                </div>
                <div className="inline-flex rounded-full border border-[#A77D2E]/35 bg-black/35 p-1 text-[9px] uppercase tracking-[0.12em] text-white/40">
                  <span className="rounded-full bg-[#C6A65B] px-4 py-1.5 text-black">Map</span>
                  <span className="px-4 py-1.5">Live</span>
                  <span className="px-4 py-1.5">Route</span>
                </div>
              </div>

              <div className="relative min-h-[540px] overflow-hidden">
                <GlobalIntelMapInteractive
                  selectedDest={selectedDestination}
                  onSelect={(destination) => destination && setCountrySlug(destination.slug)}
                />

                {/* Cinematic destination flag-takeover atmosphere (v2). Layered
                    over the real Leaflet map; pointer-events:none keeps the map
                    fully interactive. */}
                <div
                  ref={flagWashRef}
                  aria-hidden="true"
                  className={`${flagStyles.wash} ${flagStyles[countrySlug] ?? flagStyles.italy}`}
                />

                <div className="pointer-events-none absolute bottom-4 left-4 z-[1100] w-[250px] rounded-xl border border-white/[0.1] bg-[#050706]/88 p-4 backdrop-blur-md">
                  <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#D3A641]">
                    <CircleDot className="h-3.5 w-3.5" /> Live execution route
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                    <span>🇺🇸 Florida</span><ArrowRight className="h-3 w-3 text-[#D3A641]"/><span>{intel.flag} {intel.displayName}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-3">
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/28">Distance</p>
                      <p className="mt-1 text-sm text-[#D9B45B]">{routeDistance(countrySlug)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/28">Est. timeline</p>
                      <p className="mt-1 text-sm text-[#D9B45B]">{routeTimeline(countrySlug)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="rounded-xl border border-[#A77D2E]/55 bg-[#080A09] p-4 sm:p-5">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.018] p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.19em] text-[#D3A641]">Selected matter profile</p>
                <div className="mt-3 flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 text-[#C6A65B]" />
                  <div>
                    <p className="text-sm text-white/84">{documentLabel(documentKey)} · {intel.displayName}</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/31">Destination routing stays jurisdiction-specific; document acceptance is receiving-authority dependent.</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-[#A77D2E]/55 bg-[#070908] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{intel.flag}</span>
                    <h2 className="font-serif text-3xl text-white">{intel.displayName}</h2>
                  </div>
                  <span className="rounded-full border border-emerald-400/35 bg-emerald-400/[0.06] px-3 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-emerald-300">
                    {intel.statusPill}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 border-b border-[#A77D2E]/25 pb-4 font-mono text-[9px] uppercase tracking-[0.18em] text-[#D3A641]">
                  <Languages className="h-4 w-4" /> Translation review
                </div>

                <div className="mt-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#D3A641]">Execution intelligence</p>
                  <p className="mt-3 text-sm leading-6 text-white/52">{intel.authoritySummary}</p>
                </div>

                <div className="mt-5 space-y-3">
                  {intelligenceChecks.map((check) => (
                    <div key={check} className="flex items-start gap-3 text-xs leading-5 text-white/58">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#C6A65B]" />
                      <span>{check}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2">
                  <Link
                    href={intakeHref}
                    className="group flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E4B84F] to-[#F2CE77] px-5 text-sm font-semibold text-[#0A0A08] transition-transform hover:-translate-y-0.5"
                  >
                    Begin Secure Intake <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href={`/apostille/${countrySlug}`}
                    className="flex min-h-11 items-center justify-center rounded-xl border border-[#A77D2E]/55 text-xs font-medium text-[#DAB35B] hover:border-[#D3A641]"
                  >
                    View Country Requirements
                  </Link>
                </div>
              </div>
            </aside>
          </div>

          <section className="border-t border-[#A77D2E]/42 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#D3A641]">04 · Custody path & execution flow</p>
                <p className="mt-1 text-xs text-white/34">The route, custody, compliance, and CTAs below belong to the active document + jurisdiction state.</p>
              </div>
              <div className="flex flex-wrap items-center gap-5 text-[9px] uppercase tracking-[0.12em] text-white/38">
                <span className="flex items-center gap-2"><span className="text-lg">{intel.flag}</span> Jurisdiction: {intel.displayName}</span>
                <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-400"/> {intel.statusPill}</span>
                <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#C6A65B]"/> {routeTimeline(countrySlug)}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-2 lg:grid-cols-5">
              {custodySteps.map((step, index) => (
                <div key={step.n} className="relative rounded-xl border border-[#A77D2E]/48 bg-white/[0.012] px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D3A641]/65 text-xs text-[#E0B44F]">{step.n}</span>
                    <div>
                      <p className="text-xs text-white/72">{step.title}</p>
                      <p className="mt-1 text-[10px] text-white/32">{step.detail}</p>
                    </div>
                  </div>
                  {index < custodySteps.length - 1 ? <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-[#D3A641] lg:block" /> : null}
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Origin", "Florida, United States", MapPinned],
                ["State Authority", "Florida Department of State", Landmark],
                ["Authentication", intel.routeType === "hague_apostille" ? "Hague Apostille" : "Authority Review", ShieldCheck],
                ["Courier Mode", "DHL / FedEx / UPS", Truck],
                ["Release Trigger", "Paid & Released", UserRoundCheck],
              ].map(([label, value, Icon]) => {
                const IconComponent = Icon as typeof Globe2;
                return (
                  <div key={label as string} className="bg-[#080A09] px-4 py-3">
                    <p className="font-mono text-[8px] uppercase tracking-[0.17em] text-[#D3A641]/70">{label as string}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/55">
                      <IconComponent className="h-3.5 w-3.5 text-[#C6A65B]" /> {value as string}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {["Receiving Authority Requirements", "Courier Selection Pending", "Translation Review", `Final Acceptance (${intel.displayName})`].map((item) => (
                <span key={item} className="rounded-full border border-[#A77D2E]/48 px-4 py-2 text-[10px] text-[#D6B05B]">{item}</span>
              ))}
              <p className="ml-auto max-w-md text-right text-[10px] leading-4 text-white/28">
                This preview shows the expected custody path before intake. Final routing is confirmed after document review and payment.
              </p>
            </div>
          </section>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#A77D2E]/25 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#A77D2E]/50 bg-[#C6A65B]/[0.05]">
              <Plane className="h-4 w-4 text-[#D3A641]" />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#D3A641]">The Milano Seal</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/28">Global document execution</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-white/30">
            <ShieldCheck className="h-4 w-4 text-[#C6A65B]" /> Secure · Compliant · Global · Always Forward
          </div>
        </div>
      </div>
    </div>
  );
}
