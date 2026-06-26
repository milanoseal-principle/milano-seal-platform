import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, ChevronRight } from "lucide-react";

const GLOBAL_DISCLAIMER =
  "The Milano Seal provides document coordination, notarization support, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country, receiving-authority, document-type, and signer-location requirements. The Milano Seal does not provide legal advice, tax advice, customs advice, immigration advice, medical advice, investment advice, asset appraisal, or guaranteed foreign acceptance.";

const canonical = "https://themilanoseal.com/professionals/family-offices";

export const metadata: Metadata = {
  title: "International Document Execution for Family Offices | The Milano Seal",
  description:
    "Premium U.S. document execution, apostille coordination, authentication routing, and courier custody support for family offices, HNWIs, and cross-border private-client matters.",
  alternates: { canonical },
  openGraph: {
    title: "International Document Execution for Family Offices | The Milano Seal",
    description:
      "Premium U.S. document execution, apostille coordination, authentication routing, and courier custody support for family offices, HNWIs, and cross-border private-client matters.",
    url: canonical,
    siteName: "The Milano Seal™",
    type: "website",
  },
};

const USE_CASES = [
  "Foreign property powers of attorney",
  "Private banking documents",
  "Trust and estate support documents",
  "Citizenship or lineage records",
  "Luxury asset transaction documents",
  "Yacht or vessel documents",
  "Corporate authority documents",
  "Courier release packets",
];

export default function FamilyOfficesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#050507] text-white pt-[var(--header-total-height)]">
        {/* Breadcrumb */}
        <nav className="max-w-5xl mx-auto px-6 pt-8 flex items-center gap-2" aria-label="Breadcrumb">
          <Link href="/" className="font-mono text-[10px] text-[#444] hover:text-[#666] tracking-widest uppercase transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-[#2A2A2A]" />
          <Link href="/professionals" className="font-mono text-[10px] text-[#444] hover:text-[#666] tracking-widest uppercase transition-colors">Professionals</Link>
          <ChevronRight className="w-3 h-3 text-[#2A2A2A]" />
          <span className="font-mono text-[10px] text-[#C6A55A]/70 tracking-widest uppercase">Family Offices</span>
        </nav>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-12 pb-10">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#C6A55A]/50 mb-3">
            Professionals · Family Offices
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-medium leading-tight mb-6">
            Family Office Document Execution &amp; Cross-Border Release Support
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-[#C6A55A]/25 to-transparent mb-8" />
        </section>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-8">
              <div className="rounded-xl border border-[#C6A55A]/12 bg-[#C6A55A]/[0.04] p-6">
                <p className="text-[#C0C0C0] leading-relaxed">
                  Family offices and private-client advisors often need U.S. documents executed, notarized, apostilled, authenticated, translated, couriered, or released for international property, banking, estate, succession, citizenship, luxury asset, and corporate matters. The Milano Seal provides structured execution support for high-control document workflows where timing, privacy, and procedural clarity matter.
                </p>
              </div>

              {/* Use cases */}
              <div>
                <h2 className="font-serif text-xl text-white mb-5">Use Cases</h2>
                <ul className="space-y-3">
                  {USE_CASES.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C6A55A]/60 mt-2 flex-shrink-0" />
                      <span className="text-[#909090]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimers */}
              <div className="pt-4 border-t border-white/[0.04]">
                <p className="font-mono text-[8px] text-[#2A2A2A] leading-relaxed mb-2">
                  The Milano Seal does not provide legal, tax, investment, immigration, customs, medical, or financial advice.
                </p>
                <p className="font-mono text-[8px] text-[#2A2A2A] leading-relaxed">{GLOBAL_DISCLAIMER}</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="relative rounded-xl border border-[#C6A55A]/20 bg-[#0A0A0A] p-5 sticky top-6"
                style={{ boxShadow: "0 0 0 1px rgba(198,165,90,0.06), 0 24px 48px rgba(0,0,0,0.6)" }}>
                <div className="absolute top-0 left-0 right-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-[#C6A55A]/50 to-transparent" />
                <p className="font-mono text-[8px] tracking-[0.06em] uppercase text-[#C6A55A]/70 mb-3">Private Matter Review</p>
                <p className="text-white font-serif text-lg leading-snug mb-4">Family Office Document Coordination</p>
                <Link
                  href="/intake"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#C6A55A] text-[#050507] font-bold tracking-[0.12em] text-[11px] uppercase rounded-lg hover:bg-[#D4B76A] transition-colors mb-3"
                >
                  Start Private Matter Review <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
