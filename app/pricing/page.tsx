import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  FileCheck2,
  Globe2,
  LockKeyhole,
  MapPin,
  MonitorCheck,
  ShieldCheck,
} from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { ExecutionTiers } from "@/components/landing/execution-tiers";

export const metadata: Metadata = {
  title: "Execution Quote | The Milano Seal™",
  description:
    "Understand exactly what a Milano Matter includes, then request a reviewed quote for authentication, RON, in-person execution, apostille coordination, custody, and international release.",
  alternates: { canonical: "https://themilanoseal.com/pricing" },
};

const matterPaths = [
  {
    eyebrow: "Already issued / already executed",
    title: "Authentication Matter",
    summary:
      "For documents that are already properly issued, certified, or executed and now need a controlled authentication or apostille route for international use.",
    icon: FileCheck2,
    includes: [
      "One controlled Matter",
      "First document in the Matter",
      "First apostille coordination when required",
      "Route and readiness review",
      "Issuing-authority posture review",
      "Authentication pathway coordination",
      "Custody and release management",
      "Secure Matter visibility",
    ],
    examples: "Typical examples: vital records, certified court records, certified corporate records, already-executed documents.",
  },
  {
    eyebrow: "Signer needed · remote execution eligible",
    title: "Signature Matter — RON",
    summary:
      "For documents that require a signer and are eligible for remote online notarization through the governed Milano execution route.",
    icon: MonitorCheck,
    includes: [
      "Everything operationally applicable from Authentication Matter",
      "Signer coordination",
      "One eligible RON session",
      "Notarial execution coordination",
      "Execution QA",
      "First apostille coordination when required",
      "Custody and release management",
      "Secure Matter visibility",
    ],
    examples: "Typical examples: powers of attorney, affidavits, declarations, consents, corporate authorizations.",
  },
  {
    eyebrow: "Signer needed · physical execution",
    title: "Signature Matter — In Person",
    summary:
      "For documents that require a physical signing appointment or cannot use the remote execution route.",
    icon: MapPin,
    includes: [
      "Everything operationally applicable from Authentication Matter",
      "Signer coordination",
      "One standard in-person execution appointment",
      "Notarial execution coordination",
      "Execution QA",
      "First apostille coordination when required",
      "Custody and release management",
      "Secure Matter visibility",
    ],
    examples: "Travel, witness, location, or special handling requirements are reviewed before the quote is finalized.",
  },
] as const;

const quoteChanges = [
  "Additional documents",
  "Additional apostilles or authentication actions",
  "Additional signers",
  "Witness coordination",
  "Translation coordination",
  "Rush or same-day handling",
  "Multiple issuing or execution jurisdictions",
  "Federal or consular authentication",
  "Mobile travel or special location handling",
  "International courier requirements",
] as const;

const intakeFacts = [
  ["Document", "What document needs to work internationally"],
  ["Origin", "Where it was issued or where it will be executed"],
  ["Destination", "Where the completed document will be used"],
  ["Signer", "Whether a signer is needed and where they are located"],
  ["Execution", "RON, in-person, already executed, or review required"],
  ["Timing", "Your deadline and urgency"],
] as const;

const paymentSteps = [
  ["01", "Quote accepted", "The Matter scope, route, inclusions, and final amount are confirmed."],
  ["02", "50% deposit verified", "Wise deposit is matched to the Matter before scheduling is unlocked."],
  ["03", "RON / in-person execution", "The approved execution route proceeds with custody and status visibility."],
  ["04", "Apostille / authentication", "The required authority route is coordinated and tracked."],
  ["05", "Final 50% verified", "The remaining balance clears before international release."],
  ["06", "Release / courier", "The completed packet is released into the approved delivery route."],
] as const;

export default function PricingPage() {
  return (
    <PublicShell>
      <main
        className="min-h-screen overflow-x-hidden bg-[#060606] text-white"
        style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}
      >
        <section className="relative overflow-hidden border-b border-white/[0.055] px-4 py-16 sm:px-6 md:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(circle at 76% 18%, rgba(198,166,91,0.12), transparent 30%), radial-gradient(circle at 18% 0%, rgba(246,241,230,0.04), transparent 28%)",
            }}
          />
          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#C6A65B]/70">
                Execution Quote
              </p>
              <h1 className="mt-5 max-w-4xl font-serif text-5xl font-medium leading-[0.98] tracking-[-0.03em] text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]">
                Know exactly what your <em className="text-[#C6A65B]">Matter includes.</em>
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-white/58">
                The Milano Seal does not sell a vague notary package. We review the document, origin, destination, signer posture, execution route, apostille or authentication path, custody, and release requirements, then issue one Matter-specific quote.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/intake?source=pricing&intent=quote"
                  className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#C6A65B] px-7 text-sm font-semibold text-[#070707] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#D3B56A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A65B]"
                >
                  Get My Matter Reviewed
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/professional"
                  className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/[0.11] px-7 text-sm font-medium text-white/72 transition-colors hover:border-[#C6A65B]/40 hover:text-[#F6F1E6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A65B]"
                >
                  International Counsel
                </Link>
              </div>
              <p className="mt-5 text-sm leading-6 text-white/36">
                No numeric pricing is published here. Your quote is issued only after Milano confirms what your Matter actually requires.
              </p>
            </div>

            <aside className="rounded-[2rem] border border-white/[0.075] bg-[#0A0A0A]/94 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.36)] sm:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C6A65B]/65">
                    What Milano needs first
                  </p>
                  <h2 className="mt-2 font-serif text-2xl text-[#F6F1E6]">Six facts structure the Matter.</h2>
                </div>
                <FileCheck2 className="h-6 w-6 shrink-0 text-[#C6A65B]" />
              </div>
              <div className="mt-5 divide-y divide-white/[0.055]">
                {intakeFacts.map(([label, detail]) => (
                  <div key={label} className="grid gap-1 py-3.5 sm:grid-cols-[7rem_1fr] sm:gap-4">
                    <span className="text-sm font-medium text-white/74">{label}</span>
                    <span className="text-sm leading-6 text-white/40">{detail}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-white/38">
                If a fact is unknown, submit the Matter anyway. Milano keeps uncertainty visible and routes it to review instead of inventing an answer.
              </p>
            </aside>
          </div>
        </section>

        <ExecutionTiers />

        <section className="px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A65B]/65">
                What You Are Buying
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-white sm:text-5xl md:text-6xl">
                Three clear Matter paths. <em className="text-[#C6A65B]">No guesswork.</em>
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-7 text-white/47">
                You do not need to choose a complicated package. Tell us what the document needs. Milano confirms the correct path and shows exactly what is included before payment.
              </p>
            </div>

            <div className="mt-10 grid gap-5 xl:grid-cols-3">
              {matterPaths.map((path, index) => {
                const Icon = path.icon;
                return (
                  <article
                    key={path.title}
                    className={`relative overflow-hidden rounded-[1.8rem] border p-6 sm:p-7 ${
                      index === 1
                        ? "border-[#C6A65B]/32 bg-[#C6A65B]/[0.038] shadow-[0_28px_80px_rgba(198,166,91,0.05)]"
                        : "border-white/[0.075] bg-[#0A0A0A]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C6A65B]/62">{path.eyebrow}</p>
                        <h3 className="mt-4 font-serif text-3xl leading-tight text-[#F6F1E6]">{path.title}</h3>
                      </div>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#C6A65B]/18 bg-black/30">
                        <Icon className="h-5 w-5 text-[#C6A65B]" />
                      </div>
                    </div>
                    <p className="mt-5 text-[15px] leading-7 text-white/46">{path.summary}</p>
                    <div className="mt-6 border-t border-white/[0.06] pt-5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/34">Included in this Matter</p>
                      <div className="mt-4 space-y-3">
                        {path.includes.map((item) => (
                          <div key={item} className="flex gap-3 text-sm leading-6 text-white/58">
                            <Check className="mt-1 h-4 w-4 shrink-0 text-[#C6A65B]" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="mt-6 border-t border-white/[0.06] pt-5 text-sm leading-6 text-white/34">{path.examples}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.055] bg-[#080808] px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C6A65B]/65">What Can Change The Quote</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-white sm:text-5xl">
                The base path stays clear. <em className="text-[#C6A65B]">Complexity is itemized.</em>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/45">
                Milano does not quietly add fees after intake. If your Matter needs more documents, signers, authorities, speed, travel, witnesses, translation coordination, or courier handling, those requirements are identified before the final quote is accepted.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {quoteChanges.map((item) => (
                <div key={item} className="flex min-h-14 items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0A0A0A] px-4 py-3.5 text-sm text-white/54">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C6A65B]/75" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 lg:grid-cols-2">
              <article className="rounded-[1.75rem] border border-white/[0.07] bg-[#0A0A0A] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <Globe2 className="h-5 w-5 text-[#C6A65B]" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C6A65B]/60">Your Reviewed Matter Summary</p>
                </div>
                <h2 className="mt-5 font-serif text-3xl text-white">Before the quote, you can see what Milano understood.</h2>
                <p className="mt-4 text-[15px] leading-7 text-white/46">
                  Your Matter review should make the route unmistakable before you accept anything.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Destination country",
                    "Document type",
                    "U.S. origin or issuing authority",
                    "Signer location and execution posture",
                    "Recommended execution path",
                    "Apostille or authentication route",
                    "Anything still unresolved or review-required",
                  ].map((item) => (
                    <div key={item} className="flex gap-3 text-sm leading-6 text-white/56">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#C6A65B]/75" />
                      {item}
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[1.75rem] border border-[#C6A65B]/16 bg-[#C6A65B]/[0.025] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#C6A65B]" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C6A65B]/60">What Happens Next</p>
                </div>
                <h2 className="mt-5 font-serif text-3xl text-white">One Matter. One visible sequence.</h2>
                <p className="mt-4 text-[15px] leading-7 text-white/46">
                  The same Matter continues from review into payment, scheduling, execution, apostille or authentication, release, courier, and completion. You should not have to restart or re-enter the same facts.
                </p>
                <Link
                  href="/process"
                  className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#C6A65B]/30 px-5 py-3 text-sm font-medium text-[#C6A65B] hover:border-[#C6A65B]/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A65B]"
                >
                  View the execution process <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.055] bg-[#080808] px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-[#C6A65B]" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C6A65B]/65">Payment-Gated Execution</p>
                </div>
                <h2 className="mt-5 font-serif text-4xl leading-tight text-white sm:text-5xl">
                  Payment controls scheduling and <em className="text-[#C6A65B]">international release.</em>
                </h2>
                <p className="mt-5 text-base leading-7 text-white/45">
                  Once verified, the first 50% Wise deposit unlocks scheduling and eligible RON/execution. The final 50% must be verified before the completed document packet is released for international shipping.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {paymentSteps.map(([number, title, body]) => (
                  <div key={title} className="rounded-2xl border border-white/[0.07] bg-[#0A0A0A] p-5">
                    <span className="font-mono text-[11px] text-[#C6A65B]/55">{number}</span>
                    <h3 className="mt-4 font-serif text-xl text-[#F6F1E6]">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/38">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/[0.07] bg-[#0A0A0A] p-6 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/32">For Clients</p>
              <h2 className="mt-4 font-serif text-3xl text-white">You are buying a controlled international outcome.</h2>
              <p className="mt-5 text-[15px] leading-7 text-white/46">
                The quote is for one governed Matter, not a menu of disconnected notary and apostille transactions. Milano shows what is included, what requires review, what can change the scope, and what must happen before release.
              </p>
              <Link
                href="/intake?source=pricing-client"
                className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#C6A65B] hover:text-[#E0C57D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A65B]"
              >
                Start secure intake <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-[1.75rem] border border-white/[0.07] bg-[#0A0A0A] p-6 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/32">For Counsel</p>
              <h2 className="mt-4 font-serif text-3xl text-white">Counsel keeps the legal matter.</h2>
              <p className="mt-5 text-[15px] leading-7 text-white/46">
                The Milano Seal coordinates U.S. document execution and authentication logistics. Legal advice, legal strategy, document substance, instrument choice, and receiving-authority legal judgment remain with counsel or the appropriate professional advisor.
              </p>
              <Link
                href="/professional"
                className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#C6A65B] hover:text-[#E0C57D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A65B]"
              >
                Open Professional Execution <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.055] px-4 py-16 text-center sm:px-6 md:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C6A65B]/60">Ready For Review</p>
            <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">See your exact Matter path before you pay.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/44">
              Submit the document, destination, origin, signer posture, and deadline. Milano returns the recommended path, what is included, what remains unresolved, and the final quote required to proceed.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/intake?source=pricing-final"
                className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#C6A65B] px-8 text-sm font-semibold text-[#070707] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#D3B56A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A65B]"
              >
                Start Secure Intake
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/secure-portal"
                className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/[0.1] px-7 text-sm font-medium text-white/66 hover:border-[#C6A65B]/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A65B]"
              >
                Existing Matter
              </Link>
            </div>
            <p className="mt-6 text-xs leading-5 text-white/28">
              Final acceptance remains subject to the receiving authority. The Milano Seal does not provide legal advice.
            </p>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
