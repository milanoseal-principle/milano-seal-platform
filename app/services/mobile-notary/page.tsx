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
            I am not an attorney. Legal services are provided by Demesmin &amp; Dover PLLC. Final document acceptance and cross-border validation reliability rest explicitly with the receiving foreign authority.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
