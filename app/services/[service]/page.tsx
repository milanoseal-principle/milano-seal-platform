import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { documents, countries, getDocumentBySlug } from "@/lib/seo-data";
import { ArrowRight, FileText, Globe, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ service: string }>;
}

export async function generateStaticParams() {
  return documents.map((doc) => ({
    service: doc.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { service: serviceSlug } = await params;

  if (serviceSlug.includes(".")) {
    return { title: "Not Found" };
  }

  const doc = getDocumentBySlug(serviceSlug);

  if (!doc) {
    return { title: "Not Found" };
  }

  return {
    title: `${doc.name} Notarization & Apostille Services | The Milano Seal™`,
    description: `Professional ${doc.name.toLowerCase()} notarization and apostille services. Remote Online Notarization and international authentication. Executed properly the first time.`,
    keywords: [
      `${doc.name.toLowerCase()} notarization`,
      `${doc.name.toLowerCase()} apostille`,
      `notarize ${doc.name.toLowerCase()}`,
      "document authentication",
      "RON notarization",
    ],
    alternates: { canonical: `https://themilanoseal.com/services/${doc.slug}` },
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { service: serviceSlug } = await params;

  if (serviceSlug.includes(".")) {
    notFound();
  }

  const doc = getDocumentBySlug(serviceSlug);

  if (!doc) {
    notFound();
  }

  const features = [
    "Remote Online Notarization (RON)",
    "Mobile notary services available",
    "Apostille coordination included",
    "Digital and physical delivery",
    "Identity verification",
    "Recorded session for compliance",
  ];

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <FileText className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">
              Document Services
            </span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            {doc.name} Services
          </h1>

          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            {doc.description} Professional notarization and apostille
            coordination for domestic and international use.
          </p>

          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Begin Execution</span>
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
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-[#C6A55A] flex-shrink-0" />
                <span className="text-[#B0B0B0]">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* International Options */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4 text-center">
            {doc.name} Apostille by Destination
          </h2>
          <p className="text-[#B0B0B0] text-center mb-8">
            Select your destination country for specific requirements and
            processing information.
          </p>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
            {countries.slice(0, 20).map((country) => (
              <Link
                key={country.slug}
                href={`/documents/${doc.slug}/${country.slug}`}
                className="flex items-center gap-2 p-3 bg-[#111111] border border-[#2A2A2A] rounded-lg hover:border-[#C6A55A]/30 transition-colors group"
              >
                <Globe className="w-4 h-4 text-[#C6A55A]" />
                <span className="text-sm text-[#B0B0B0] group-hover:text-white transition-colors">
                  {country.name}
                </span>
              </Link>
            ))}
          </div>

          <p className="text-center text-sm text-[#B0B0B0]/60 mt-6">
            Don&apos;t see your country?{" "}
            <Link href="/intake" className="text-[#C6A55A] hover:underline">
              Contact us
            </Link>{" "}
            for assistance.
          </p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-6 text-center">
              <div className="inline-flex p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
                <Shield className="w-6 h-6 text-[#C6A55A]" />
              </div>
              <h3 className="font-medium text-white mb-2">Certified Notary</h3>
              <p className="text-sm text-[#B0B0B0]">
                Florida certified with RON credentials.
              </p>
            </div>

            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-6 text-center">
              <div className="inline-flex p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
                <Globe className="w-6 h-6 text-[#C6A55A]" />
              </div>
              <h3 className="font-medium text-white mb-2">
                International Ready
              </h3>
              <p className="text-sm text-[#B0B0B0]">
                Structured for Hague Convention acceptance.
              </p>
            </div>

            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-6 text-center">
              <div className="inline-flex p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
                <CheckCircle className="w-6 h-6 text-[#C6A55A]" />
              </div>
              <h3 className="font-medium text-white mb-2">Full Service</h3>
              <p className="text-sm text-[#B0B0B0]">
                Notarization through delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
            Ready to Begin?
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Start your {doc.name.toLowerCase()} execution today. Discretion and
            compliance at every step.
          </p>
          <Link
            href="/intake"
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
