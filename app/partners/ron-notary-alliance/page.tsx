import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe2, ShieldCheck } from "lucide-react";

import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "RON Notary Alliance | The Milano Seal™",
  description:
    "Apply for review as a state-authorized Remote Online Notary, mobile notary, or execution partner supporting eligible Milano Seal document matters.",
};

const REQUIREMENTS = [
  "Current state notary commission",
  "RON authorization or registration evidence where applicable",
  "Active RON platform capability for RON assignments",
  "E&O insurance information",
  "Availability and service-area record",
  "Milano Seal SOP and data-handling review before dispatch",
];

export default function RonNotaryAlliancePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#080706] text-white" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}>
        <section className="border-b border-[#C6A55A]/10 px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/65">
              The Milano Seal™ Alliance
            </p>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-tight text-[#F5E8C5] sm:text-5xl">
              State-authorized RON and mobile execution partners
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-white/55">
              The Milano Seal is building a verified execution network of commissioned notaries who can support eligible U.S. document matters under a controlled intake, credential-review, payment-gated dispatch, execution, and release workflow.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/partners/ron-notary-alliance/apply" className="inline-flex items-center gap-2 rounded-sm bg-[#C6A55A] px-6 py-3 text-sm font-semibold text-[#090806] transition hover:bg-[#D8BA72]">
                Apply for Review <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/process" className="rounded-sm border border-white/10 px-6 py-3 text-sm text-white/60 transition hover:border-[#C6A55A]/30 hover:text-white/80">
                View Execution Process
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Verified before dispatch", copy: "Commission, availability, insurance, and RON evidence are reviewed before a partner becomes dispatch-ready." },
              { icon: Globe2, title: "Built for international-use matters", copy: "The network supports eligible execution needs while destination and receiving-authority requirements remain matter-specific." },
              { icon: CheckCircle2, title: "Controlled workflow", copy: "Partners receive governed instructions only after the Milano workflow has reached the appropriate execution stage." },
            ].map(({ icon: Icon, title, copy }) => (
              <article key={title} className="rounded-xl border border-[#C6A55A]/10 bg-white/[0.02] p-6">
                <Icon className="h-5 w-5 text-[#C6A55A]" />
                <h2 className="mt-4 font-serif text-xl text-white/85">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/45">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/[0.06] bg-black/20 px-6 py-16">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#C6A55A]/55">Partner requirements</p>
              <h2 className="mt-3 font-serif text-3xl text-white/85">Verification before opportunity</h2>
              <div className="mt-6 space-y-3">
                {REQUIREMENTS.map((item) => (
                  <div key={item} className="flex gap-3 text-sm leading-6 text-white/50">
                    <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-[#C6A55A]/70" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-[#0B0A09] p-6 sm:p-8">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A55A]/55">Operating boundary</p>
              <div className="mt-5 space-y-4 text-sm leading-6 text-white/48">
                <p>Partners remain independent and may accept only assignments they are legally authorized, qualified, and available to perform.</p>
                <p>Participation does not guarantee approval, dispatch volume, income, assignments, exclusive territory, or foreign acceptance.</p>
                <p>RON authority is state-specific. A partner is not treated as RON-ready until current authorization or registration evidence and the applicable operational requirements have been reviewed.</p>
                <p>The receiving authority determines matter-specific acceptance requirements. The Milano Seal is not a law firm and does not provide legal advice or legal representation.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#C6A55A]/55">Founding coverage build</p>
            <h2 className="mt-4 font-serif text-3xl text-white/85">Apply to enter the verification queue</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/45">
              Submit commission, RON capability, insurance, service-area, and availability information. Approval and dispatch readiness are separate governed decisions.
            </p>
            <Link href="/partners/ron-notary-alliance/apply" className="mt-8 inline-flex items-center gap-2 rounded-sm bg-[#C6A55A] px-7 py-3 text-sm font-semibold text-[#090806] transition hover:bg-[#D8BA72]">
              Apply as an Execution Partner <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
