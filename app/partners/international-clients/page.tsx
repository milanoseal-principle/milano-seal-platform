import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Globe, CheckCircle, ArrowRight, Monitor, FileCheck, Navigation } from "lucide-react";

export const metadata: Metadata = {
  title: "International Document Execution for Global Clients | The Milano Seal™",
  description:
    "Apostille, RON, and cross-border document execution for international clients. Hague Convention routing, multi-jurisdictional authentication, and structured international release.",
  alternates: { canonical: "https://themilanoseal.com/partners/international-clients" },
};

const services = [
  "Hague Convention apostille logistics processing",
  "Global Remote Online Notarization (RON)",
  "Multi-jurisdictional cross-border document execution",
  "Embassy and consular legalization coordination",
  "International power of attorney execution",
  "Translation coordination for foreign-language requirements",
  "International courier dispatch and delivery tracking",
  "Chain-of-custody visibility through the client portal",
];

const corridors = [
  { from: "Florida → Italy", note: "Hague apostille + Italian translation" },
  { from: "Florida → Spain", note: "Hague apostille route" },
  { from: "Florida → UAE", note: "Consular authentication workflow" },
  { from: "Florida → Brazil", note: "Document authentication sequence" },
  { from: "Florida → Germany", note: "Federal authority attestation" },
  { from: "Florida → Greece", note: "Hague consular validation" },
];

export default function InternationalClientsPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <Globe className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">For International Clients</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Apostille, RON &amp; Cross-Border Document Execution
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            U.S. document execution and authentication for individuals and businesses operating across borders. Structured for your destination authority's requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/intake"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
            >
              <span>Begin International Intake</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/countries"
              className="inline-flex items-center gap-3 px-8 py-4 bg-transparent text-[#C6A55A] border border-[#C6A55A]/30 font-medium rounded-lg transition-all duration-300 hover:border-[#C6A55A]/60"
            >
              <span>Country Directory</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8 text-center">
            International Services
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

      {/* Active Corridors */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl font-medium text-white mb-8 text-center">
            Active Document Corridors
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {corridors.map((c) => (
              <div key={c.from} className="flex items-center gap-4 p-4 bg-[#111111] border border-[#2A2A2A] rounded-xl">
                <span className="text-[#C6A55A]/40 font-mono text-xs">→</span>
                <div>
                  <p className="text-white text-sm font-medium">{c.from}</p>
                  <p className="text-[#6A6A6A] text-xs mt-0.5">{c.note}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center mt-6 text-sm text-[#6A6A6A]">
            <Link href="/countries" className="text-[#C6A55A] hover:underline">View full country directory →</Link>
          </p>
        </div>
      </section>

      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: Monitor, title: "Global RON", body: "Remote notarization available for international clients regardless of physical location." },
            { icon: FileCheck, title: "Hague Routing", body: "Authentication path validated against Hague Convention or consular legalization requirements." },
            { icon: Navigation, title: "International Courier", body: "Tracked physical delivery to destination authorities via DHL or FedEx International." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-6 text-center">
              <div className="inline-flex p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
                <Icon className="w-6 h-6 text-[#C6A55A]" />
              </div>
              <h3 className="font-medium text-white mb-2">{title}</h3>
              <p className="text-sm text-[#B0B0B0]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
            Begin Your International Matter
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Submit your destination country, document type, and timeline. We confirm authentication path and processing schedule.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Begin International Intake</span>
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
