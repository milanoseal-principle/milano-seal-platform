"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Circle, ShieldCheck } from "lucide-react";
import { DESTINATIONS } from "@/data/destinations";

const DOCUMENT_TYPES = [
  "Power of Attorney",
  "Affidavit",
  "Corporate Document",
  "Vital Record",
  "Court / Legal Record",
  "Other",
] as const;

const ORIGINS = ["Florida", "New York", "California", "Texas", "Other U.S. jurisdiction"] as const;
const SIGNER_LOCATIONS = ["United States", "Outside the United States", "Not applicable / issued record"] as const;

function Step({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
          complete
            ? "border-emerald-500/35 bg-emerald-500/[0.08] text-emerald-300"
            : "border-white/[0.09] bg-white/[0.02] text-white/22"
        }`}
      >
        {complete ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2.5 w-2.5" />}
      </span>
      <span className={complete ? "text-sm text-white/72" : "text-sm text-white/34"}>{label}</span>
    </div>
  );
}

export function ProgressiveCertaintyExplorer() {
  const [destination, setDestination] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [origin, setOrigin] = useState("");
  const [signerLocation, setSignerLocation] = useState("");

  const country = useMemo(
    () => DESTINATIONS.find((item) => item.slug === destination),
    [destination],
  );

  const completed = [destination, documentType, origin, signerLocation].filter(Boolean).length;
  const ready = completed === 4;

  const intakeHref = useMemo(() => {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (country?.name) params.set("country", country.name);
    if (documentType) params.set("document_type", documentType);
    if (origin) params.set("origin_state", origin);
    if (signerLocation) params.set("signer_location", signerLocation);
    const qs = params.toString();
    return qs ? `/intake?${qs}` : "/intake";
  }, [country?.name, destination, documentType, origin, signerLocation]);

  return (
    <section className="px-4 pb-10 sm:px-6" aria-labelledby="progressive-certainty-title">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-[var(--ms-gold)]/16 bg-[#08080A] shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="grid gap-px bg-white/[0.05] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-[#08080A] p-6 sm:p-8 lg:p-10">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--ms-gold)]/60">
              Progressive Certainty
            </p>
            <h2 id="progressive-certainty-title" className="mt-3 max-w-2xl font-serif text-3xl text-white sm:text-4xl">
              Structure the corridor before you structure the Matter.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/44 sm:text-base">
              Resolve the core execution inputs first. The result is not legal advice or a guarantee of acceptance; it is a controlled starting point for Milano operator review.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/42">Destination</span>
                <select value={destination} onChange={(e) => setDestination(e.target.value)} className="min-h-12 w-full rounded-xl border border-white/[0.08] bg-[#0D0D10] px-3 text-sm text-white outline-none focus:border-[var(--ms-gold)]/45">
                  <option value="">Select country</option>
                  {[...DESTINATIONS].sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
                    <option key={item.slug} value={item.slug}>{item.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/42">Document</span>
                <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="min-h-12 w-full rounded-xl border border-white/[0.08] bg-[#0D0D10] px-3 text-sm text-white outline-none focus:border-[var(--ms-gold)]/45">
                  <option value="">Select document class</option>
                  {DOCUMENT_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/42">U.S. origin</span>
                <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="min-h-12 w-full rounded-xl border border-white/[0.08] bg-[#0D0D10] px-3 text-sm text-white outline-none focus:border-[var(--ms-gold)]/45">
                  <option value="">Select origin</option>
                  {ORIGINS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/42">Signer posture</span>
                <select value={signerLocation} onChange={(e) => setSignerLocation(e.target.value)} className="min-h-12 w-full rounded-xl border border-white/[0.08] bg-[#0D0D10] px-3 text-sm text-white outline-none focus:border-[var(--ms-gold)]/45">
                  <option value="">Select signer location</option>
                  {SIGNER_LOCATIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </div>

          <aside className="bg-[#0A0A0D] p-6 sm:p-8 lg:p-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ms-gold)]/55">Route readiness</p>
                <p className="mt-2 text-2xl font-medium text-white">{completed} of 4 inputs resolved</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-full border ${ready ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300" : "border-[var(--ms-gold)]/20 bg-[var(--ms-gold)]/[0.04] text-[var(--ms-gold)]"}`}>
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
              <div className="h-full rounded-full bg-[var(--ms-gold)] transition-[width] duration-500" style={{ width: `${(completed / 4) * 100}%` }} />
            </div>

            <div className="mt-7 space-y-3.5">
              <Step label={country ? `${country.name} selected` : "Destination selected"} complete={Boolean(destination)} />
              <Step label={documentType || "Document class confirmed"} complete={Boolean(documentType)} />
              <Step label={origin ? `${origin} origin confirmed` : "Origin jurisdiction confirmed"} complete={Boolean(origin)} />
              <Step label={signerLocation || "Signer posture confirmed"} complete={Boolean(signerLocation)} />
            </div>

            {country && (
              <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.018] p-4">
                <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/38">Corridor intelligence</p>
                <p className="mt-2 text-sm text-white/70">{country.flag} {origin || "U.S. origin"} → {country.name}</p>
                <p className="mt-2 text-xs leading-5 text-white/40">
                  {country.hague ? "Hague-member destination. Apostille routing may apply to qualifying U.S. public documents." : "Non-Hague / consular-review destination. Authentication or consular requirements may apply."}
                </p>
              </div>
            )}

            <div className="mt-6">
              <p className={`font-mono text-[9px] uppercase tracking-[0.14em] ${ready ? "text-emerald-300" : "text-[var(--ms-gold)]/65"}`}>
                {ready ? "Ready for operator review" : `${4 - completed} input${4 - completed === 1 ? "" : "s"} remaining`}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/34">
                Receiving-authority, document wording, certificate, witness, translation, and final acceptance requirements remain matter-specific.
              </p>
            </div>

            <Link href={intakeHref} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--ms-gold)] px-5 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-[#050507] transition-colors hover:bg-[#D4B76A]">
              Structure This Matter
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
