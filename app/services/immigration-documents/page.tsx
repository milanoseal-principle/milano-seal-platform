import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, FileText, CheckSquare, ShieldCheck, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Immigration Document Support | The Milano Seal™",
  description:
    "Notarization, affidavit execution, and document coordination for USCIS and immigration-related matters. Identity-verified execution and structured administrative support.",
  keywords: [
    "immigration document notarization",
    "USCIS document support",
    "affidavit notarization Florida",
    "immigration affidavit",
    "notarize immigration documents",
    "Florida immigration document support",
  ],
  alternates: { canonical: "https://themilanoseal.com/services/immigration-documents" },
};

const FEATURES = [
  { icon: FileText,    label: "Affidavit Execution",         detail: "Sworn affidavits and supporting declarations notarized with identity verification and record of execution." },
  { icon: CheckSquare, label: "Document Sequencing",         detail: "Administrative review of document order, completeness, and formatting requirements prior to submission." },
  { icon: ShieldCheck, label: "Identity Validation",         detail: "Multi-factor identity verification through approved RON procedures or in-person examination before notarization." },
  { icon: Globe,        label: "Cross-Border Coordination",   detail: "Where foreign-destination documents require apostille or legalization, routing coordinated from the same matter." },
];

const PROCESS = [
  "Submit your document details and intended submission destination through secure intake.",
  "Document type and administrative requirements reviewed for sequencing and format compliance.",
  "Identity verification completed — remote online or in-person depending on document requirements.",
  "Affidavit or supporting document notarized with tamper-evident digital or physical seal.",
  "Executed document delivered digitally or dispatched per your submission instructions.",
];

const DISCLAIMER =
  "I am not an attorney. Document notarization and execution services are administrative in nature and do not constitute legal advice or legal representation. Legal services are provided by Demesmin & Dover PLLC. Acceptance of any notarized or authenticated document rests with the receiving authority.";

export default function ImmigrationDocumentsPage() {
  return (
    <>
      <Header />
      <main className="bg-[#050507] min-h-screen">
        {/* Hero */}
        <section className="pt-28 pb-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-medium mb-4">
              Service — Document Coordination
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-6 text-balance">
              Immigration Document Support
            </h1>
            <p className="text-[#B0B0B0] text-lg max-w-2xl leading-relaxed mb-8">
              Notarization, affidavit execution, and document sequencing for USCIS and
              immigration-related matters. Identity-verified execution through approved
              procedures. Administrative coordination only — not legal advice.
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C6A55A] text-[#0A0A0A] font-semibold text-sm rounded-xl hover:bg-[#D4BB7A] transition-colors duration-200"
            >
              Submit Your Matter
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl font-medium text-white mb-8">Service Components</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {FEATURES.map((f) => (
                <div key={f.label} className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl p-6">
                  <div className="inline-flex p-2.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
                    <f.icon className="w-5 h-5 text-[#C6A55A]" />
                  </div>
                  <h3 className="text-white font-medium text-sm mb-2">{f.label}</h3>
                  <p className="text-[#8A8A8A] text-xs leading-relaxed">{f.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl font-medium text-white mb-8">Execution Sequence</h2>
            <ol className="space-y-4">
              {PROCESS.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="font-serif text-2xl font-medium text-[#C6A55A]/30 flex-shrink-0 w-8">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[#B0B0B0] text-sm leading-relaxed pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-8 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <p className="text-[#555] text-xs leading-relaxed">{DISCLAIMER}</p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-2xl font-medium text-white mb-4">Ready to Begin?</h2>
            <p className="text-[#8A8A8A] text-sm mb-8 max-w-md mx-auto">
              Submit your document and destination details. Administrative coordination handled from intake through delivery.
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C6A55A] text-[#0A0A0A] font-semibold text-sm rounded-xl hover:bg-[#D4BB7A] transition-colors duration-200"
            >
              Start Your Matter
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
