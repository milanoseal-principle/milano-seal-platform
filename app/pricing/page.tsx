import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  getExecutionPathCopy,
  getPublicQuoteFactors,
  getServiceComponents,
} from "@/lib/command-center/pricingIntelligence";

export const metadata: Metadata = {
  title: "Execution Quote | The Milano Seal™",
  description:
    "Request a reviewed execution quote for U.S. document execution, apostille coordination, eligible remote online review, mobile coordination, and international document release.",
  alternates: { canonical: "https://themilanoseal.com/pricing" },
};

const executionPaths = [
  {
    title: "Signature Execution",
    summary:
      "For straightforward document execution where the signer, document type, and destination requirements are clear.",
  },
  {
    title: "Priority Execution",
    summary:
      "For matters requiring tighter coordination, apostille handling, or more involved destination review.",
  },
  {
    title: "Executive Execution",
    summary:
      "For complex, high-touch, or internationally sensitive document matters requiring expanded coordination.",
  },
];

const reviewedDetails = [
  "Document type",
  "Origin jurisdiction",
  "Signer location",
  "Destination country",
  "Urgency",
  "Apostille requirements",
  "Witness needs",
  "Final packet requirements",
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-amber-300/15 bg-black/50 p-6">
      <h2 className="text-xl font-semibold text-amber-100">{title}</h2>
      <div className="mt-4 text-sm leading-7 text-stone-300">{children}</div>
    </section>
  );
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
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-white md:text-6xl">
            U.S. Document Execution for International Use
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            Your quote is built from document type, origin jurisdiction, signer location,
            destination country, urgency, apostille needs, witness needs, and final
            packet requirements.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/intake"
              className="min-h-11 rounded-full bg-amber-200 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-black"
            >
              Begin Secure Intake
            </Link>
            <Link
              href="/secure-portal"
              className="min-h-11 rounded-full border border-amber-300/30 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-amber-100"
            >
              Secure Portal
            </Link>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="How Your Quote Is Built">
            <ul className="space-y-2">
              {factors.map((factor) => (
                <li key={factor}>• {factor}</li>
              ))}
            </ul>
          </Section>

          <Section title="Execution Paths">
            <div className="space-y-4">
              {executionPaths.map((path) => (
                <article key={path.title}>
                  <h3 className="font-semibold text-amber-100">{path.title}</h3>
                  <p className="mt-1 text-stone-300">{path.summary}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="What May Be Included">
            <ul className="space-y-2">
              {components.map((component) => (
                <li key={component}>• {component}</li>
              ))}
              <li>• witness coordination</li>
              <li>• document packet review</li>
              <li>• final delivery confirmation</li>
            </ul>
          </Section>

          <Section title="Payment-Gated Execution">
            <p>
              Execution is not scheduled until the quote is reviewed, accepted, and
              payment is confirmed. This protects document custody, operator time,
              and final packet release.
            </p>
          </Section>

          <Section title="What Happens After Intake">
            <ul className="space-y-2">
              {copy.map((line) => (
                <li key={line}>• {line}</li>
              ))}
              <li>• Submit Secure Intake</li>
              <li>• Matter Reviewed</li>
              <li>• Execution Path Confirmed</li>
              <li>• Quote Issued</li>
              <li>• Payment Confirmed</li>
              <li>• Scheduling Unlocks</li>
              <li>• Execution Begins</li>
              <li>• Final Packet Released</li>
            </ul>
          </Section>

          <Section title="Details Reviewed Before Quote">
            <ul className="space-y-2">
              {reviewedDetails.map((detail) => (
                <li key={detail}>• {detail}</li>
              ))}
            </ul>
          </Section>
        </div>

        <section className="rounded-[2rem] border border-amber-300/20 bg-stone-950 p-8 text-center">
          <h2 className="text-2xl font-semibold text-amber-100">Begin with Secure Intake</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-stone-300">
            Final acceptance remains subject to the receiving authority. Start with
            Secure Intake so the document path can be reviewed before quote, payment,
            scheduling, or execution.
          </p>
          <Link
            href="/intake"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-amber-200 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black"
          >
            Begin Secure Intake
          </Link>
        </section>
      </div>
    </main>
  );
}
