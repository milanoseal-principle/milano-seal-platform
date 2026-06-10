import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, CheckCircle } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, serviceSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Equine Document Apostille and Notary Support | The Milano Seal™",
  description:
    "Apostille coordination and notary support for equine bills of sale, horse ownership transfers, and equine export documents. Florida-based. International scope.",
  alternates: { canonical: "https://www.themilanoseal.com/services/equine-document-apostille" },
};

const supported = [
  "Equine bills of sale requiring notarization",
  "Horse ownership transfer documents for international registration",
  "Equine powers of attorney",
  "Equine export support documents requiring apostille",
  "Remote online notarization for qualifying equine documents",
  "Courier chain-of-custody tracking",
];

export default function EquineDocumentApostillePage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd
        data={serviceSchema(
          "Equine Document Apostille and Notary Support",
          "Apostille coordination and notary support for equine bills of sale, horse ownership transfers, and equine export documents.",
          "/services/equine-document-apostille"
        )}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Services", url: "/services" },
          { name: "Equine Document Apostille", url: "/services/equine-document-apostille" },
        ])}
      />
      <main className="min-h-screen bg-[#0A0A0A]">
        <Header />
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-white mb-6">
              Equine Document Apostille and Notary Support
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed mb-8">
              International equine transactions — including horse sales, ownership transfers, and export registrations — frequently require notarized and apostilled documents for foreign breed registries, customs authorities, and receiving country agencies. The Milano Seal provides document execution coordination for equine-related documents used abroad.
            </p>
            <div className="p-5 bg-[#111111] border border-[#C6A55A]/20 rounded-xl mb-8">
              <p className="text-sm text-[#B0B0B0]">
                <strong className="text-white">Scope of Services:</strong> The Milano Seal does not provide veterinary advice, animal export licensing, or equine legal advice. Document execution support is administrative in nature. Export health certificates and import permits are outside the scope of this service.
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
