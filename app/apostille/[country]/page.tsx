import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { countries, getCountryBySlug, documents } from "@/lib/seo-data";
import {
  ArrowRight,
  CheckCircle,
  Globe,
  Shield,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ country: string }>;
}

export async function generateStaticParams() {
  return countries.map((country) => ({
    country: country.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { country: countrySlug } = await params;

  // Prevent matching file extensions
  if (countrySlug.includes(".")) {
    return { title: "Not Found" };
  }

  const country = getCountryBySlug(countrySlug);

  if (!country) {
    return { title: "Not Found" };
  }

  return {
    title: `Apostille for ${country.name} | U.S. Document Authentication | The Milano Seal™`,
    description: `Professional apostille services for documents destined for ${country.name}. U.S. document authentication through Florida Secretary of State for Hague Convention compliance. Fast, reliable execution.`,
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
      canonical: `https://themilanoseal.com/apostille/${country.slug}`,
    },
    openGraph: {
      title: `Apostille for ${country.name} | The Milano Seal™`,
      description: `Professional apostille services for documents destined for ${country.name}. Hague Convention compliant authentication.`,
    },
  };
}

export default async function ApostilleCountryPage({ params }: PageProps) {
  const { country: countrySlug } = await params;

  // Prevent matching file extensions
  if (countrySlug.includes(".")) {
    notFound();
  }

  const country = getCountryBySlug(countrySlug);

  if (!country) {
    notFound();
  }

  const steps = [
    {
      title: "Document Preparation",
      description: `Ensure your document meets ${country.name}'s requirements and is properly notarized under Florida law.`,
    },
    {
      title: "Notarization",
      description:
        "Remote Online Notarization (RON) or in-person mobile notarization with a certified Florida notary.",
    },
    {
      title: "State Authentication",
      description:
        "Document submitted to the Florida Secretary of State for apostille certification.",
    },
    {
      title: "Delivery",
      description: `Apostilled documents delivered digitally and physically, ready for use in ${country.name}.`,
    },
  ];

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <Globe className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">
              Hague Convention Member
            </span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white mb-6 text-balance">
            Apostille for {country.name}
          </h1>

          <p className="text-lg md:text-xl text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            Professional U.S. document authentication for acceptance in{" "}
            {country.name}. Structured for international use with procedural
            control across jurisdictions.
          </p>

          <Link
            href="/intake"
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
            What is an Apostille?
          </h2>
          <p className="text-[#B0B0B0] leading-relaxed mb-6">
            An apostille is a form of authentication issued to documents for use
            in countries that participate in the Hague Convention of 1961. As a
            member of the Hague Convention,
            {country.name} accepts apostilled U.S. documents without the need
            for further legalization through the embassy or consulate.
          </p>
          <p className="text-[#B0B0B0] leading-relaxed">
            The apostille certificate is attached to your original document,
            confirming that the signature, seal, or stamp on the document is
            genuine. This streamlined process replaces the traditional chain of
            authentication that would otherwise require multiple government
            agencies.
          </p>
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
                  <span className="text-[#C6A55A] font-medium">
                    {index + 1}
                  </span>
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
            {documents.slice(0, 10).map((doc) => (
              <Link
                key={doc.slug}
                href={`/documents/${doc.slug}/${country.slug}`}
                className="flex items-center gap-3 p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg hover:border-[#C6A55A]/30 transition-colors group"
              >
                <FileCheck className="w-5 h-5 text-[#C6A55A]" />
                <span className="text-[#B0B0B0] group-hover:text-white transition-colors">
                  {doc.name}
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
                title: "Compliance Guaranteed",
                description: `We ensure your documents meet all requirements for acceptance in ${country.name}.`,
              },
              {
                icon: Globe,
                title: "International Expertise",
                description:
                  "Deep understanding of Hague Convention requirements and cross-border procedures.",
              },
              {
                icon: CheckCircle,
                title: "End-to-End Service",
                description:
                  "From notarization through apostille certification and delivery.",
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
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Begin Secure Intake</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
