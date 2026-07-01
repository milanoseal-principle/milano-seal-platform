import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, ChevronRight } from "lucide-react";

const GLOBAL_DISCLAIMER =
  "The Milano Seal provides document coordination, notarization support, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country, receiving-authority, document-type, and signer-location requirements. Document execution coordination only. The Milano Seal™ does not provide legal guidance, tax advice, customs advice, immigration advice, medical advice, investment advice, asset appraisal, or Final acceptance remains subject to the receiving authority..";

const VERTICAL_DISCLAIMER =
  "The Milano Seal does not provide legal, tax, estate, investment, immigration, or financial advice. Final acceptance is subject to the receiving authority, foreign counsel, institution, government office, or professional advisor.";

const canonical = "https://themilanoseal.com/verticals/private-wealth";

export const metadata: Metadata = {
  title: "Private Wealth International Document Execution | The Milano Seal",
  description:
    "Premium U.S. document execution, apostille coordination, authentication routing, and courier custody support for family offices, HNWIs, estate counsel, foreign property, succession, and cross-border legal documents.",
  alternates: { canonical },
  openGraph: {
    title: "Private Wealth International Document Execution | The Milano Seal",
    description:
      "Premium U.S. document execution, apostille coordination, authentication routing, and courier custody support for family offices, HNWIs, estate counsel, foreign property, succession, and cross-border legal documents.",
    url: canonical,
    siteName: "The Milano Seal™",
    type: "website",
  },
};

const DOC_TYPES = [
  "International Powers of Attorney",
  "Foreign property documents",
  "Probate and estate affidavits",
  "Trust support documents",
  "Dual citizenship records",
  "Lineage affidavits",
  "Corporate authority records",
  "Banking or private client documents",
];

export default function PrivateWealthPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#050507] text-white pt-[var(--header-total-height)]">
        {/* Breadcrumb */}
        <nav className="max-w-5xl mx-auto px-6 pt-8 flex items-center gap-2" aria-label="Breadcrumb">
          <Link href="/" className="font-mono text-[10px] text-[#444] hover:text-[#666] tracking-widest uppercase transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-[#2A2A2A]" />
          <span className="font-mono text-[10px] text-[#C6A55A]/70 tracking-widest uppercase">Private Wealth</span>
        </nav>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-12 pb-10">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#C6A55A]/50 mb-3">
            Vertical · Private Wealth
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-medium leading-tight mb-6">
            Private Wealth &amp; Cross-Border Succession Document Support
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
                  Private wealth, foreign property, estate, citizenship, trust, and family office matters often require U.S. documents to be executed, notarized, apostilled, authenticated, translated, couriered, and released under careful control. The Milano Seal supports HNWIs, family offices, estate attorneys, foreign counsel, citizenship consultants, and private clients with structured U.S. document execution coordination for international use.
                </p>
              </div>

              {/* Document types */}
              <div>
                <h2 className="font-serif text-xl text-white mb-5">Documents Supported</h2>
                <ul className="space-y-3">
                  {DOC_TYPES.map((doc) => (
                    <li key={doc} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C6A55A]/60 mt-2 flex-shrink-0" />
                      <span className="text-[#909090]">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Internal links */}
              <div>
                <h2 className="font-serif text-xl text-white mb-4">Related Resources</h2>
                <nav className="space-y-2">
                  {[
                    { label: "What Is an Apostille?", href: "/learn/what-is-an-apostille" },
                    { label: "Italy Document Corridor", href: "/countries/italy" },
                    { label: "Portugal Document Corridor", href: "/countries/portugal" },
                    { label: "Spain Document Corridor", href: "/countries/spain" },
                    { label: "Greece Document Corridor", href: "/countries/greece" },
                    { label: "Global Document Atlas", href: "/map" },
                  ].map(({ label, href }) => (
                    <Link key={href} href={href} className="flex items-center justify-between py-1.5 text-[#555] hover:text-[#888] text-sm transition-colors group">
                      <span>{label}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Disclaimers */}
              <div className="pt-4 border-t border-white/[0.04]">
                <p className="font-mono text-[8px] text-[#2A2A2A] leading-relaxed mb-2">{VERTICAL_DISCLAIMER}</p>
                <p className="font-mono text-[8px] text-[#2A2A2A] leading-relaxed">{GLOBAL_DISCLAIMER}</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="relative rounded-xl border border-[#C6A55A]/20 bg-[#0A0A0A] p-5 sticky top-6"
                style={{ boxShadow: "0 0 0 1px rgba(198,165,90,0.06), 0 24px 48px rgba(0,0,0,0.6)" }}>
                <div className="absolute top-0 left-0 right-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-[#C6A55A]/50 to-transparent" />
                <p className="font-mono text-[8px] tracking-[0.06em] uppercase text-[#C6A55A]/70 mb-3">Private Matter Review</p>
                <p className="text-white font-serif text-lg leading-snug mb-4">Family Office &amp; HNWI Documents</p>
                <Link
                  href="/intake"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#C6A55A] text-[#050507] font-bold tracking-[0.12em] text-[11px] uppercase rounded-lg hover:bg-[#D4B76A] transition-colors mb-3"
                >
                  Start Private Matter Review <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/map"
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-white/[0.08] text-[#666] text-[11px] uppercase font-mono tracking-[0.1em] rounded-lg hover:border-[#C6A55A]/20 hover:text-[#888] transition-colors"
                >
                  Search the Atlas
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
