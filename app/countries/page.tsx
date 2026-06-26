import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Globe, ArrowRight, CheckCircle } from "lucide-react";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { DestinationIntelligenceCard } from "@/components/landing/destination-intelligence-card";

export const metadata: Metadata = {
  title: "Participating Countries — Hague Convention Directory | The Milano Seal™",
  description:
    "Destination country directory for apostille and international document authentication. Hague Convention members, consular legalization routes, and jurisdiction-specific requirements.",
  alternates: { canonical: "https://themilanoseal.com/countries" },
};

const FEATURED_SLUGS = [
  "italy", "spain", "germany", "portugal", "uae", "mexico", "brazil",
  "greece", "france", "united-kingdom", "australia", "canada",
] as const;

const featured = FEATURED_SLUGS.map((slug) =>
  DESTINATIONS.find((destination) => destination.slug === slug),
).filter((destination): destination is Destination => Boolean(destination));

export default function CountriesPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      {/* Hero */}
      <section className="px-6 pb-10 pt-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <Globe className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">Participating Countries</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Hague Convention Country Directory
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            Select your destination country to view jurisdiction-specific apostille requirements, authentication paths, common documents, and processing timelines.
          </p>
        </div>
      </section>

      {/* Legend */}
      <section className="pb-4 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-6 justify-center text-sm text-[#6A6A6A]">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Hague Convention member — apostille accepted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border border-[#4A4A4A] inline-block" />
            <span>Non-member — consular legalization required</span>
          </div>
        </div>
      </section>

      {/* Country Grid */}
      <section className="px-6 py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {featured.map((country) => (
            <DestinationIntelligenceCard
              key={country.slug}
              destination={country}
              variant="countryDirectory"
            />
          ))}
        </div>
        <p className="text-center mt-8 text-sm text-[#6A6A6A]">
          Don&apos;t see your country?{" "}
          <Link href="/intake" className="text-[#C6A55A] hover:underline">
            Contact us
          </Link>{" "}
          — we coordinate authentication for additional jurisdictions.
        </p>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
            Ready to Begin?
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Submit your document type and destination country. We will confirm the authentication path and processing timeline.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Start Matter Intake</span>
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
