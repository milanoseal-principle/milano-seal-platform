import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, Navigation, Clock, Package, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Florida Apostille Courier | The Milano Seal™",
  description:
    "Physical document dispatch to the Florida Department of State in Tallahassee for apostille processing. Expedited runs, same-day pickup, and tracked return delivery.",
  keywords: [
    "Florida apostille courier",
    "Tallahassee apostille dispatch",
    "Florida Department of State courier",
    "apostille same day Florida",
    "Florida apostille expedited",
    "Tallahassee field dispatch",
  ],
  alternates: { canonical: "https://themilanoseal.com/services/florida-apostille-courier" },
};

const FEATURES = [
  { icon: Navigation, label: "Tallahassee Field Dispatch",  detail: "Physical document transport to the Florida Department of State in Tallahassee for apostille attachment." },
  { icon: Clock,      label: "Expedited Scheduling",        detail: "Same-day and next-business-day pickup available for time-sensitive authentication deadlines." },
  { icon: Package,    label: "Tracked Return Delivery",     detail: "Apostilled documents returned via tracked courier with real-time transit visibility through the client portal." },
  { icon: MapPin,     label: "State Pathway Coordination",  detail: "Document prepared and sequenced to Florida Department of State submission standards before dispatch." },
];

const PROCESS = [
  "Submit your document details and destination country through secure intake.",
  "Document reviewed for apostille eligibility and Florida notarization requirements.",
  "Florida-commissioned notarization completed (RON or mobile) if required.",
  "Physical document dispatched to the Florida Department of State, Tallahassee.",
  "Apostille attached at the Department of State and returned via tracked courier.",
  "Apostilled document delivered to your address or forwarded per your instructions.",
];

export default function FloridaApostilleCourierPage() {
  return (
    <>
      <Header />
      <main className="bg-[#050507] min-h-screen">
        {/* Hero */}
        <section className="pt-28 pb-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-medium mb-4">
              Service — Field Dispatch
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-6 text-balance">
              Florida Apostille Courier
            </h1>
            <p className="text-[#B0B0B0] text-lg max-w-2xl leading-relaxed mb-8">
              Physical document dispatch to the Florida Department of State in Tallahassee
              for apostille processing. Expedited runs available. Tracked return delivery
              with client portal visibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/intake"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C6A55A] text-[#0A0A0A] font-semibold text-sm rounded-xl hover:bg-[#D4BB7A] transition-colors duration-200"
              >
                Schedule Courier Dispatch
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/services/apostille"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#2A2A2A] text-[#8A8A8A] text-sm rounded-xl hover:border-[#C6A55A]/40 hover:text-[#C6A55A] transition-all duration-300"
              >
                Full Apostille Coordination
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
            <h2 className="font-serif text-2xl font-medium text-white mb-8">Dispatch Sequence</h2>
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
            <h2 className="font-serif text-2xl font-medium text-white mb-4">Ready to Dispatch?</h2>
            <p className="text-[#8A8A8A] text-sm mb-8 max-w-md mx-auto">
              Submit your matter. Physical dispatch to Tallahassee coordinated from intake through apostille return.
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
