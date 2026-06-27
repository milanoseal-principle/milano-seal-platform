import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Globe, ArrowRight, CheckCircle } from "lucide-react";
import { getPublicCountryCompliance } from "@/data/global-compliance-atlas";

export const metadata: Metadata = {
  title: "Participating Countries — Hague Convention Directory | The Milano Seal™",
  description:
    "Destination country directory for apostille and international document authentication. Hague Convention members, consular legalization routes, and jurisdiction-specific requirements.",
  alternates: { canonical: "https://themilanoseal.com/countries" },
};

const featured = [
  { name: "Italy", slug: "italy", hague: true },
  { name: "Spain", slug: "spain", hague: true },
  { name: "Germany", slug: "germany", hague: true },
  { name: "Portugal", slug: "portugal", hague: true },
  { name: "United Arab Emirates", slug: "uae", hague: false },
  { name: "Mexico", slug: "mexico", hague: true },
  { name: "Brazil", slug: "brazil", hague: true },
  { name: "Greece", slug: "greece", hague: true },
  { name: "France", slug: "france", hague: true },
  { name: "United Kingdom", slug: "united-kingdom", hague: true },
  { name: "Australia", slug: "australia", hague: true },
  { name: "Canada", slug: "canada", hague: false },
  { name: "Japan", slug: "japan", hague: true },
  { name: "Argentina", slug: "argentina", hague: true },
  { name: "Saudi Arabia", slug: "saudi-arabia", hague: false },
  { name: "Philippines", slug: "philippines", hague: true },
];

export default function CountriesPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <Globe className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">Participating Countries</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Milano Seal Global Execution Atlas
          </h1>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-3xl mx-auto leading-relaxed">
            Understand the likely route for U.S.-origin documents used abroad. Choose a country, confirm the document type, and start controlled intake so The Milano Seal can review notarization, RON suitability, apostille/authentication routing, receiving-authority risk, and release requirements.
          </p>
        </div>
      </section>

      {/* Legend */}
      <section className="pb-4 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-6 justify-center text-sm text-[#6A6A6A]">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Hague member — apostille execution route review</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border border-[#4A4A4A] inline-block" />
            <span>Authentication or consular review route</span>
          </div>
        </div>
      </section>

      {/* Country Grid */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.map((country) => {
            const atlas = getPublicCountryCompliance(country.slug);
            return (
              <Link
                key={country.slug}
                href={`/countries/${country.slug}`}
                className="group flex flex-col gap-2 p-4 bg-[#111111] border border-[#2A2A2A] rounded-xl hover:border-[#C6A55A]/30 transition-all duration-300 min-h-[132px]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {country.hague ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-[#4A4A4A] flex-shrink-0 inline-block" />
                    )}
                    <span className="text-[#B0B0B0] text-sm group-hover:text-white transition-colors font-medium">
                      {country.name}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C6A55A]/20 group-hover:text-[#C6A55A]/60 transition-all duration-300 group-hover:translate-x-0.5 flex-shrink-0" />
                </div>
                <span className="text-[9px] uppercase tracking-[0.12em] text-[#C6A55A]/70">{atlas.publicRouteLabel}</span>
                <span className="text-[11px] leading-4 text-[#7A7A7A] line-clamp-3">{atlas.receivingAuthorityBoundary}</span>
              </Link>
            );
          })}
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
            Submit your document type and destination country for route review, receiving-authority risk screening, and controlled release planning.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Start Controlled Intake</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <p className="mt-8 text-xs text-[#4A4A4A] leading-relaxed max-w-lg mx-auto">
            The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. Professional legal questions should be handled by a licensed attorney.</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
