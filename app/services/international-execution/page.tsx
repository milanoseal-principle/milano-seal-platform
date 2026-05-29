import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, Globe2, Search, Layers, Shield } from "lucide-react";
import { Globe2, CheckCircle, ArrowRight, FileCheck, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "International Document Execution | The Milano Seal™",
  description:
    "Structured preparation, notarization, and coordination of U.S. documents for foreign jurisdictions. Hague routing, embassy legalization, and courier dispatch.",
  keywords: [
    "international document execution",
    "cross-border document authentication",
    "Florida documents abroad",
    "international notarization",
    "apostille international",
    "embassy legalization Florida",
  ],
  alternates: { canonical: "https://themilanoseal.com/services/international-execution" },
};

const FEATURES = [
  { icon: Search,  label: "Jurisdiction Analysis",    detail: "Routing validation matching target embassy, consulate, or apostille protocols for the destination country." },
  { icon: Layers,  label: "Document Structuring",     detail: "Alignment of execution blocks with cross-border authentication standards before submission." },
  { icon: Shield,  label: "Compliance Verification",  detail: "Strict administrative checking of identity credentials and document requirements prior to final seal." },
  { icon: Globe2,  label: "Destination Guidance",     detail: "Receiving authority requirements reviewed for the specific country, region, and institution." },
];

const PROCESS = [
  "Submit document details, destination country, and intended use through secure intake.",
  "Jurisdiction analysis determines the correct execution and authentication path.",
  "Notarization completed via RON or mobile notary depending on document requirements.",
  "State or federal authentication obtained based on destination-country protocol.",
  "Embassy or consular legalization applied if non-Hague country.",
  "Documents dispatched via international courier with tracking provided.",
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
    <>
      <Header />
      <main className="bg-[#050507] min-h-screen">
        {/* Hero */}
        <section className="pt-28 pb-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-medium mb-4">
              Service — Cross-Border Execution
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-6 text-balance">
              International Document Execution
            </h1>
            <p className="text-[#B0B0B0] text-lg max-w-2xl leading-relaxed mb-8">
              Structured preparation, notarization, and coordination of U.S. documents
              intended for foreign jurisdictions. Hague apostille and embassy legalization
              sequences handled end-to-end.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/intake"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C6A55A] text-[#0A0A0A] font-semibold text-sm rounded-xl hover:bg-[#D4BB7A] transition-colors duration-200"
              >
                Begin International Matter
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/countries"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#2A2A2A] text-[#8A8A8A] text-sm rounded-xl hover:border-[#C6A55A]/40 hover:text-[#C6A55A] transition-all duration-300"
              >
                Browse Destination Countries
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl font-medium text-white mb-8">Execution Components</h2>
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
            <h2 className="font-serif text-2xl font-medium text-white mb-8">International Execution Path</h2>
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

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-2xl font-medium text-white mb-4">Ready to Execute Internationally?</h2>
            <p className="text-[#8A8A8A] text-sm mb-8 max-w-md mx-auto">
              Submit your matter. Destination routing and authentication handled from Florida to your country.
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
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
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
            I am not an attorney. Legal services are provided by Demesmin &amp; Dover PLLC. Final document acceptance and cross-border validation reliability rest explicitly with the receiving foreign authority.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
