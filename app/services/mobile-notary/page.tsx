import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, Car, MapPin, Clock, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Mobile Notary | The Milano Seal™",
  description:
    "In-person notarization for high-sensitivity, high-value, or location-restricted matters. Flexible scheduling, witness coordination, and same-day availability.",
  keywords: [
    "mobile notary Florida",
    "in-person notary",
    "mobile notarization",
    "Florida mobile notary",
    "notary on location",
    "same day notary",
  ],
  alternates: { canonical: "https://themilanoseal.com/services/mobile-notary" },
};

const FEATURES = [
  { icon: MapPin, label: "On-Location Service",      detail: "Execution at your home, office, hospital, or any location within the service area." },
  { icon: Clock,  label: "Flexible Scheduling",      detail: "Appointments available including evenings and weekends for urgent or after-hours requirements." },
  { icon: Users,  label: "Witness Coordination",     detail: "Witness sourcing available where documents require witness presence beyond the notary." },
  { icon: Car,    label: "Same-Day Available",        detail: "Expedited scheduling available for time-sensitive matters when location permits." },
];

const PROCESS = [
  "Submit your matter through secure intake including document type, location, and timing requirements.",
  "Availability confirmed and appointment scheduled at your preferred location.",
  "Florida-commissioned notary arrives at the designated location with required materials.",
  "Documents are reviewed, executed, witnessed (if applicable), and notarized.",
  "Executed documents delivered immediately on-location or dispatched per your instructions.",
];

export default function MobileNotaryPage() {
  return (
    <>
      <Header />
      <main className="bg-[#050507] min-h-screen">
        {/* Hero */}
        <section className="pt-28 pb-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-medium mb-4">
              Service — Field Execution
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-6 text-balance">
              Mobile Notary
            </h1>
            <p className="text-[#B0B0B0] text-lg max-w-2xl leading-relaxed mb-8">
              In-person execution for high-sensitivity, high-value, or location-restricted matters.
              Florida-commissioned notary dispatched to your location.
              Witness coordination available.
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C6A55A] text-[#0A0A0A] font-semibold text-sm rounded-xl hover:bg-[#D4BB7A] transition-colors duration-200"
            >
              Schedule Mobile Notary
              <ArrowRight className="w-4 h-4" />
            </Link>
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
            <h2 className="font-serif text-2xl font-medium text-white mb-4">Ready to Schedule?</h2>
            <p className="text-[#8A8A8A] text-sm mb-8 max-w-md mx-auto">
              Submit your matter details and preferred timing. We dispatch to your location.
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
