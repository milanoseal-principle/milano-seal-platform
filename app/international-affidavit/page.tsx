import type { Metadata } from "next";
import Link from "next/link";
import { CommercialCtaRow } from "@/components/conversion/CommercialCtaRow";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "International Affidavit Services — The Milano Seal™",
  description:
    "Professionally executed international affidavits, apostille-ready, for use in Italy, Spain, Greece, Brazil, and 100+ countries. Florida-based, globally compliant.",
  alternates: {
    canonical: "https://themilanoseal.com/international-affidavit",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "International Affidavit Execution",
  provider: {
    "@type": "ProfessionalService",
    name: "The Milano Seal™",
    url: "https://themilanoseal.com",
  },
  serviceType: "Notarization and Apostille",
  areaServed: { "@type": "Country", name: "Worldwide" },
  description:
    "International affidavit execution with apostille authentication for global use.",
};

export default function InternationalAffidavitPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Header />
      <main className="bg-[#0A0A0A] min-h-screen">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-[calc(var(--header-total-height)+var(--sa-top)+2rem)] pb-16">
          <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-semibold mb-4">
            Authority Document Services
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-white leading-tight mb-6">
            International Affidavit
            <br />
            Execution & Apostille
          </h1>
          <p className="text-[#8A8A8A] text-lg leading-relaxed font-light max-w-2xl">
            When a sworn statement must be recognized abroad, precision is not
            optional. The Milano Seal™ executes international affidavits with
            the authentication required for legal acceptance in Italy, Spain,
            Greece, Brazil, and 100+ countries.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              href="/intake"
              className="px-8 py-3.5 bg-[#C6A55A] text-[#0A0A0A] text-xs font-semibold tracking-[0.15em] uppercase rounded-sm hover:bg-[#D4BB7A] transition-colors"
            >
              Begin Your Matter
            </Link>
            <Link
              href="/map"
              className="px-8 py-3.5 border border-[#2A2A2A] text-[#C6A55A] text-xs font-semibold tracking-[0.15em] uppercase rounded-sm hover:border-[#C6A55A] transition-colors"
            >
              Check Your Country
            </Link>
          </div>
                  <CommercialCtaRow context={{ serviceIntent: "international_execution", source: "international-affidavit" }} actions={["get_pricing", "speak"]} className="mt-6" />
        </section>

        {/* What is an international affidavit */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white mb-5">
            What Is an International Affidavit?
          </h2>
          <div className="text-[#8A8A8A] text-base leading-relaxed space-y-4 font-light">
            <p>
              An international affidavit is a sworn written statement, executed
              before a commissioned notary public, intended for legal use in a
              foreign country. Unlike domestic affidavits, documents intended
              for international use carry specific authentication requirements
              that vary by destination country.
            </p>
            <p>
              For countries that are members of the Hague Apostille Convention —
              including Italy, Spain, Portugal, France, Germany, Greece, and
              Brazil — the document must bear an apostille certificate issued by
              the appropriate state authority. This certificate confirms the
              authenticity of the notary's signature for foreign recognition.
            </p>
            <p>
              For non-Hague countries, such as the UAE, a full consular
              legalization chain is required, involving additional
              authentication steps beyond apostille.
            </p>
          </div>
        </section>

        {/* Common use cases */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white mb-5">
            Common International Affidavit Use Cases
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "Italian Citizenship by Descent",
                desc: "Affidavits confirming family relationships, identity continuity, or renunciation status for jure sanguinis proceedings.",
              },
              {
                title: "Name Discrepancy Affidavits",
                desc: "Sworn statements reconciling naming differences across passports, birth certificates, and foreign civil records.",
              },
              {
                title: "Financial Affidavits",
                desc: "Declarations of assets, solvency, or source of funds required by foreign institutions and legal proceedings.",
              },
              {
                title: "Property & Real Estate",
                desc: "Affidavits for international property transactions, inheritance, and title transfers involving U.S. parties.",
              },
              {
                title: "Immigration Support",
                desc: "Supporting declarations for visa applications, residency petitions, and foreign government submissions.",
              },
              {
                title: "Estate & Inheritance",
                desc: "Declarations for foreign probate proceedings involving U.S. assets or U.S.-citizen beneficiaries abroad.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-5"
              >
                <h3 className="text-white font-medium text-sm mb-2">
                  {item.title}
                </h3>
                <p className="text-[#8A8A8A] text-sm font-light leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Internal links */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white mb-5">
            Related Services
          </h2>
          <div className="space-y-3">
            {[
              {
                href: "/affidavit-name-discrepancy",
                label:
                  "Affidavit of Name Discrepancy — Italy, Spain & International",
              },
              {
                href: "/power-of-attorney-international",
                label: "International Power of Attorney with Apostille",
              },
              {
                href: "/apostille/italy",
                label: "Apostille for Italy — Complete Requirements",
              },
              {
                href: "/apostille/spain",
                label: "Apostille for Spain — Complete Requirements",
              },
              {
                href: "/map",
                label: "Global Document Intelligence — All Countries",
              },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between px-5 py-3.5 bg-[#111111] border border-[#1A1A1A] rounded-lg hover:border-[#C6A55A]/30 transition-colors group"
              >
                <span className="text-[#B0B0B0] text-sm group-hover:text-white transition-colors">
                  {link.label}
                </span>
                <span className="text-[#C6A55A] text-xs">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-t border-[#1A1A1A] text-center">
          <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-semibold mb-3">
            Begin Your Matter
          </p>
          <h2 className="font-serif text-3xl text-white mb-4">
            Ready to Execute Your International Affidavit?
          </h2>
          <p className="text-[#8A8A8A] text-base font-light mb-8 max-w-xl mx-auto">
            Submit your matter details. Nicholas Milano reviews every engagement
            personally before execution is scheduled.
          </p>
          <Link
            href="/intake"
            className="inline-block px-10 py-4 bg-[#C6A55A] text-[#0A0A0A] text-xs font-semibold tracking-[0.2em] uppercase rounded-sm hover:bg-[#D4BB7A] transition-colors"
          >
            Submit Your Matter
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
