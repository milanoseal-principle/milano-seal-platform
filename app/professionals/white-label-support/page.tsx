import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, ChevronRight } from "lucide-react";

const GLOBAL_DISCLAIMER =
  "The Milano Seal provides document coordination, notarization support, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country, receiving-authority, document-type, and signer-location requirements. The Milano Seal does not provide legal advice, tax advice, customs advice, immigration advice, medical advice, investment advice, asset appraisal, or guaranteed foreign acceptance.";

const canonical = "https://themilanoseal.com/professionals/white-label-support";

export const metadata: Metadata = {
  title: "White-Label Document Execution Support | The Milano Seal",
  description:
    "White-label U.S. document execution support for professional firms needing notarization, apostille, courier custody, and release workflows without building internal operations.",
  alternates: { canonical },
  openGraph: {
    title: "White-Label Document Execution Support | The Milano Seal",
    description:
      "White-label U.S. document execution support for professional firms needing notarization, apostille, courier custody, and release workflows without building internal operations.",
    url: canonical,
    siteName: "The Milano Seal™",
    type: "website",
  },
};

const SUPPORT_MODELS = [
  "Professional referral workflow",
  "Partner intake link",
  "Co-branded handoff",
  "White-label document execution support",
  "Status visibility for referred matters",
  "Document packet review support",
];

export default function WhiteLabelSupportPage() {
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
          <span className="font-mono text-[10px] text-[#C6A55A]/70 tracking-widest uppercase">White-Label Support</span>
        </nav>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-12 pb-10">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#C6A55A]/50 mb-3">
            Professionals · White-Label
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-medium leading-tight mb-6">
            White-Label Execution Support for Professional Firms
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
                  The Milano Seal supports professional firms that need a structured U.S. execution layer for international document workflows without building internal notarization, apostille, courier custody, or release review operations from scratch.
                </p>
              </div>

              {/* Support models */}
              <div>
                <h2 className="font-serif text-xl text-white mb-5">Support Models</h2>
                <ul className="space-y-3">
                  {SUPPORT_MODELS.map((item) => (
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
                  White-label support is subject to partner review, compliance requirements, security readiness, and operational fit.
                </p>
                <p className="font-mono text-[8px] text-[#2A2A2A] leading-relaxed">{GLOBAL_DISCLAIMER}</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="relative rounded-xl border border-[#C6A55A]/20 bg-[#0A0A0A] p-5 sticky top-6"
                style={{ boxShadow: "0 0 0 1px rgba(198,165,90,0.06), 0 24px 48px rgba(0,0,0,0.6)" }}>
                <div className="absolute top-0 left-0 right-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-[#C6A55A]/50 to-transparent" />
                <p className="font-mono text-[8px] tracking-[0.06em] uppercase text-[#C6A55A]/70 mb-3">Partner Inquiry</p>
                <p className="text-white font-serif text-lg leading-snug mb-4">White-Label Execution Support</p>
                <Link
                  href="/intake"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#C6A55A] text-[#050507] font-bold tracking-[0.12em] text-[11px] uppercase rounded-lg hover:bg-[#D4B76A] transition-colors mb-3"
                >
                  Request White-Label Support <ArrowRight className="w-3.5 h-3.5" />
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
