import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { MARITIME_SAFETY_NOTICE } from "@/lib/maritime/maritimeSafety";

export const metadata: Metadata = {
  title: "Port Tampa Bay Document Execution | The Milano Seal™",
  description:
    "Port-area document execution coordination for maritime, customs, freight, and logistics organizations operating through Port Tampa Bay — urgent notarization, authentication, and international routing support.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://themilanoseal.com/ports/port-tampa-bay-document-execution" },
};

export default function PortTampaBayPage() {
  return (
    <>
      <Header />
      <main className="bg-[#060606] min-h-screen overflow-x-hidden" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}>
        <div className="mx-auto max-w-4xl px-5 sm:px-6 py-10 md:py-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70 mb-3">Port-Area Document Execution</p>
          <h1 className="font-serif text-3xl md:text-4xl text-white leading-tight mb-4">Port Tampa Bay Document Execution</h1>
          <p className="text-white/55 text-sm md:text-base leading-relaxed max-w-2xl mb-6">
            The Milano Seal coordinates time-sensitive document execution for customs brokers, freight forwarders, shipping companies,
            port agents, vessel operators, and maritime attorneys operating through the Port Tampa Bay area — including urgent notarization,
            corporate authorization, apostille/authentication routing, and controlled courier handoffs.
          </p>
          <ul className="space-y-2 mb-8">
            {[
              "Urgent signer and corporate-authorization coordination",
              "USCG and vessel ownership-transfer documents",
              "Customs broker and freight-forwarder authorizations",
              "International registry and apostille/authentication routing",
              "After-hours and courier-cutoff coordination",
              "Recurring commercial account support",
            ].map((x) => <li key={x} className="text-[13px] leading-snug text-white/60">• {x}</li>)}
          </ul>
          <Link href="/intake?category=maritime&source=port-tampa-bay" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--ms-gold)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#050507] transition-colors hover:bg-[var(--ms-gold)]/90">
            Begin Commercial Intake
          </Link>
          <p className="mt-10 border-t border-white/[0.06] pt-4 font-mono text-[9px] leading-relaxed text-white/30">
            No port approval, terminal access, or carrier affiliation is claimed. {MARITIME_SAFETY_NOTICE}
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
