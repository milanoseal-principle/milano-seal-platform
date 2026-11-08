import type { Metadata } from "next";
import Link from "next/link";
import { CommercialCtaRow } from "@/components/conversion/CommercialCtaRow";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Globe2, CheckCircle, ArrowRight, FileCheck, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "International Document Execution | The Milano Seal™",
  description:
    "Structured preparation, notarization, and coordination of U.S. documents for foreign jurisdictions. Hague routing, embassy protocols, cross-border authentication, and destination validation.",
  alternates: { canonical: "https://themilanoseal.com/services/international-execution" },
};

const steps = [
  { title: "Jurisdiction Analysis", body: "Algorithmic routing validation matches your target embassy, consulate, or apostille authority. Hague Convention member status determines the authentication path." },
  { title: "Document Structuring", body: "Alignment of execution blocks with cross-border standards. Document format, language requirements, and notarial language reviewed before execution." },
  { title: "Notarization & Execution", body: "Documents are notarized under Florida law and sealed. RON or in-person mobile execution available depending on document type and jurisdiction requirements." },
  { title: "Authentication Routing", body: "Apostille or consular legalization sequence initiated based on destination authority requirements. Chain-of-custody maintained throughout." },
  { title: "Compliance Verification", body: "Strict administrative checking of identity credentials prior to final seal deployment. Compliance with destination-country intake requirements verified." },
  { title: "International Delivery", body: "Structured release to the destination authority or client. Physical courier coordination for jurisdictions requiring original documents." },
];

export default function InternationalExecutionPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      {/* Hero */}
      <section className="pt-[calc(var(--header-total-height)+var(--sa-top)+2rem)] pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <Globe2 className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">International Execution</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Hague Routing &amp; Cross-Border Authentication
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            Structured preparation and coordination of U.S. documents for foreign jurisdictions. Jurisdiction analysis, document structuring, and full compliance verification before execution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/intake"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
            >
              <span>Begin International Matter</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/countries"
              className="inline-flex items-center gap-3 px-8 py-4 bg-transparent text-[#C6A55A] border border-[#C6A55A]/30 font-medium rounded-lg transition-all duration-300 hover:border-[#C6A55A]/60"
            >
              <span>Destination Directory</span>
            </Link>
          </div>
        </div>
                <CommercialCtaRow context={{ serviceIntent: "international_execution", source: "service-international-execution" }} actions={["get_pricing", "speak"]} className="mt-6" />
        </section>

      {/* Process */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-10 text-center">
            Execution Sequence
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {steps.map((step, i) => (
              <div key={step.title} className="flex gap-4 p-6 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl">
                <span className="font-serif text-2xl font-medium text-[#C6A55A]/20 flex-shrink-0 leading-none mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-medium text-white mb-1 text-sm">{step.title}</h3>
                  <p className="text-[#B0B0B0] text-xs leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: Globe2, title: "Jurisdiction Routing", body: "Destination validated against apostille and consular authentication requirements." },
            { icon: FileCheck, title: "Document Structuring", body: "Cross-border execution standards applied before notarial seal deployment." },
            { icon: Shield, title: "Compliance Verified", body: "Identity credentials and document integrity verified prior to international release." },
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

      {/* CTA */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
            Ready for International Execution?
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Submit your document type, destination country, and timeline requirements to begin.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Start International Intake</span>
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
