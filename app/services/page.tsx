import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Services | International Document Execution | The Milano Seal™",
  description:
    "International Document Execution, U.S.-Based Apostille Coordination, Remote Online Notarization review, Florida Mobile Notary Coordination, Witness Coordination, and Secure Final Packet Release for documents used abroad.",
};

const SERVICES = [
  {
    title: "International Document Execution",
    body: "Structured intake, route review, execution coordination, and release controls for U.S. documents intended for use abroad.",
  },
  {
    title: "U.S.-Based Apostille Coordination",
    body: "Apostille and authentication routing support for eligible U.S.-origin documents, subject to receiving-authority requirements.",
  },
  {
    title: "Remote Online Notarization",
    body: "RON availability depends on document type, signer location, jurisdiction, platform eligibility, and receiving-authority requirements.",
  },
  {
    title: "Florida Mobile Notary Coordination",
    body: "Mobile execution review for matters where wet-ink, witness, signer-location, or receiving-authority expectations require in-person handling.",
  },
  {
    title: "Witness Coordination",
    body: "Witness needs are identified before execution so the signing session aligns with document and destination requirements.",
  },
  {
    title: "Secure Final Packet Release",
    body: "Final packet release stays payment-gated and chain-of-custody controlled through courier handoff and tracking review.",
  },
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <Header />
      <section className="px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70">
            Secure International Document Execution & Authentication Infrastructure
          </p>
          <h1 className="mt-5 max-w-4xl font-serif text-4xl font-normal leading-tight text-white sm:text-5xl">
            Built for international document control, not commodity notarization.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/62 sm:text-base">
            The Milano Seal coordinates U.S.-origin document execution, apostille/authentication routing, eligible Remote Online Notarization review, Florida mobile notary coordination, witness coordination, payment-gated release, and final packet custody for documents used abroad.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/intake"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--ms-gold)] px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#050507] transition-colors hover:bg-[#D4B76A]"
            >
              Begin Secure Intake
            </Link>
            <Link
              href="/map"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--ms-gold)]/30 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ms-gold)] transition-colors hover:border-[var(--ms-gold)]/60"
            >
              Explore Global Document Intelligence™
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <article
              key={service.title}
              className="rounded-2xl border border-[var(--ms-gold)]/15 bg-[#0B0B0D] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
              data-critical-card=""
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--ms-gold)]/60">
                Milano Seal Service
              </p>
              <h2 className="mt-3 font-serif text-xl font-normal text-[#E8DCC0]">
                {service.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/58">
                {service.body}
              </p>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-6xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-white/55">
          The Milano Seal is not a law firm and does not provide legal counsel. Execution pathways, RON suitability, apostille/authentication routing, and courier release remain subject to receiving-authority review.
        </div>
      </section>
      <Footer />
    </main>
  );
}
