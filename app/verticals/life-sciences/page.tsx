import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, ChevronRight } from "lucide-react";

const GLOBAL_DISCLAIMER =
  "The Milano Seal provides document coordination, notarization support, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country, receiving-authority, document-type, and signer-location requirements. The Milano Seal does not provide legal advice, tax advice, customs advice, immigration advice, medical advice, investment advice, asset appraisal, or guaranteed foreign acceptance.";

const VERTICAL_DISCLAIMER =
  "The Milano Seal does not provide medical, legal, customs, or regulatory advice. Final use is subject to the receiving authority, institution, ministry, customs office, clinic, or legal counsel.";

const canonical = "https://themilanoseal.com/verticals/life-sciences";

export const metadata: Metadata = {
  title: "Life Sciences & Medical Document Apostille Support | The Milano Seal",
  description:
    "International document execution, notarization, apostille, authentication, and legalization routing support for medical clinics, laboratories, health records, affidavits, and cross-border healthcare documentation.",
  alternates: { canonical },
  openGraph: {
    title: "Life Sciences & Medical Document Apostille Support | The Milano Seal",
    description:
      "International document execution, notarization, apostille, authentication, and legalization routing support for medical clinics, laboratories, health records, affidavits, and cross-border healthcare documentation.",
    url: canonical,
    siteName: "The Milano Seal™",
    type: "website",
  },
};

const DOC_TYPES = [
  "Medical affidavits",
  "Professional credential documents",
  "Laboratory support documents",
  "Corporate medical entity records",
  "Consent or authorization documents",
  "Material transfer support documents",
  "Foreign clinic documentation packets",
  "Apostille or legalization routing packets",
];

export default function LifeSciencesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#050507] text-white pt-[var(--header-total-height)]">
        {/* Breadcrumb */}
        <nav className="max-w-5xl mx-auto px-6 pt-8 flex items-center gap-2" aria-label="Breadcrumb">
          <Link href="/" className="font-mono text-[10px] text-[#444] hover:text-[#666] tracking-widest uppercase transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-[#2A2A2A]" />
          <span className="font-mono text-[10px] text-[#C6A55A]/70 tracking-widest uppercase">Life Sciences</span>
        </nav>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-12 pb-10">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#C6A55A]/50 mb-3">
            Vertical · Life Sciences
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-medium leading-tight mb-6">
            Life Sciences &amp; Medical Document Execution Support
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
                  Medical, laboratory, and cross-border healthcare matters often require careful documentation, sworn statements, corporate records, professional credentials, consent documents, records authentication, and foreign-use routing review. The Milano Seal supports medical groups, clinics, laboratories, health professionals, consultants, and international patients with U.S. document execution coordination for documents intended for use abroad.
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
                    { label: "Hague vs. Non-Hague Countries", href: "/learn/hague-vs-non-hague-countries" },
                    { label: "Global Document Atlas", href: "/map" },
                    { label: "Begin Secure Intake", href: "/intake" },
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
                <p className="font-mono text-[8px] tracking-[0.06em] uppercase text-[#C6A55A]/70 mb-3">Medical Document Review</p>
                <p className="text-white font-serif text-lg leading-snug mb-4">Healthcare &amp; Laboratory Documents</p>
                <Link
                  href="/intake"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#C6A55A] text-[#050507] font-bold tracking-[0.12em] text-[11px] uppercase rounded-lg hover:bg-[#D4B76A] transition-colors mb-3"
                >
                  Request Medical Document Review <ArrowRight className="w-3.5 h-3.5" />
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
