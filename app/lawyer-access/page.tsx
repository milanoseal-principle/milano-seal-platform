import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileSearch2, Landmark, ShieldAlert, Workflow } from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  COUNSEL_DESK,
  COUNSEL_INTELLIGENCE_REPORT,
  COUNSEL_PRIMARY_PRACTICE_AREAS,
  COUNSEL_PRIORITY_CORRIDORS,
  COUNSEL_REPORT_BOUNDARY,
} from "@/data/counsel-intelligence";

export const metadata: Metadata = {
  title: "Cross-Border Execution Intelligence for Counsel | The Milano Seal™",
  description:
    "Matter-specific execution intelligence and recurring counsel access for U.S. and foreign attorneys managing U.S.-origin documents for international use.",
};

const REPORT_VALUE = [
  { title: "Executive Route Decision", icon: Workflow, body: "Origin, destination, document, receiving party, execution posture, authentication route, and route status in one decision layer." },
  { title: "Authority Matrix", icon: Landmark, body: "Notarial authority, authentication authority, destination framework, receiving authority, and acceptance dependencies." },
  { title: "Failure / Rejection Risk", icon: ShieldAlert, body: "Surfaces execution defects that can cause delay or rejection without converting uncertainty into false certainty." },
  { title: "Evidence Appendix", icon: FileSearch2, body: "Material conclusions retain source, authority, checked date, confidence posture, and status so UNKNOWN remains UNKNOWN." },
] as const;

export default function Page() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050507] text-white">
      <Header />
      <section className="relative px-4 pb-20 sm:px-6" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top) + 3rem)" }}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(198,165,90,0.12),transparent_35%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--ms-gold)]/65">For U.S. & Foreign Counsel</p>
              <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">U.S. execution infrastructure for documents that must <span className="italic text-[var(--ms-gold)]">work across borders.</span></h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-white/52">For international, immigration, real-estate, trusts and estates, private-wealth, corporate, family, maritime, and litigation counsel who need a controlled U.S.-origin execution route without building the operational workflow themselves.</p>
            </div>
            <div className="rounded-2xl border border-[var(--ms-gold)]/25 bg-[var(--ms-gold)]/[0.05] p-5">
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--ms-gold)]/65">Core use case</p>
              <p className="mt-3 font-serif text-xl">Foreign counsel needs a U.S.-based client to execute correctly for the destination jurisdiction.</p>
              <p className="mt-3 text-sm leading-6 text-white/42">Milano coordinates the execution pathway, authentication posture, custody, and release while final acceptance remains with the receiving authority.</p>
            </div>
          </div>

          <section id="execution-intelligence-report" className="mt-14 overflow-hidden rounded-3xl border border-[var(--ms-gold)]/30 bg-[#0A0A0C] shadow-[0_35px_120px_rgba(0,0,0,0.55)]">
            <div className="grid gap-0 lg:grid-cols-[.8fr_1.2fr]">
              <div className="border-b border-white/[0.07] p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--ms-gold)]/65">Per Matter</p>
                <h2 className="mt-3 font-serif text-3xl">{COUNSEL_INTELLIGENCE_REPORT.name}</h2>
                <p className="mt-4 text-3xl font-semibold text-[var(--ms-gold)]">{COUNSEL_INTELLIGENCE_REPORT.priceLabel}</p>
                <p className="mt-5 text-sm leading-6 text-white/48">{COUNSEL_INTELLIGENCE_REPORT.promise}</p>
                <Link href="/intake?audience=counsel&product=execution-intelligence-report" className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--ms-gold)] px-5 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-[#050507]">Start Counsel Matter<ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
              <div className="p-6 sm:p-8">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/32">What counsel receives</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {REPORT_VALUE.map(({ title, icon: Icon, body }) => <article key={title} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"><Icon className="h-4 w-4 text-[var(--ms-gold)]/75" /><h3 className="mt-4 font-serif text-lg">{title}</h3><p className="mt-2 text-sm leading-6 text-white/40">{body}</p></article>)}
                </div>
                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {COUNSEL_INTELLIGENCE_REPORT.sections.map((section) => <div key={section} className="flex items-center gap-2 rounded-lg border border-white/[0.05] px-3 py-2.5 text-xs text-white/48"><CheckCircle2 className="h-3.5 w-3.5 text-[var(--ms-gold)]/65" />{section}</div>)}
                </div>
              </div>
            </div>
          </section>

          <section id="counsel-desk" className="mt-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
              <div><p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--ms-gold)]/60">Recurring firm access</p><h2 className="mt-3 font-serif text-3xl">{COUNSEL_DESK.name}</h2><p className="mt-4 text-2xl font-semibold text-white">{COUNSEL_DESK.priceLabel}</p><p className="mt-4 text-sm leading-6 text-white/44">{COUNSEL_DESK.description}</p><Link href="/intake?audience=counsel&product=counsel-desk" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--ms-gold)]/35 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.13em] text-[var(--ms-gold)]">Request Counsel Desk<ArrowRight className="h-3.5 w-3.5" /></Link></div>
              <div className="grid gap-3 sm:grid-cols-2">{COUNSEL_DESK.capabilities.map((item) => <div key={item} className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-sm text-white/52">{item}</div>)}</div>
            </div>
          </section>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/[0.07] p-5 sm:p-6"><p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--ms-gold)]/55">Primary attorney profiles</p><div className="mt-4 flex flex-wrap gap-2">{COUNSEL_PRIMARY_PRACTICE_AREAS.map((area) => <span key={area} className="rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs text-white/48">{area}</span>)}</div></section>
            <section className="rounded-2xl border border-white/[0.07] p-5 sm:p-6"><p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--ms-gold)]/55">Priority corridors</p><div className="mt-4 flex flex-wrap gap-2">{COUNSEL_PRIORITY_CORRIDORS.map((corridor) => <span key={corridor} className="rounded-full border border-[var(--ms-gold)]/12 bg-[var(--ms-gold)]/[0.025] px-3 py-2 text-xs text-white/48">{corridor}</span>)}</div></section>
          </div>

          <p className="mt-10 text-xs leading-5 text-white/28">{COUNSEL_REPORT_BOUNDARY}</p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
