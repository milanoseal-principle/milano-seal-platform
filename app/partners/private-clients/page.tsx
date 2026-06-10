import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { User, CheckCircle, ArrowRight, Shield, Lock, FileCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Private Client Notary & Document Services | The Milano Seal™",
  description:
    "Estate planning documents, personal affidavits, powers of attorney, and family matters executed with the highest level of discretion. Private client notary services in Florida.",
  alternates: { canonical: "https://themilanoseal.com/partners/private-clients" },
};

const services = [
  "Estate planning document execution and notarization",
  "Personal statutory affidavit preparation",
  "Durable and special power of attorney notarization",
  "Family matter document execution with full discretion",
  "Asset protection document coordination",
  "Personal affidavit of identity and residence",
  "Private trust document notarization",
  "Apostille for personal documents intended for foreign use",
];

const faqs = [
  {
    q: "Can personal documents be executed remotely through RON?",
    a: "Many personal documents qualify for Remote Online Notarization in Florida. Document type eligibility is confirmed at intake before scheduling.",
  },
  {
    q: "How are sensitive family matters handled?",
    a: "Private client matters are handled with complete discretion. All matter details remain strictly confidential within the scope of the notarial engagement.",
  },
  {
    q: "Do you offer after-hours scheduling for personal matters?",
    a: "Evening and weekend appointments are available for private clients. Submit your preferred scheduling window through the intake form.",
  },
];

export default function PrivateClientsPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <User className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">For Private Clients</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Estate Documents, Personal Affidavits &amp; Family Matters
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            Personal legal document execution with the highest level of discretion and care. Estate planning, powers of attorney, and family matters handled privately and professionally.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Start Private Matter</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8 text-center">
            Private Client Services
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
            { icon: Lock, title: "Complete Discretion", body: "Private client matters handled with full confidentiality. No details shared beyond the notarial engagement scope." },
            { icon: Shield, title: "Identity Verified", body: "Multi-factor identity verification ensures document integrity for estate and personal legal matters." },
            { icon: FileCheck, title: "International Ready", body: "Apostille coordination available for personal documents requiring foreign use or recognition." },
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
            Start Your Private Matter
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Submit your document type and scheduling preference. All details remain strictly confidential.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Start Private Matter</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <p className="mt-8 text-xs text-[#4A4A4A] leading-relaxed max-w-lg mx-auto">
            The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. The Milano Seal does not provide legal, tax, investment, banking, fiduciary, or estate planning advice.</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
