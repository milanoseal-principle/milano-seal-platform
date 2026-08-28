import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, FileSearch2, ShieldCheck, Sparkles, Users2 } from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { COUNSEL_DESK, COUNSEL_INTELLIGENCE_REPORT } from "@/data/counsel-intelligence";
import { MILANO_PAYMENT_SCHEDULING_LINE } from "@/data/milano-revenue-copy-system";

export const metadata: Metadata = {
  title: "Choose Your Milano Seal Execution Path | The Milano Seal™",
  description:
    "Start an international execution Matter, commission cross-border execution intelligence, enter the counsel desk, or request concierge execution.",
};

const PRIMARY_PATHS = [
  {
    eyebrow: "Client Execution",
    title: "I need a document executed",
    body: "Open one controlled Matter. Intake captures document type, origin, destination, signer requirements, and timeline before a quote or scheduling authorization is issued.",
    price: "Dynamic Matter pricing",
    href: "/intake",
    cta: "Begin Secure Intake",
    icon: ShieldCheck,
    tone: "primary",
  },
  {
    eyebrow: "Execution Intelligence",
    title: COUNSEL_INTELLIGENCE_REPORT.name,
    body: "Matter-specific route intelligence for clients or counsel who need the execution path, authority matrix, readiness requirements, rejection risks, custody plan, and evidence appendix before execution.",
    price: COUNSEL_INTELLIGENCE_REPORT.priceLabel,
    href: "/lawyer-access#execution-intelligence-report",
    cta: "View Intelligence Report",
    icon: FileSearch2,
    tone: "secondary",
  },
  {
    eyebrow: "For Counsel",
    title: COUNSEL_DESK.name,
    body: "Recurring professional access for U.S. and foreign counsel managing U.S.-origin documents for international use, with route intelligence, client-ready instructions, Matter visibility, and priority review.",
    price: COUNSEL_DESK.priceLabel,
    href: "/lawyer-access#counsel-desk",
    cta: "Open Counsel Desk",
    icon: BriefcaseBusiness,
    tone: "secondary",
  },
  {
    eyebrow: "Private Client / Complex",
    title: "Concierge International Execution",
    body: "For urgent, attorney-led, private-client, family-office, multi-document, high-value, or non-standard matters requiring elevated review and controlled execution coordination.",
    price: "Custom",
    href: "/intake?service=concierge",
    cta: "Request Concierge Review",
    icon: Sparkles,
    tone: "secondary",
  },
] as const;

export default function Page() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050507] text-white">
      <Header />
      <section
        className="relative px-4 pb-20 sm:px-6"
        style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top) + 3rem)" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,165,90,0.12),transparent_35%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--ms-gold)]/70">Execution Access</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">
              Tell us what you need done. <span className="italic text-[var(--ms-gold)]">We route the execution.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
              Clients buy an outcome. Counsel buys execution intelligence and repeatability. Private clients buy control. Network applicants enter separately.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {PRIMARY_PATHS.map((path) => {
              const Icon = path.icon;
              const primary = path.tone === "primary";
              return (
                <article
                  key={path.title}
                  className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${primary ? "border-[var(--ms-gold)]/45 bg-[var(--ms-gold)]/[0.07] shadow-[0_30px_100px_rgba(198,165,90,0.08)]" : "border-white/[0.08] bg-white/[0.025]"}`}
                >
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--ms-gold)]/65">{path.eyebrow}</p>
                      <h2 className="mt-3 font-serif text-2xl text-white sm:text-3xl">{path.title}</h2>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ms-gold)]/20 bg-black/30">
                      <Icon className="h-5 w-5 text-[var(--ms-gold)]" />
                    </div>
                  </div>
                  <p className="mt-5 max-w-xl text-sm leading-6 text-white/52">{path.body}</p>
                  <div className="mt-7 flex flex-col gap-4 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/72">{path.price}</span>
                    <Link href={path.href} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.13em] ${primary ? "bg-[var(--ms-gold)] text-[#050507]" : "border border-[var(--ms-gold)]/30 text-[var(--ms-gold)] hover:border-[var(--ms-gold)]/60"}`}>
                      {path.cta}<ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-[var(--ms-gold)]/20 bg-black/30 p-5 sm:p-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--ms-gold)]/60">Payment authority</p>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-white/50">{MILANO_PAYMENT_SCHEDULING_LINE}</p>
          </div>

          <section className="mt-16 border-t border-white/[0.07] pt-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">Supply-side network</p>
                <h2 className="mt-3 font-serif text-2xl text-white">Work with The Milano Seal</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Alliance and operations applications are not client products and are intentionally separated from commercial execution pricing.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/alliance/apply" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/[0.10] px-5 py-3 text-sm text-white/65 hover:border-[var(--ms-gold)]/30 hover:text-white"><Users2 className="h-4 w-4" />Alliance Network</Link>
                <Link href="/va/apply" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/[0.10] px-5 py-3 text-sm text-white/65 hover:border-[var(--ms-gold)]/30 hover:text-white"><Building2 className="h-4 w-4" />Operations / VA</Link>
              </div>
            </div>
          </section>

          <p className="mt-12 text-xs leading-5 text-white/30">The Milano Seal is not a law firm and does not provide legal advice. Routing intelligence is operational and execution-focused. Final acceptance remains subject to the receiving authority.</p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
