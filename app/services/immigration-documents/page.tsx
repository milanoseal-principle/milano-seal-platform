import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Users, CheckCircle, ArrowRight, FileCheck, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "USCIS Document Support & Immigration Documents | The Milano Seal™",
  description:
    "Affidavit preparation, translation coordination, and notarization support for USCIS immigration documents. Identity verification and administrative coordination for immigration-related paperwork.",
  alternates: { canonical: "https://themilanoseal.com/services/immigration-documents" },
};

const services = [
  "Affidavit of support preparation and notarization",
  "Sworn statement notarization for USCIS submissions",
  "Document translation coordination (certified translators)",
  "Identity verification for immigration-related submissions",
  "Power of attorney for immigration matters",
  "Apostille coordination for foreign document use",
  "Birth certificate and civil document authentication",
  "Supporting declaration notarization",
];

export default function ImmigrationDocumentsPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <Users className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">USCIS Document Support</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Affidavit, Translation &amp; Support Execution
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            Administrative coordination and notarization support for immigration-related documents. Document sequencing, identity validation workflows, and USCIS submission preparation.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Start Immigration Document Matter</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8 text-center">
            Document Services Covered
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {services.map((s) => (
              <div key={s} className="flex items-start gap-3 p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg">
                <CheckCircle className="w-5 h-5 text-[#C6A55A] flex-shrink-0 mt-0.5" />
                <span className="text-[#B0B0B0] text-sm">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: Users, title: "Identity Verified", body: "Multi-factor identity verification per Florida notarial requirements before execution." },
            { icon: FileCheck, title: "USCIS-Ready Format", body: "Documents structured and sealed for USCIS submission standards." },
            { icon: Globe, title: "Translation Coordination", body: "Certified translation services coordinated for foreign-language document requirements." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 text-center">
              <div className="inline-flex p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
                <Icon className="w-6 h-6 text-[#C6A55A]" />
              </div>
              <h3 className="font-medium text-white mb-2">{title}</h3>
              <p className="text-sm text-[#B0B0B0]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer Notice */}
      <section className="py-8 px-6 bg-[#111111]">
        <div className="max-w-3xl mx-auto p-6 border border-[#2A2A2A] rounded-xl">
          <p className="text-sm text-[#6A6A6A] leading-relaxed text-center">
            This service covers document sequencing, identity validation workflows, and administrative coordination only. We do not provide immigration legal advice, case strategy, or representation. Consult a licensed immigration attorney for legal guidance.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
            Begin Your Document Execution
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Submit your document type, purpose, and any deadlines. We will confirm the required notarization and coordination steps.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Submit Document Matter</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <p className="mt-8 text-xs text-[#4A4A4A] leading-relaxed max-w-lg mx-auto">
            The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. The Milano Seal does not provide legal advice. Legal questions should be handled by a licensed attorney.</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
