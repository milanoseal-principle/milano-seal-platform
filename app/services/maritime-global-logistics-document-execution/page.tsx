import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { MARITIME_SAFETY_NOTICE } from "@/lib/maritime/maritimeSafety";
import { MARITIME_PUBLIC_PRICING_STATEMENT } from "@/lib/maritime/pricing/maritimePricingAdapter";

export const metadata: Metadata = {
  title: "Maritime & Global Logistics Document Execution | The Milano Seal™",
  description:
    "Time-sensitive U.S. document execution for maritime, customs, shipping, freight-forwarding, port, and international trade operations — notarization, authentication, translation, courier, and controlled release coordination.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://themilanoseal.com/services/maritime-global-logistics-document-execution" },
};

const USE_CASES = [
  "Yacht and vessel transactions",
  "USCG bills of sale and ownership transfers",
  "Customs broker authorizations and powers of attorney",
  "Freight-forwarder and shipping-company documents",
  "Preferred ship mortgages and marine finance documents",
  "International vessel registration and foreign-registry packets",
  "Corporate authorizations and certificates of incumbency used abroad",
  "Crew and vessel documents",
];

const PATHWAY = [
  "Intake & signer-authority review",
  "Destination & receiving-authority requirements",
  "Execution method (RON / field / hybrid)",
  "Quote & payment confirmation",
  "Execution & quality assurance",
  "Apostille / authentication coordination",
  "Translation coordination where required",
  "Courier & controlled handoff",
  "Chain-of-custody visibility through release",
];

export default function MaritimeServicePage() {
  return (
    <>
      <Header />
      <main className="bg-[#060606] min-h-screen overflow-x-hidden" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}>
        <div className="mx-auto max-w-5xl px-5 sm:px-6 py-10 md:py-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70 mb-3">Maritime &amp; Global Logistics Execution</p>
          <h1 className="font-serif text-3xl md:text-5xl text-white leading-tight mb-4">
            Time-Sensitive Document Execution for <em className="text-[var(--ms-gold)]">Maritime &amp; Logistics</em>
          </h1>
          <p className="text-white/55 text-sm md:text-base leading-relaxed max-w-2xl mb-8">
            When documentation affects a vessel, cargo movement, customs process, international transaction, crew matter, or shipment deadline,
            The Milano Seal coordinates the execution pathway from intake through notarization, authentication, translation, courier handling,
            and controlled release.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            <section>
              <h2 className="font-serif text-xl text-white mb-3">Common Use Cases</h2>
              <ul className="space-y-2">
                {USE_CASES.map((u) => (
                  <li key={u} className="text-[13px] leading-snug text-white/60">• {u}</li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="font-serif text-xl text-white mb-3">Execution Pathway</h2>
              <ol className="space-y-2">
                {PATHWAY.map((p, i) => (
                  <li key={p} className="flex gap-2 text-[13px] leading-snug text-white/60">
                    <span className="font-mono text-[10px] text-[var(--ms-gold)]/70">{String(i + 1).padStart(2, "0")}</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="mt-10 rounded-xl border border-[var(--ms-gold)]/15 bg-[var(--ms-gold)]/[0.02] p-5">
            <h2 className="font-serif text-lg text-white mb-2">Commercial Account Support</h2>
            <p className="text-[13px] leading-relaxed text-white/55 mb-3">
              Customs brokers, freight forwarders, yacht brokerages, marinas, and maritime law firms can establish a priority desk with a
              dedicated intake route, approved requesters, account-specific workflow, and consolidated reporting.
            </p>
            <p className="font-mono text-[10px] leading-relaxed text-white/40">{MARITIME_PUBLIC_PRICING_STATEMENT}</p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/intake?category=maritime" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--ms-gold)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#050507] transition-colors hover:bg-[var(--ms-gold)]/90">
              Begin Commercial Intake
            </Link>
            <Link href="/contact?topic=maritime-capability-packet" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[var(--ms-gold)]/30 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ms-gold)] transition-colors hover:border-[var(--ms-gold)]/60">
              Request Maritime Capability Packet
            </Link>
          </div>

          <p className="mt-10 border-t border-white/[0.06] pt-4 font-mono text-[9px] leading-relaxed text-white/30">{MARITIME_SAFETY_NOTICE}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
