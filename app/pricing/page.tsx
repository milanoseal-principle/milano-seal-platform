import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  FileCheck2,
  Globe2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
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

const executionLanes = [
  {
    eyebrow: "Signature",
    title: "Signature Execution",
    timeline: "24–72 hour coordination target",
    summary:
      "For straightforward matters where the document, signer posture, origin, destination, and execution requirements are sufficiently clear for standard coordination.",
    features: ["Scope review", "Execution coordination", "Destination routing"],
  },
  {
    eyebrow: "Priority",
    title: "Priority Execution",
    timeline: "Same day–48 hour coordination target",
    summary:
      "For urgent, apostille-related, multi-document, or professionally managed matters requiring accelerated review and tighter scheduling control.",
    features: ["Priority review", "Apostille / authentication routing", "Scheduling desk"],
  },
  {
    eyebrow: "Executive",
    title: "Executive Execution",
    timeline: "Immediate project coordination",
    summary:
      "For eligible complex or time-sensitive matters requiring heightened oversight, multiple participants, controlled handoffs, or founder-level coordination.",
    features: ["Enhanced oversight", "Project coordination", "Chain visibility"],
  },
] as const;

const quoteEquation = [
  "Document",
  "Origin",
  "Destination",
  "Signer",
  "Authentication path",
  "Timing",
  "Release",
] as const;

const matterConfiguration = [
  ["Destination", "Where the completed document will be used"],
  ["Document", "What is being executed, certified, or authenticated"],
  ["Origin", "Where the document was issued or will be executed"],
  ["Signer", "Location, count, and execution posture"],
  ["Timing", "Operational urgency and external authority timing"],
  ["Release", "Final packet, custody, and delivery requirements"],
] as const;

export default function PricingPage() {
  const factors = getPublicQuoteFactors();
  const components = getServiceComponents();
  const pathCopy = getExecutionPathCopy();

  return (
    <PublicShell>
      <main
        className="min-h-screen overflow-x-hidden bg-[#060606] text-white"
        style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}
      >
        <section className="relative overflow-hidden border-b border-white/[0.055] px-4 py-16 sm:px-6 md:py-24">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(circle at 78% 20%, rgba(198,166,91,0.11), transparent 28%), radial-gradient(circle at 18% 0%, rgba(246,241,230,0.04), transparent 30%)",
            }}
          />
          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#C6A65B]/70">
                Reviewed Execution Quote
              </p>
              <h1 className="mt-5 max-w-4xl font-serif text-5xl font-medium leading-[0.98] tracking-[-0.03em] text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]">
                U.S. document execution for <em className="text-[#C6A65B]">international use.</em>
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-white/55">
                Execution quotes are Matter-specific. Milano reviews the document, U.S. origin,
                destination, signer configuration, authentication path, timing, and release
                requirements before confirming scope and price.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/intake?source=pricing&intent=quote"
                  className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#C6A65B] px-7 text-sm font-semibold text-[#070707] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#D3B56A]"
                >
                  Structure a Matter
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/professional"
                  className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/[0.11] px-7 text-sm font-medium text-white/70 transition-colors hover:border-[#C6A65B]/40 hover:text-[#F6F1E6]"
                >
                  For Attorneys & Professional Advisors
                </Link>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-white/[0.075] bg-[#0A0A0A]/92 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.36)] sm:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C6A65B]/65">
                    Matter Configuration
                  </p>
                  <h2 className="mt-2 font-serif text-2xl text-[#F6F1E6]">The quote follows the Matter.</h2>
                </div>
                <FileCheck2 className="h-6 w-6 shrink-0 text-[#C6A65B]" />
              </div>
              <div className="mt-5 divide-y divide-white/[0.055]">
                {matterConfiguration.map(([label, detail]) => (
                  <div key={label} className="grid gap-1 py-3.5 sm:grid-cols-[7rem_1fr] sm:gap-4">
                    <span className="text-sm font-medium text-white/72">{label}</span>
                    <span className="text-sm leading-6 text-white/38">{detail}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-white/36">
                No execution stage is authorized from this page. Final scope and pricing are confirmed only after the Matter is reviewed.
              </p>
            </aside>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A65B]/65">
                Execution Lanes
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-white sm:text-5xl md:text-6xl">
                Choose the level of <em className="text-[#C6A65B]">coordination</em>, not a commodity menu.
              </h2>
              <p className="mt-5 text-base leading-7 text-white/45">
                Lanes orient the service level. The actual Matter still controls the final quote, requirements, and scheduling posture.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {executionLanes.map((lane, index) => (
                <article
                  key={lane.title}
                  className={`relative overflow-hidden rounded-[1.75rem] border p-6 sm:p-7 ${
                    index === 1
                      ? "border-[#C6A65B]/28 bg-[#C6A65B]/[0.035]"
                      : "border-white/[0.07] bg-[#0A0A0A]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C6A65B]/65">
                      {lane.eyebrow}
                    </span>
                    <span className="text-xs text-white/30">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 font-serif text-3xl text-[#F6F1E6]">{lane.title}</h3>
                  <p className="mt-2 text-sm font-medium text-[#C6A65B]/72">{lane.timeline}</p>
                  <p className="mt-5 text-[15px] leading-7 text-white/45">{lane.summary}</p>
                  <div className="mt-6 space-y-3 border-t border-white/[0.06] pt-5">
                    {lane.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3 text-sm text-white/58">
                        <Check className="h-4 w-4 shrink-0 text-[#C6A65B]" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-5 max-w-4xl text-sm leading-6 text-white/30">
              Coordination targets describe Milano review, preparation, and execution activity. Government authorities, embassies, consulates, couriers, receiving institutions, and other third parties control their own processing timelines.
            </p>
          </div>
        </section>

        <section className="border-y border-white/[0.055] bg-[#080808] px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C6A65B]/60">Quote Architecture</p>
              <h2 className="mt-4 font-serif text-3xl text-white sm:text-4xl">One reviewed execution quote.</h2>
            </div>
            <div className="mx-auto mt-9 flex max-w-6xl flex-wrap items-center justify-center gap-2.5">
              {quoteEquation.map((item, index) => (
                <div key={item} className="contents">
                  <span className="rounded-full border border-white/[0.075] bg-white/[0.02] px-4 py-2.5 text-sm text-white/58">
                    {item}
                  </span>
                  {index < quoteEquation.length - 1 && <span className="text-[#C6A65B]/45">+</span>}
                </div>
              ))}
              <ArrowRight className="mx-1 h-4 w-4 text-[#C6A65B]/55" />
              <span className="rounded-full border border-[#C6A65B]/28 bg-[#C6A65B]/[0.05] px-5 py-2.5 text-sm font-medium text-[#F6F1E6]">
                Reviewed Execution Quote
              </span>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <article className="rounded-[1.75rem] border border-white/[0.07] bg-[#0A0A0A] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <Globe2 className="h-5 w-5 text-[#C6A65B]" />
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C6A65B]/60">Reviewed Inputs</p>
              </div>
              <h2 className="mt-5 font-serif text-3xl text-white">What shapes the quote.</h2>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {factors.map((factor) => (
                  <div key={factor} className="flex min-h-12 items-center gap-3 rounded-xl border border-white/[0.055] bg-black/20 px-4 py-3 text-sm text-white/50">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C6A65B]/70" />
                    {factor}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-[#C6A65B]/15 bg-[#C6A65B]/[0.022] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[#C6A65B]" />
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C6A65B]/60">Scope Components</p>
              </div>
              <h2 className="mt-5 font-serif text-3xl text-white">What the execution scope may include.</h2>
              <div className="mt-6 space-y-3">
                {components.map((component) => (
                  <div key={component} className="flex gap-3 text-[15px] leading-6 text-white/52">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#C6A65B]/75" />
                    {component}
                  </div>
                ))}
              </div>
              <p className="mt-6 border-t border-white/[0.06] pt-5 text-sm leading-6 text-white/34">
                Witness coordination, document-packet review, custody controls, and delivery confirmation may be added when the Matter requires them.
              </p>
            </article>
          </div>
        </section>

        <section className="border-y border-white/[0.055] bg-[#080808] px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-[#C6A65B]" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C6A65B]/65">Payment Gate</p>
                </div>
                <h2 className="mt-5 font-serif text-4xl leading-tight text-white sm:text-5xl">
                  Payment verification is an <em className="text-[#C6A65B]">execution control.</em>
                </h2>
                <p className="mt-5 text-base leading-7 text-white/45">
                  Scheduling and execution remain locked until the approved Matter amount is verified through the canonical Wise payment path.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["01", "Quote Approved", "Scope and amount are reviewed."],
                  ["02", "Wise Payment Verified", "Payment reconciles to the same Matter."],
                  ["03", "Execution Unlocked", "Applicable scheduling may proceed."],
                ].map(([number, title, body]) => (
                  <div key={title} className="rounded-2xl border border-white/[0.07] bg-[#0A0A0A] p-5">
                    <span className="font-mono text-[11px] text-[#C6A65B]/55">{number}</span>
                    <h3 className="mt-5 font-serif text-2xl text-[#F6F1E6]">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/36">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/[0.07] bg-[#0A0A0A] p-6 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/32">After Intake</p>
              <h2 className="mt-4 font-serif text-3xl text-white">A controlled path, not an instant purchase flow.</h2>
              <div className="mt-6 space-y-3">
                {pathCopy.map((line) => (
                  <div key={line} className="flex gap-3 text-sm leading-6 text-white/46">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#C6A65B]/70" />
                    {line}
                  </div>
                ))}
              </div>
              <Link href="/process" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[#C6A65B] hover:text-[#E0C57D]">
                View the full execution process <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-[1.75rem] border border-white/[0.07] bg-[#0A0A0A] p-6 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/32">Professional Boundary</p>
              <h2 className="mt-4 font-serif text-3xl text-white">Counsel keeps the legal matter.</h2>
              <p className="mt-5 text-[15px] leading-7 text-white/46">
                The Milano Seal coordinates U.S. document execution and authentication logistics. Legal advice, legal strategy, document substance, instrument choice, and receiving-authority legal judgment remain with counsel or the appropriate professional advisor.
              </p>
              <Link href="/professional" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[#C6A65B] hover:text-[#E0C57D]">
                Open the professional lane <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.055] px-4 py-16 text-center sm:px-6 md:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C6A65B]/60">Start with the Matter</p>
            <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">Structure the route before execution begins.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/42">
              Receiving-authority acceptance is never guaranteed. Secure intake gives Milano the facts required to review the operational path before quote, payment, scheduling, or execution.
            </p>
            <Link
              href="/intake?source=pricing-final"
              className="group mt-8 inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#C6A65B] px-8 text-sm font-semibold text-[#070707] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#D3B56A]"
            >
              Start Secure Intake
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
