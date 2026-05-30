import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, FileCheck, Globe, Shield, MapPin, Navigation } from "lucide-react";

export const metadata: Metadata = {
  title: "Apostille Coordination | The Milano Seal™",
  description:
    "End-to-end apostille coordination through the Florida Secretary of State. Hague Convention compliance for international document acceptance.",
  keywords: [
    "apostille Florida",
    "Florida apostille service",
    "apostille coordination",
    "Hague Convention apostille",
    "Secretary of State apostille",
    "international document authentication",
  ],
  alternates: { canonical: "https://themilanoseal.com/services/apostille" },
};

const FEATURES = [
  { icon: Shield,    label: "State Authentication",        detail: "Document sequencing verified directly with the Florida Department of State division." },
  { icon: Globe,     label: "Hague Convention Compliance", detail: "Destination-country routing reviewed against Hague Convention authentication requirements." },
  { icon: MapPin,    label: "Tracking Provided",           detail: "Real-time visibility and transit monitoring maintained through the client portal." },
  { icon: FileCheck, label: "Global Recognition",          detail: "Apostille accepted by all 125+ Hague Convention member countries when properly issued." },
];

const PROCESS = [
  { title: "Document Assessment",     body: "Incoming documents are reviewed for completeness and notarial compliance before submission to the Department of State." },
  { title: "State Authentication",    body: "Documents are submitted to the Florida Department of State for apostille issuance. Processing timelines depend on the current state queue." },
  { title: "Hague Convention Routing", body: "Destination-country requirements are validated against Hague Convention member status. Non-member countries require consular legalization instead." },
  { title: "Tracking & Status",       body: "Real-time status visibility maintained through the client portal from submission through return. Transit and courier tracking included." },
  { title: "Delivery Coordination",   body: "Apostilled documents delivered digitally and/or physically per destination authority requirements. Expedited courier available for urgent matters." },
];

const HAGUE_EXAMPLES = [
  "Italy", "Spain", "Germany", "France", "Portugal", "Greece",
  "Mexico", "Brazil", "Australia", "United Kingdom",
];

export default function ApostillePage() {
  return (
    <>
      <Header />
      <main className="bg-[#050507] min-h-screen">
        {/* Hero */}
        <section className="pt-28 pb-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-medium mb-4">
              Service — State Authentication
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-6 text-balance">
              Apostille Coordination
            </h1>
            <p className="text-[#B0B0B0] text-lg max-w-2xl leading-relaxed mb-8">
              End-to-end handling of document authentication through the Florida Secretary of State.
              Ensures Hague Convention compliance for international acceptance.
              Tracking provided throughout the authentication sequence.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/intake"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C6A55A] text-[#0A0A0A] font-semibold text-sm rounded-xl hover:bg-[#D4BB7A] transition-colors duration-200"
              >
                Begin Apostille Matter
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/countries"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#2A2A2A] text-[#8A8A8A] text-sm rounded-xl hover:border-[#C6A55A]/40 hover:text-[#C6A55A] transition-all duration-300"
              >
                View Participating Countries
              </Link>
            </div>
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
            <h2 className="font-serif text-2xl font-medium text-white mb-8">Authentication Sequence</h2>
            <div className="space-y-4">
              {PROCESS.map((step, i) => (
                <div key={step.title} className="flex gap-5 p-6 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl">
                  <span className="font-serif text-2xl font-medium text-[#C6A55A]/30 flex-shrink-0 w-8 leading-none mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-white font-medium text-sm mb-1">{step.title}</h3>
                    <p className="text-[#8A8A8A] text-xs leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hague member examples */}
        <section className="py-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl font-medium text-white mb-4">Common Destination Countries</h2>
            <p className="text-[#8A8A8A] text-sm mb-8">
              Hague Convention members accept apostilles directly. Non-members require consular legalization.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {HAGUE_EXAMPLES.map((country) => (
                <Link
                  key={country}
                  href={`/countries/${country.toLowerCase().replace(/ /g, "-")}`}
                  prefetch={false}
                  className="flex items-center gap-2 p-3 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl hover:border-[#C6A55A]/30 transition-colors group"
                >
                  <Globe className="w-3.5 h-3.5 text-[#C6A55A] flex-shrink-0" />
                  <span className="text-xs text-[#B0B0B0] group-hover:text-white transition-colors">{country}</span>
                </Link>
              ))}
            </div>
            <p className="text-sm text-[#555]">
              <Link href="/countries" className="text-[#C6A55A] hover:underline">View full country directory →</Link>
            </p>
          </div>
        </section>

        {/* Trust signals */}
        <section className="py-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-5">
            {[
              { icon: FileCheck,  title: "FL Dept of State",  body: "Direct submission and coordination with the Florida Secretary of State apostille division." },
              { icon: Globe,      title: "Hague Compliance",  body: "Destination-country routing reviewed against current Hague Convention member status." },
              { icon: Navigation, title: "Tracking Provided", body: "Matter status and transit monitoring through the client portal from start to delivery." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl p-6 text-center">
                <div className="inline-flex p-2.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
                  <Icon className="w-5 h-5 text-[#C6A55A]" />
                </div>
                <h3 className="text-white font-medium text-sm mb-2">{title}</h3>
                <p className="text-[#8A8A8A] text-xs leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-2xl font-medium text-white mb-4">Ready to Begin?</h2>
            <p className="text-[#8A8A8A] text-sm mb-8 max-w-md mx-auto">
              Submit your document and destination details. Apostille coordination handled end-to-end.
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C6A55A] text-[#0A0A0A] font-semibold text-sm rounded-xl hover:bg-[#D4BB7A] transition-colors duration-200"
            >
              Start Your Matter
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="mt-8 text-xs text-[#444] leading-relaxed max-w-lg mx-auto">
              I am not an attorney. Legal services are provided by Demesmin &amp; Dover PLLC. Final document acceptance and cross-border validation reliability rest explicitly with the receiving foreign authority.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
