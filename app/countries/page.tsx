import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Globe, ArrowRight, CheckCircle } from "lucide-react";

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
    <main className="min-h-screen bg-[#0A0A0A] overflow-x-hidden">
      <Header />

      <section className="pt-28 pb-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-4">
            <Globe className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">Participating Countries</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-4 text-balance">
            Hague Convention Country Directory
          </h1>
          <p className="text-base md:text-lg text-[#B0B0B0] mb-5 max-w-2xl mx-auto leading-relaxed">
            Select your destination country to view jurisdiction-specific apostille requirements, authentication paths, common documents, and processing timelines.
          </p>
        </div>
      </section>

      <section className="pb-3 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-4 md:gap-6 justify-center text-sm text-[#6A6A6A]">
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

      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.map((country) => (
            <Link
              key={country.slug}
              href={`/countries/${country.slug}`}
              className="group flex items-center justify-between p-4 bg-[#111111] border border-[#2A2A2A] rounded-xl hover:border-[#C6A55A]/30 transition-all duration-300 min-h-[64px]"
            >
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
            </Link>
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

      <section className="py-12 px-4 sm:px-6 bg-[#111111]">
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
        </div>
      </section>

      <Footer />
    </main>
  );
}
