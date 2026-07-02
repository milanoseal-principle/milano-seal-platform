import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Heart, CheckCircle, ArrowRight, Shield, FileCheck, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Medical Document Notarization | The Milano Seal™",
  description:
    "HIPAA authorization notarization, medical affidavits, healthcare directives, and patient documentation. Discreet, compliant execution for medical providers and healthcare facilities.",
  alternates: { canonical: "https://themilanoseal.com/partners/medical" },
};

const services = [
  "HIPAA information disclosure authorization notarization",
  "Medical record affidavit execution",
  "Patient consent form notarization",
  "Healthcare directive and advance directive execution",
  "Provider relationship verification documentation",
  "Medical power of attorney notarization",
  "Hospital and care facility on-location mobile notary",
  "Sensitive patient documentation with full discretion",
];

const faqs = [
  {
    q: "Do you have experience with hospital and memory care facility visits?",
    a: "Yes. Mobile notary services are available for hospitals, skilled nursing facilities, memory care facilities, and similar settings. Scheduling and access requirements are confirmed at intake.",
  },
  {
    q: "How is patient confidentiality maintained?",
    a: "All matters are handled with strict confidentiality. No patient information is retained beyond the administrative requirements of the notarization event. Records are stored securely.",
  },
  {
    q: "Can advance directives and healthcare POAs be executed via RON?",
    a: "Florida RON is available for qualifying documents. Whether a specific document type qualifies for remote execution is confirmed at intake based on Florida statutory requirements.",
  },
];

export default function MedicalPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <Heart className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">For Medical Providers</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Medical Document Execution &amp; Compliance
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            HIPAA authorizations, medical affidavits, and sensitive patient documentation handled with the highest level of discretion and compliance awareness.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Review Medical Documentation</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8 text-center">
            Medical Document Services
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

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: Lock, title: "Strict Confidentiality", body: "Patient information handled with full discretion. No data retained beyond notarial record requirements." },
            { icon: Shield, title: "HIPAA-Aware Process", body: "Documentation workflows structured with awareness of HIPAA information handling requirements." },
            { icon: FileCheck, title: "Facility Visits", body: "Mobile notary available for hospitals, care facilities, and patient locations where remote execution is not suitable." },
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

      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-medium text-white mb-8 text-center">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-6 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl">
                <h3 className="font-medium text-white mb-2 text-sm">{faq.q}</h3>
                <p className="text-[#B0B0B0] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
            Coordinate Medical Documentation
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Submit document type and location preference. We confirm scheduling, access requirements, and logistics before dispatch.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Review Medical Documentation</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <p className="mt-8 text-xs text-[#4A4A4A] leading-relaxed max-w-lg mx-auto">
            The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. The Milano Seal does not provide medical advice, treatment recommendations, healthcare compliance advice, or legal guidance. Medical and legal questions should be handled by qualified professionals.</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
