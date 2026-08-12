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
    timeline: "24-72 Hours",
    summary:
      "For straightforward document execution where the signer, document type, jurisdiction, and destination requirements are clear.",
    tags: ["Scope review", "RON coordination", "Destination check"],
  },
  {
    title: "Priority Execution",
    timeline: "Same Day-48 Hours",
    summary:
      "For urgent, apostille-related, multi-document, or professionally coordinated matters requiring accelerated review and scheduling.",
    tags: ["Priority review", "Apostille routing", "Scheduling desk"],
  },
  {
    title: "Executive Execution",
    timeline: "Immediate Project Coordination",
    summary:
      "For eligible same-day matters when documents, identity verification, participants, applicable requirements, and operational capacity are ready.",
    tags: ["Founder review", "Project coordination", "Chain visibility"],
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
    <section className="rounded-3xl border border-amber-300/15 bg-black/50 p-5 sm:p-6">
      <h2 className="text-[clamp(1.65rem,7vw,2.4rem)] font-semibold leading-tight text-amber-100 sm:text-xl">{title}</h2>
      <div className="mt-4 text-base leading-7 text-stone-300 sm:text-sm">{children}</div>
    </section>
  );
}

export default function PricingPage() {
  const factors = getPublicQuoteFactors();
  const components = getServiceComponents();
  const copy = getExecutionPathCopy();

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-black px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-[calc(env(safe-area-inset-top)+4rem)] text-stone-100 sm:px-6 lg:px-8">
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
            <div className="grid grid-cols-1 gap-3">
              {executionPaths.map((path) => (
                <article
                  key={path.title}
                  className="rounded-2xl border border-[#8d6a22]/30 bg-[#0a0907]/80 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:min-h-0"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-xl font-semibold leading-tight text-amber-100">{path.title}</h3>
                    <span className="inline-flex w-fit rounded-full border border-[#8d6a22]/60 bg-[#c99a3a]/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#e3bd65]">
                      {path.timeline}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-neutral-300">{path.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {path.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 px-2.5 py-1 text-[13px] text-stone-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-4 text-[13px] leading-6 text-stone-400">
              Coordination timelines describe Milano Seal review, preparation, and execution activity. Apostille authorities, embassies, consulates, couriers, receiving institutions, and other third parties control their own processing timelines.
            </p>
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
