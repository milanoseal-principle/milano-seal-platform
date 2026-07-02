import Link from "next/link";
import type { Metadata } from "next";
import { getExecutionPathCopy, getPublicQuoteFactors, getServiceComponents } from "@/lib/command-center/pricingIntelligence";

export const metadata: Metadata = {
  title: "Execution Quote — The Milano Seal™",
  description: "Request an Execution Quote for U.S. Document Execution for International Use, apostille coordination, eligible RON review, witness needs, and final packet requirements.",
};

const executionPaths = ["Remote Online Notarization for eligible documents", "Florida Mobile Notary Coordination", "Apostille Coordination", "International Courier Release"];
const reviewedDetails = ["document type", "origin jurisdiction", "signer location", "destination country", "urgency", "apostille needs", "witness needs", "final packet requirements"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-amber-300/15 bg-black/50 p-6"><h2 className="text-xl font-semibold text-amber-100">{title}</h2><div className="mt-4 text-sm leading-7 text-stone-300">{children}</div></section>;
}

export default function PricingPage() {
  const factors = getPublicQuoteFactors();
  const components = getServiceComponents();
  const copy = getExecutionPathCopy();
  return (
    <main className="min-h-screen bg-black px-4 py-16 text-stone-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="rounded-[2.5rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.22),transparent_42%),linear-gradient(135deg,#050505,#15100a)] p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.36em] text-amber-200/70">Execution Quote</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-white md:text-6xl">U.S. Document Execution for International Use</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">Your quote is built from document type, origin jurisdiction, signer location, destination country, urgency, apostille needs, witness needs, and final packet requirements.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/intake" className="min-h-11 rounded-full bg-amber-200 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-black">Begin Secure Intake</Link>
            <Link href="/secure-portal" className="min-h-11 rounded-full border border-amber-300/30 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-amber-100">Secure Portal</Link>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="How Your Quote Is Built"><ul>{factors.map((factor) => <li key={factor}>• {factor}</li>)}</ul></Section>
          <Section title="Execution Paths"><ul>{executionPaths.map((path) => <li key={path}>• {path}</li>)}</ul></Section>
          <Section title="What May Be Included"><ul>{components.map((component) => <li key={component}>• {component}</li>)}</ul></Section>
          <Section title="Payment-Gated Execution"><p>Execution is not scheduled until the quote is reviewed, accepted, and payment is confirmed. This protects document custody, operator time, and final packet release.</p></Section>
          <Section title="What Happens After Intake"><ul>{copy.map((line) => <li key={line}>• {line}</li>)}</ul></Section>
          <Section title="Details Reviewed Before Quote"><ul>{reviewedDetails.map((detail) => <li key={detail}>• {detail}</li>)}</ul></Section>
        </div>

        <section className="rounded-[2rem] border border-amber-300/20 bg-stone-950 p-8 text-center">
          <h2 className="text-2xl font-semibold text-amber-100">Final CTA</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-stone-300">Final acceptance remains subject to the receiving authority. Start with Secure Records Intake so the document path can be reviewed before quote, payment, scheduling, or execution.</p>
          <Link href="/intake" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-amber-200 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black">Begin Secure Intake</Link>
        </section>
      </div>
    </main>
  description: "Request an execution quote for international document execution, apostille coordination, eligible RON review, witness needs, and final packet requirements.",
};

const tiers = [
  {
    label: "Signature Lane",
    summary: "Structured review for single-matter execution where the record set, signer path, and destination requirements are clear.",
  },
  {
    label: "Priority Lane",
    summary: "Elevated coordination for timing-sensitive matters with apostille, witness, signer-location, or courier requirements.",
  },
  {
    label: "Executive Lane",
    summary: "Private-client execution support for complex records, high-touch coordination, and final packet control.",
  },
];

export default function PricingPage() {
  const factors = getPublicQuoteFactors();
  const components = getServiceComponents();
  const copy = getExecutionPathCopy();

  return (
    <main className="min-h-screen bg-black px-4 py-16 text-stone-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="rounded-[2.5rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.22),transparent_42%),linear-gradient(135deg,#050505,#15100a)] p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.36em] text-amber-200/70">Execution Quote</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-white md:text-6xl">U.S. Document Execution for International Use</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">Your quote is built from document type, origin jurisdiction, signer location, destination country, urgency, apostille needs, witness needs, and final packet requirements.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/intake" className="min-h-11 rounded-full bg-amber-200 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-black">Begin Secure Intake</Link>
            <Link href="/secure-portal" className="min-h-11 rounded-full border border-amber-300/30 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-amber-100">Secure Portal</Link>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="How Your Quote Is Built"><ul>{factors.map((factor) => <li key={factor}>• {factor}</li>)}</ul></Section>
          <Section title="Execution Paths"><ul>{executionPaths.map((path) => <li key={path}>• {path}</li>)}</ul></Section>
          <Section title="What May Be Included"><ul>{components.map((component) => <li key={component}>• {component}</li>)}</ul></Section>
          <Section title="Payment-Gated Execution"><p>Execution is not scheduled until the quote is reviewed, accepted, and payment is confirmed. This protects document custody, operator time, and final packet release.</p></Section>
          <Section title="What Happens After Intake"><ul>{copy.map((line) => <li key={line}>• {line}</li>)}</ul></Section>
          <Section title="Details Reviewed Before Quote"><ul>{reviewedDetails.map((detail) => <li key={detail}>• {detail}</li>)}</ul></Section>
        </div>

        <section className="rounded-[2rem] border border-amber-300/20 bg-stone-950 p-8 text-center">
          <h2 className="text-2xl font-semibold text-amber-100">Final CTA</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-stone-300">Final acceptance remains subject to the receiving authority. Start with Secure Records Intake so the document path can be reviewed before quote, payment, scheduling, or execution.</p>
          <Link href="/intake" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-amber-200 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black">Begin Secure Intake</Link>
        </section>
      </div>
    </main>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-white md:text-6xl">A controlled quote for international document execution.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            Your quote is built from document type, origin jurisdiction, signer location, destination country, urgency, apostille needs, witness needs, and final packet requirements.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/intake" className="rounded-full bg-amber-200 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-black">Begin Secure Intake</Link>
            <Link href="/secure-portal" className="rounded-full border border-amber-300/30 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-amber-100">Secure Portal</Link>
            <Link href="/secure-portal" className="rounded-full border border-amber-300/30 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-amber-100">Matter Control Portal</Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => (
            <article key={tier.label} className="rounded-3xl border border-amber-300/15 bg-stone-950/80 p-6">
              <h2 className="text-xl font-semibold text-amber-100">{tier.label}</h2>
              <p className="mt-4 text-sm leading-7 text-stone-300">{tier.summary}</p>
              <Link href="/intake" className="mt-6 inline-flex text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">Route through Smart Intake →</Link>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-amber-300/15 bg-black/50 p-6">
            <h2 className="text-xl font-semibold text-amber-100">Quote Factors</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-300">
              {factors.map((factor) => <li key={factor}>• {factor}</li>)}
            </ul>
          </div>
          <div className="rounded-3xl border border-amber-300/15 bg-black/50 p-6">
            <h2 className="text-xl font-semibold text-amber-100">Service Components</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-300">
              {components.map((component) => <li key={component}>• {component}</li>)}
            </ul>
          </div>
          <div className="rounded-3xl border border-amber-300/15 bg-black/50 p-6">
            <h2 className="text-xl font-semibold text-amber-100">Execution Rules</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-300">
              {copy.map((line) => <li key={line}>• {line}</li>)}
            </ul>
          </div>
        </section>
      </div>
    </main>
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  PRICING_LANES,
  RON_PRICING,
  MOBILE_NOTARY_PRICING,
  APOSTILLE_PRICING,
  COURIER_PRICING,
  PRICING_ADD_ONS,
  PAYMENT_STRUCTURE,
  PRICING_DISCLAIMER,
} from "@/lib/config/pricing";

export const metadata: Metadata = {
  title: "Pricing | The Milano Seal™ — Execution Lanes, RON, Mobile Notary & Apostille",
  description:
    "Transparent pricing for international document execution: Signature/Priority/Executive lanes, Remote Online Notarization, Florida mobile notary, apostille coordination, courier, and add-on fees. Final quote confirmed after review.",
  alternates: { canonical: "https://themilanoseal.com/pricing" },
};

type PriceItem = { id: string; name: string; priceLabel: string; note?: string };

function PriceList({ title, subtitle, items }: { title: string; subtitle?: string; items: readonly PriceItem[] }) {
  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 border-t border-[#1A1A1A]">
      <h2 className="font-serif text-2xl text-white">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-[#8A8A8A]">{subtitle}</p>}
      <div className="mt-6 divide-y divide-[#1A1A1A] rounded-xl border border-[#1A1A1A] bg-[#0E0E0E]">
        {items.map((it) => (
          <div key={it.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-white">{it.name}</p>
              {it.note && <p className="mt-0.5 text-[12px] leading-relaxed text-[#8A8A8A]">{it.note}</p>}
            </div>
            <p className="shrink-0 font-mono text-sm text-[#C6A55A] sm:text-right">{it.priceLabel}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0A0A0A] overflow-x-hidden">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-32 pb-10">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]/70">Pricing</p>
          <h1 className="font-serif text-3xl leading-tight text-white sm:text-5xl">
            Structured pricing for <span className="italic text-[#C6A55A]">international document execution</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#8A8A8A]">
            Execution lanes for coordinated matters, plus standalone Remote Online Notarization, Florida mobile notary,
            apostille coordination, courier, and add-on services. Final quote is confirmed after document, signer,
            jurisdiction, apostille, and receiving-authority review.
          </p>
          <div className="mt-8">
            <Link
              href="/intake"
              className="inline-flex min-h-12 items-center justify-center rounded-lg px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a1206]"
              style={{ background: "linear-gradient(180deg,#ECD79A,#C6A55A)" }}
            >
              Begin Secure Intake
            </Link>
          </div>
        </section>

        {/* Execution Lanes */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white">Execution Lanes</h2>
          <p className="mt-1.5 text-sm text-[#8A8A8A]">Bundled matters — single coordinated document execution.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PRICING_LANES.map((lane) => (
              <div key={lane.id} className="rounded-2xl border border-[#C6A55A]/20 bg-[#0E0E0E] p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-serif text-lg text-white">{lane.name}</h3>
                  <span className="font-mono text-xl text-[#C6A55A]">{lane.priceLabel}</span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[#8A8A8A]">{lane.description}</p>
                <ul className="mt-4 space-y-1.5">
                  {lane.inclusions.map((inc) => (
                    <li key={inc} className="flex items-start gap-2 text-[12px] text-white/70">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#C6A55A]/70" />
                      {inc}
                    </li>
                  ))}
                </ul>
                {lane.notIncluded?.length > 0 && (
                  <p className="mt-3 border-t border-[#1A1A1A] pt-3 text-[11px] leading-relaxed text-[#8A8A8A]">
                    Not included: {lane.notIncluded.join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <PriceList title="Remote Online Notarization" subtitle="Standalone RON — no apostille required." items={RON_PRICING} />
        <PriceList title="Florida Mobile Notary" subtitle="In-person signing, mileage, statutory, and wait-time fees." items={MOBILE_NOTARY_PRICING} />
        <PriceList title="Apostille Coordination" subtitle="Florida Department of State submission and handling." items={APOSTILLE_PRICING} />
        <PriceList title="International Courier & Dispatch" items={COURIER_PRICING} />
        <PriceList title="Add-On Services & Fees" items={PRICING_ADD_ONS} />

        {/* Payment structure */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white">Payment</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>Retainer: {PAYMENT_STRUCTURE.retainer}</li>
            <li>Balance: {PAYMENT_STRUCTURE.balance}</li>
            <li>Method: {PAYMENT_STRUCTURE.method}</li>
          </ul>
          <p className="mt-3 text-[12.5px] leading-relaxed text-[#8A8A8A]">{PAYMENT_STRUCTURE.note}</p>
        </section>

        {/* Disclaimer */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12 border-t border-[#1A1A1A]">
          <p className="text-[11px] leading-relaxed text-[#8A8A8A]/80">{PRICING_DISCLAIMER}</p>
          <p className="mt-3 text-[11px] leading-relaxed text-[#8A8A8A]/80">
            Final acceptance is determined by the receiving authority.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
