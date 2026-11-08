import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Building, CheckCircle, ArrowRight, Monitor, Globe, FileCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Notary & Apostille Services for Real Estate Professionals | The Milano Seal™",
  description:
    "Remote closing coordination, power of attorney notarization, and international buyer documentation. RON-certified for digital closings. Florida apostille and cross-border real estate execution.",
  alternates: { canonical: "https://themilanoseal.com/partners/real-estate" },
};

const services = [
  "Remote Online Notarization (RON) for digital closings",
  "Power of attorney notarization and apostille coordination",
  "International buyer document verification and execution",
  "Non-resident seller documentation sequencing",
  "Closing document execution with precision timing",
  "Apostille for foreign real estate transaction documents",
  "Mobile notary for in-person closing coordination",
  "Title company and lender document coordination",
];

const faqs = [
  {
    q: "Can you handle closings where the buyer is located outside the United States?",
    a: "Yes. RON is available for qualifying real estate documents. International buyers can execute remotely through an approved RON platform with identity verification.",
  },
  {
    q: "Do you coordinate with title companies and lenders directly?",
    a: "We work within the closing coordinator's established workflow. Provide the required document set and timeline and we will confirm execution logistics.",
  },
  {
    q: "What RON platform compatibility do you support?",
    a: "We use Florida-approved RON platforms. Platform-specific requirements are confirmed at scheduling to ensure compatibility with the title company's acceptance standards.",
  },
];

export default function RealEstatePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <section className="pt-[calc(var(--header-total-height)+var(--sa-top)+2rem)] pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <Building className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">For Real Estate Professionals</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Remote Closing Coordination &amp; Document Execution
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            Closing documents, powers of attorney, and international buyer verification. Precision timing and location flexibility for real estate transactions of all complexity.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Start Real Estate Matter</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8 text-center">
            Real Estate Services
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
            { icon: Monitor, title: "RON-Certified", body: "Remote Online Notarization for digital closings with identity verification and encrypted sessions." },
            { icon: Globe, title: "International Buyers", body: "Cross-border buyer execution coordinated for non-resident clients in foreign jurisdictions." },
            { icon: FileCheck, title: "Apostille Included", body: "Apostille coordination available for documents requiring international acceptance." },
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
            Start Your Real Estate Matter
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Submit document type, location or remote preference, and closing timeline. We confirm logistics before anything is scheduled.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Start Real Estate Matter</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <p className="mt-8 text-xs text-[#4A4A4A] leading-relaxed max-w-lg mx-auto">
            The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. Document execution coordination only. The Milano Seal™ does not provide legal guidance. Legal questions should be handled by a licensed attorney.</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
