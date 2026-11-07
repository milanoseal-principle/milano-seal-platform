import type { Metadata } from "next";
import Link from "next/link";
import { CommercialCtaRow } from "@/components/conversion/CommercialCtaRow";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Car, MapPin, CheckCircle, ArrowRight, Calendar, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Mobile Notary Services | The Milano Seal™",
  description:
    "In-person mobile notary for high-sensitivity, high-value, or location-restricted matters. On-location execution, flexible scheduling, witness coordination, and same-day availability.",
  alternates: { canonical: "https://themilanoseal.com/services/mobile-notary" },
};

const features = [
  "On-location service — office, home, hospital, or facility",
  "Flexible scheduling including evenings and weekends",
  "Witness coordination arranged upon request",
  "Same-day availability for urgent matters",
  "High-value real estate and estate document execution",
  "Hospital, memory care, and sensitive setting visits",
];

export default function MobileNotaryPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <Car className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">Mobile Notary</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Regional Field Coordination &amp; Dispatch
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            In-person document execution at your location. High-sensitivity matters handled with discretion, precision, and flexible scheduling throughout the service area.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Schedule Mobile Notary</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
                <CommercialCtaRow context={{ serviceIntent: "domestic_execution", source: "service-mobile-notary" }} actions={["get_pricing", "speak"]} className="mt-6" />
        </section>

      {/* Features */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8 text-center">
            Service Features
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
            { icon: MapPin, title: "On-Location", body: "We come to you — office, residence, healthcare facility, or title company." },
            { icon: Calendar, title: "Flexible Hours", body: "Scheduling available evenings and weekends. Same-day dispatch for urgent matters." },
            { icon: Users, title: "Witness Coordination", body: "Credible witnesses arranged upon request when required by document type." },
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
            Schedule Your Mobile Appointment
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Provide your location, document type, and preferred scheduling window. We will confirm availability and dispatch details.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Book Mobile Notary</span>
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
