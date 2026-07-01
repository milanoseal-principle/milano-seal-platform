import Link from "next/link";
import type { Metadata } from "next";
import { getExecutionPathCopy, getPublicQuoteFactors, getServiceComponents } from "@/lib/command-center/pricingIntelligence";

export const metadata: Metadata = {
  title: "Execution Quote — The Milano Seal™",
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
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-white md:text-6xl">A controlled quote for international document execution.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            Your quote is built from document type, origin jurisdiction, signer location, destination country, urgency, apostille needs, witness needs, and final packet requirements.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/intake" className="rounded-full bg-amber-200 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-black">Begin Secure Intake</Link>
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
  );
}
