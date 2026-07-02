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
  );
}
