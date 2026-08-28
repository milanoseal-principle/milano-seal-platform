"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  Globe2,
  Scale,
  ShieldCheck,
} from "lucide-react";
import {
  HAGUE_PROFESSIONAL_DESTINATIONS,
  PROFESSIONAL_DOCUMENT_OPTIONS,
  buildAttorneyJourney,
  type OriginPosture,
  type ProfessionalDocumentClass,
  type SignerPosture,
} from "@/lib/professional/universal-attorney-journey";

const ORIGINS: Array<{ value: OriginPosture; label: string }> = [
  { value: "florida", label: "Florida" },
  { value: "other_us_state", label: "Another U.S. state / territory" },
  { value: "federal", label: "U.S. federal authority" },
  { value: "unknown", label: "Not sure yet" },
];

const SIGNERS: Array<{ value: SignerPosture; label: string }> = [
  { value: "us", label: "Signer in the United States" },
  { value: "international", label: "Signer outside the United States" },
  { value: "multiple", label: "Multiple signers / locations" },
  { value: "not_applicable", label: "No signer / public record" },
  { value: "unknown", label: "Not sure yet" },
];

const STATUS_COPY = {
  MISSING_INFORMATION: {
    label: "MISSING INFORMATION",
    body: "Add the core routing facts so the initial execution pathway can be structured.",
  },
  ROUTE_IDENTIFIED: {
    label: "ROUTE IDENTIFIED",
    body: "The destination pathway is taking shape. Complete the remaining facts before operator review.",
  },
  REVIEW_REQUIRED: {
    label: "REVIEW REQUIRED",
    body: "The initial U.S. route is structured. Milano operator review is required before execution is authorized.",
  },
  READY_FOR_INTAKE: {
    label: "READY FOR INTAKE",
    body: "Core route facts are structured and can be carried into secure professional intake for operator review.",
  },
} as const;

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-white/38">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-12 w-full appearance-none rounded-xl border border-white/[0.08] bg-[#0A0A0C] px-4 pr-10 text-sm text-white/80 outline-none transition-colors focus:border-[#C6A55A]/45"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
      </div>
    </label>
  );
}

export function UniversalAttorneyJourney() {
  const [destinationSlug, setDestinationSlug] = useState("");
  const [documentClass, setDocumentClass] = useState<ProfessionalDocumentClass | "">("");
  const [origin, setOrigin] = useState<OriginPosture | "">("");
  const [signer, setSigner] = useState<SignerPosture | "">("");
  const [receivingAuthority, setReceivingAuthority] = useState("");

  const journey = useMemo(
    () =>
      buildAttorneyJourney({
        destinationSlug: destinationSlug || undefined,
        documentClass: documentClass || undefined,
        origin: origin || undefined,
        signer: signer || undefined,
        receivingAuthority,
      }),
    [destinationSlug, documentClass, origin, signer, receivingAuthority],
  );

  const status = STATUS_COPY[journey.status];

  return (
    <section className="border-y border-white/[0.055] bg-[#080809] px-4 py-16 sm:px-6 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#C6A55A]/65">
              Universal Professional Journey
            </p>
            <h2 className="mt-4 max-w-xl font-serif text-3xl leading-tight text-white sm:text-4xl md:text-5xl">
              Start with the country. <em className="text-[#C6A55A]">Structure the U.S. side.</em>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/48">
              One professional workflow applies across the canonical Hague destination registry. The interface stays consistent; jurisdiction, document, authority, and receiving requirements change underneath it.
            </p>

            <div className="mt-8 rounded-2xl border border-[#C6A55A]/14 bg-[#C6A55A]/[0.025] p-5">
              <div className="flex items-start gap-3">
                <Scale className="mt-0.5 h-5 w-5 shrink-0 text-[#C6A55A]" />
                <div>
                  <p className="font-serif text-xl text-white">Professional boundary</p>
                  <p className="mt-2 text-sm leading-6 text-white/46">
                    The Milano Seal coordinates execution and authentication logistics. Counsel and the appropriate professional advisor retain legal advice, legal strategy, document substance, and receiving-authority judgment.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/32">
                Progressive certainty
              </p>
              <div className="mt-4 space-y-3">
                {["Destination", "Document", "Origin", "Signer posture"].map((label, index) => {
                  const complete = index < journey.completed;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${complete ? "border-[#C6A55A]/45 bg-[#C6A55A]/10 text-[#C6A55A]" : "border-white/[0.08] text-white/18"}`}>
                        {complete ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                      </span>
                      <span className={complete ? "text-sm text-white/70" : "text-sm text-white/28"}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/[0.075] bg-[#050507] shadow-[0_28px_90px_rgba(0,0,0,0.4)]">
            <div className="border-b border-white/[0.06] px-5 py-5 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#C6A55A]/60">Professional Matter Pre-Flight</p>
                  <p className="mt-1 text-sm text-white/48">{HAGUE_PROFESSIONAL_DESTINATIONS.length} canonical Hague destinations currently available in the routing registry</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.035] px-3 py-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300/75" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-emerald-300/75">Operator review retained</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
              <SelectField label="Where will the document be used?" value={destinationSlug} onChange={setDestinationSlug}>
                <option value="">Select destination</option>
                {HAGUE_PROFESSIONAL_DESTINATIONS.map((destination) => (
                  <option key={destination.slug} value={destination.slug}>{destination.name}</option>
                ))}
              </SelectField>

              <SelectField label="What are you coordinating?" value={documentClass} onChange={(value) => setDocumentClass(value as ProfessionalDocumentClass | "")}>
                <option value="">Select document class</option>
                {PROFESSIONAL_DOCUMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectField>

              <SelectField label="U.S. origin / issuing authority" value={origin} onChange={(value) => setOrigin(value as OriginPosture | "")}>
                <option value="">Select origin</option>
                {ORIGINS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectField>

              <SelectField label="Signer posture" value={signer} onChange={(value) => setSigner(value as SignerPosture | "")}>
                <option value="">Select signer posture</option>
                {SIGNERS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectField>

              <label className="block sm:col-span-2">
                <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-white/38">
                  Receiving authority — if known
                </span>
                <input
                  value={receivingAuthority}
                  onChange={(event) => setReceivingAuthority(event.target.value)}
                  placeholder="Court, notary, registry, consulate, municipality, bank, agency…"
                  className="min-h-12 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0C] px-4 text-sm text-white/80 outline-none placeholder:text-white/20 focus:border-[#C6A55A]/45"
                />
              </label>
            </div>

            <div className="border-t border-white/[0.06] bg-white/[0.012] p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.17em] text-[#C6A55A]/55">Route readiness</p>
                  <h3 className="mt-2 font-serif text-2xl text-white">{status.label}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/42">{status.body}</p>
                </div>
                <div className="rounded-full border border-white/[0.07] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-white/38">
                  {journey.completed} / {journey.total} core facts
                </div>
              </div>

              {journey.destination && (
                <div className="mt-6 rounded-2xl border border-[#C6A55A]/14 bg-[#C6A55A]/[0.02] p-5">
                  <div className="flex items-center gap-2 text-[#C6A55A]">
                    <Globe2 className="h-4 w-4" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.16em]">{journey.routeLabel}</span>
                  </div>
                  <div className="mt-4 space-y-0">
                    {journey.routeSteps.map((step, index) => (
                      <div key={`${step}-${index}`} className="relative flex gap-4 pb-5 last:pb-0">
                        {index < journey.routeSteps.length - 1 && <span className="absolute left-[7px] top-5 h-[calc(100%-8px)] w-px bg-[#C6A55A]/16" />}
                        <span className="relative mt-1.5 h-4 w-4 shrink-0 rounded-full border border-[#C6A55A]/35 bg-[#080809]" />
                        <div>
                          <p className="text-sm text-white/70">{step}</p>
                          {index === 2 && <p className="mt-1 text-xs leading-5 text-white/30">Competent authority depends on document origin and document class.</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                  <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/34">Counsel / advisor retains</p>
                  <div className="mt-3 space-y-2">
                    {journey.attorneyRetains.map((item) => (
                      <div key={item} className="flex gap-2 text-xs leading-5 text-white/48"><span className="text-white/20">—</span>{item}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#C6A55A]/12 bg-[#C6A55A]/[0.018] p-4">
                  <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#C6A55A]/60">Milano coordinates</p>
                  <div className="mt-3 space-y-2">
                    {journey.milanoCoordinates.map((item) => (
                      <div key={item} className="flex gap-2 text-xs leading-5 text-white/55"><Check className="mt-0.5 h-3 w-3 shrink-0 text-[#C6A55A]/70" />{item}</div>
                    ))}
                  </div>
                </div>
              </div>

              {journey.reviewRequired.length > 0 && (
                <div className="mt-5 rounded-xl border border-amber-300/10 bg-amber-300/[0.025] px-4 py-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-amber-200/55">Still requires confirmation</p>
                  <p className="mt-2 text-xs leading-5 text-white/38">{journey.reviewRequired.join(" · ")}</p>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link
                  href={journey.intakeHref}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#C6A55A] px-5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#050507] transition-colors hover:bg-[#D4B76A]"
                >
                  Structure This Matter <ArrowRight className="h-4 w-4" />
                </Link>
                {journey.destination && (
                  <Link
                    href={`/countries/${journey.destination.slug}`}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/[0.08] px-5 text-[10px] uppercase tracking-[0.11em] text-white/55 transition-colors hover:border-[#C6A55A]/30 hover:text-[#C6A55A]"
                  >
                    Country Intelligence
                  </Link>
                )}
              </div>

              <p className="mt-4 text-[11px] leading-5 text-white/25">
                Route information is operational guidance, not legal advice or a guarantee of apostille, legalization, or receiving-authority acceptance. Matter-specific review remains required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
