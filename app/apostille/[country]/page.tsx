import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { getAllCountries, getCountry } from "@/data/intelligence";
import {
  ArrowRight,
  CheckCircle,
  Globe,
  Shield,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

// ISO-2 → flag emoji
function isoToFlag(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

interface PageProps {
  params: Promise<{ country: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  return getAllCountries().map((c) => ({ country: c.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country: countrySlug } = await params;

  if (countrySlug.includes(".")) {
    return { title: "Not Found" };
  }

  const country = getCountry(countrySlug);
  if (!country) {
    return { title: "Not Found" };
  }

  const isHague = country.corridorType === "hague";

  return {
    title: `Apostille for ${country.name} | U.S. Document Authentication | The Milano Seal™`,
    description: `Professional apostille services for documents destined for ${country.name}. U.S. document authentication through Florida Secretary of State for ${isHague ? "Hague Convention compliance" : "consular legalization"}. Fast, reliable execution.`,
    keywords: [
      `apostille ${country.name}`,
      `${country.name} apostille`,
      `document authentication ${country.name}`,
      `notarization for ${country.name}`,
      `US documents for ${country.name}`,
      "apostille services",
      "Hague Convention",
    ],
    alternates: {
      canonical: `https://themilanoseal.com/apostille/${country.id}`,
    },
    openGraph: {
      title: `Apostille for ${country.name} | The Milano Seal™`,
      description: `Professional apostille services for documents destined for ${country.name}. ${isHague ? "Hague Convention compliant" : "Consular"} authentication.`,
    },
  };
}

export default async function ApostilleCountryPage({ params }: PageProps) {
  const { country: countrySlug } = await params;

  if (countrySlug.includes(".")) {
    notFound();
  }

  const country = getCountry(countrySlug);
  if (!country) {
    notFound();
  }

  const isHague = country.corridorType === "hague";
  const flag = isoToFlag(country.isoCode);

  const steps = [
    {
      title: "Document Preparation",
      description: `Ensure your document meets ${country.name}'s requirements${country.certifiedTranslationRequired ? ` and is accompanied by a certified ${country.translationLanguage ?? "translation"}` : ""}.`,
    },
    {
      title: "Notarization",
      description:
        "Remote Online Notarization (RON) or in-person mobile notarization with a certified Florida notary.",
    },
    {
      title: isHague ? "Apostille Certification" : "State Authentication + Consular Legalization",
      description: isHague
        ? "Document submitted to the Florida Secretary of State for apostille certification, accepted directly by " + country.name + "."
        : "Document authenticated by the Florida Secretary of State, then presented to the " + country.name + " consulate for final legalization.",
    },
    {
      title: "Delivery",
      description: `Apostilled documents delivered digitally and physically, ready for use in ${country.name}.${country.apostilleTimeline ? ` Estimated receiving-country processing: ${country.apostilleTimeline}.` : ""}`,
    },
  ];

  // Common documents for this country
  const commonDocIds = country.commonDocuments ?? [
    "power-of-attorney",
    "birth-certificate",
    "marriage-certificate",
    "diploma-degree",
    "affidavit",
    "court-documents",
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Apostille Services for ${country.name}`,
    provider: {
      "@type": "ProfessionalService",
      name: "The Milano Seal™",
      url: "https://themilanoseal.com",
    },
    serviceType: "Notarization and Apostille",
    areaServed: country.name,
    description: `Professional U.S. document authentication and apostille coordination for documents intended for use in ${country.name}.`,
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <Globe className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">
              {isHague
                ? `Hague Convention Member${country.hagueSince ? ` since ${country.hagueSince}` : ""}`
                : "Consular Authentication Required"}
            </span>
          </div>

          <div className="text-5xl mb-4">{flag}</div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white mb-6 text-balance">
            Apostille for {country.name}
          </h1>

          <p className="text-lg md:text-xl text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            Professional U.S. document authentication for acceptance in{" "}
            {country.name}. Structured for international use with procedural
            control across jurisdictions.
          </p>

          <Link
            href={`/intake?country=${country.id}`}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Begin Apostille Process</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* What is an Apostille */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-6">
            {isHague ? "What is an Apostille?" : "Document Legalization for " + country.name}
          </h2>
          {isHague ? (
            <>
              <p className="text-[#B0B0B0] leading-relaxed mb-6">
                An apostille is a form of authentication issued to documents for
                use in countries that participate in the Hague Convention of
                1961. As a member of the Hague Convention,{" "}
                {country.name} accepts apostilled U.S. documents without the
                need for further legalization through the embassy or consulate.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                The apostille certificate is attached to your original document,
                confirming that the signature, seal, or stamp on the document is
                genuine. This streamlined process replaces the traditional chain
                of authentication that would otherwise require multiple
                government agencies.
              </p>
            </>
          ) : (
            <>
              <p className="text-[#B0B0B0] leading-relaxed mb-6">
                {country.name} is not a member of the Hague Apostille
                Convention. Documents destined for {country.name} require a
                two-step authentication: state-level certification by the
                Florida Secretary of State followed by consular legalization at
                the {country.name} consulate or embassy.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                The Milano Seal™ coordinates this full chain of authentication
                on your behalf — from notarization through consular
                submission — ensuring your documents are accepted without
                rejection.
              </p>
            </>
          )}

          {/* Country-specific requirements */}
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4">
              <p className="text-xs text-[#C6A55A] uppercase tracking-widest mb-1">Route</p>
              <p className="text-white font-medium">{isHague ? "Hague Apostille" : "Consular Legalization"}</p>
            </div>
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4">
              <p className="text-xs text-[#C6A55A] uppercase tracking-widest mb-1">Translation</p>
              <p className="text-white font-medium">
                {country.certifiedTranslationRequired
                  ? `Certified ${country.translationLanguage ?? "translation"} required`
                  : country.translationLanguage
                  ? `${country.translationLanguage} (recommended)`
                  : "English accepted"}
              </p>
            </div>
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4">
              <p className="text-xs text-[#C6A55A] uppercase tracking-widest mb-1">Witnesses</p>
              <p className="text-white font-medium">
                {country.requiresWitnesses
                  ? `${country.witnessCount ?? 2} witness${(country.witnessCount ?? 2) > 1 ? "es" : ""} required`
                  : "Not required"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8 text-center">
            Apostille Process for {country.name}
          </h2>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex gap-6 bg-[#111111] border border-[#2A2A2A] rounded-xl p-6"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C6A55A]/10 border border-[#C6A55A]/30 flex items-center justify-center">
                  <span className="text-[#C6A55A] font-medium">{index + 1}</span>
                </div>
                <div>
                  <h3 className="font-medium text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-[#B0B0B0]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common Documents */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8 text-center">
            Documents Commonly Apostilled for {country.name}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {commonDocIds.slice(0, 10).map((docId) => (
              <Link
                key={docId}
                href={`/apostille/${country.id}/${docId}`}
                className="flex items-center gap-3 p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg hover:border-[#C6A55A]/30 transition-colors group"
              >
                <FileCheck className="w-5 h-5 text-[#C6A55A]" />
                <span className="text-[#B0B0B0] group-hover:text-white transition-colors capitalize">
                  {docId.replace(/-/g, " ")}
                </span>
                <ArrowRight className="w-4 h-4 text-[#B0B0B0] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8 text-center">
            Why Choose The Milano Seal™
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Shield,
                title: "Procedural Compliance",
                description: `We prepare your documents to meet the authentication requirements for ${country.name}, confirmed before execution.`,
              },
              {
                icon: Globe,
                title: "International Expertise",
                description: isHague
                  ? "Deep understanding of Hague Convention requirements and cross-border procedures."
                  : "Experienced in consular legalization chains across non-Hague jurisdictions.",
              },
              {
                icon: CheckCircle,
                title: "End-to-End Service",
                description: isHague
                  ? "From notarization through apostille certification and delivery."
                  : "Full coordination from notarization through consular submission and delivery.",
              },
              {
                icon: FileCheck,
                title: "Executed Properly",
                description:
                  "Every document is handled with precision and procedural control.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6"
              >
                <div className="inline-flex p-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
                  <item.icon className="w-5 h-5 text-[#C6A55A]" />
                </div>
                <h3 className="font-medium text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[#B0B0B0]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
            Ready to Begin?
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Start your apostille process for {country.name} today. Discretion
            and compliance at every step.
          </p>
          <Link
            href={`/intake?country=${country.id}`}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Begin Execution</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
