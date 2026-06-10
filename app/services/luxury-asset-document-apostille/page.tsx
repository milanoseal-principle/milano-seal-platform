import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, CheckCircle } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, serviceSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Luxury Asset Document Apostille | The Milano Seal™",
  description:
    "Apostille coordination and notary support for luxury asset bills of sale, custody transfer affidavits, and high-value asset documentation used in international transactions.",
  alternates: { canonical: "https://www.themilanoseal.com/services/luxury-asset-document-apostille" },
};

const supported = [
  "Luxury asset bills of sale requiring notarization and apostille",
  "Custody transfer affidavits for cross-border asset transfers",
  "High-value personal property documentation for foreign authorities",
  "Ownership affidavits for luxury assets",
  "Apostille coordination for documents used in international transactions",
  "Operator review for destination authority requirements",
];

export default function LuxuryAssetDocumentApostillePage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd
        data={serviceSchema(
          "Luxury Asset Document Apostille",
          "Apostille coordination and notary support for luxury asset bills of sale, custody transfer affidavits, and high-value asset documentation used internationally.",
          "/services/luxury-asset-document-apostille"
        )}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Services", url: "/services" },
          { name: "Luxury Asset Document Apostille", url: "/services/luxury-asset-document-apostille" },
        ])}
      />
      <main className="min-h-screen bg-[#0A0A0A]">
        <Header />
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-white mb-6">
              Luxury Asset Document Apostille
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed mb-8">
              Cross-border transfers of luxury assets — collectibles, fine art, rare items, and other high-value personal property — often require notarized and apostilled documentation for customs, import authorities, and foreign registries. The Milano Seal provides document execution coordination for luxury asset transactions with international document requirements.
            </p>
            <div className="p-5 bg-[#111111] border border-[#C6A55A]/20 rounded-xl mb-8">
              <p className="text-sm text-[#B0B0B0]">
                <strong className="text-white">Scope of Services:</strong> The Milano Seal does not provide asset valuation, appraisal services, or legal advice regarding asset ownership or transfer. Document execution support is administrative in nature. Customs and import compliance requirements must be confirmed with appropriate authorities.
              </p>
            </div>
            <h2 className="font-serif text-xl font-medium text-white mb-4">Documents We Support</h2>
            <div className="grid md:grid-cols-2 gap-3 mb-10">
              {supported.map((item) => (
                <div key={item} className="flex items-start gap-3 p-4 bg-[#111111] border border-[#2A2A2A] rounded-lg">
                  <CheckCircle className="w-4 h-4 text-[#C6A55A] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#B0B0B0]">{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/intake"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
            >
              <span>Start Secure Intake</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <p className="mt-8 text-xs text-[#4A4A4A] leading-relaxed">
              I am not an attorney. Legal services are provided by Demesmin &amp; Dover PLLC. Final document acceptance rests with the receiving foreign authority.
            </p>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
