import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Navigation, CheckCircle, ArrowRight, Zap, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Florida Apostille Courier — Tallahassee Dispatch | The Milano Seal™",
  description:
    "Physical courier coordination for Florida apostille matters. Direct Tallahassee FL Dept of State field dispatch for expedited apostille processing and same-day or next-day turnaround.",
  alternates: { canonical: "https://themilanoseal.com/services/florida-apostille-courier" },
};

const features = [
  "Direct Tallahassee Department of State field dispatch",
  "Expedited apostille processing coordination",
  "Same-day and next-business-day turnaround options",
  "Chain-of-custody tracking from pickup to return",
  "Secure document handling throughout transit",
  "Available for standard and rush processing tracks",
];

export default function FloridaApostilleCourierPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <Navigation className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">Tallahassee Field Dispatch</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Physical Courier Coordination &amp; Expedited Runs
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            Direct physical dispatch to the Florida Department of State in Tallahassee for apostille processing. Expedited turnaround for time-sensitive international matters.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Request Courier Dispatch</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8 text-center">
            Dispatch Features
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-3 p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg">
                <CheckCircle className="w-5 h-5 text-[#C6A55A] flex-shrink-0 mt-0.5" />
                <span className="text-[#B0B0B0] text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: Navigation, title: "Direct Dispatch", body: "Physical courier runs directly to the Florida Department of State in Tallahassee." },
            { icon: Zap, title: "Expedited Processing", body: "Rush and same-day processing tracks available for time-critical international matters." },
            { icon: Shield, title: "Secure Transit", body: "Chain-of-custody tracking maintained from document pickup through apostille return." },
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
            Request Tallahassee Dispatch
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Submit your document details and required turnaround timeline. Courier availability and pricing confirmed at scheduling.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Start Courier Matter</span>
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
