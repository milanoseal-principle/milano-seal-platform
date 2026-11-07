import type { Metadata } from "next";
import Link from "next/link";
import { CommercialCtaRow } from "@/components/conversion/CommercialCtaRow";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, CheckCircle } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, serviceSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Medical Document Apostille and Notary Support | The Milano Seal™",
  description:
    "Apostille coordination and notary support for medical consent forms, healthcare powers of attorney, and medical records authorization. Florida-based. International scope.",
  alternates: { canonical: "https://www.themilanoseal.com/services/medical-document-apostille" },
};

const supported = [
  "Medical consent documents requiring notarization",
  "Healthcare powers of attorney for international use",
  "Medical records authorization forms",
  "In-person notarization for high-risk medical documents",
  "Apostille coordination for documents used abroad",
  "Courier chain-of-custody tracking",
];

export default function MedicalDocumentApostillePage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd
        data={serviceSchema(
          "Medical Document Apostille and Notary Support",
          "Apostille coordination and notary support for medical consent forms, healthcare powers of attorney, and medical records authorization.",
          "/services/medical-document-apostille"
        )}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Services", url: "/services" },
          { name: "Medical Document Apostille", url: "/services/medical-document-apostille" },
        ])}
      />
      <main className="min-h-screen bg-[#0A0A0A]">
        <Header />
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-white mb-6">
              Medical Document Apostille and Notary Support
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed mb-8">
              Medical consent forms, healthcare powers of attorney, and medical records authorization documents used internationally often require notarization and apostille. The Milano Seal provides document execution coordination for qualifying medical documents — with in-person notarization available for documents that require physical presence.
            </p>
            <div className="p-5 bg-[#111111] border border-[#C6A55A]/20 rounded-xl mb-8">
              <p className="text-sm text-[#B0B0B0]">
                <strong className="text-white">Scope of Services:</strong> The Milano Seal does not provide medical advice, treatment recommendations, or medical diagnoses. Document execution support is administrative in nature. Healthcare provider and facility acceptance requirements must be confirmed before document execution.
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
              The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. The Milano Seal does not provide medical advice, treatment recommendations, healthcare compliance advice, or legal guidance. Medical and legal questions should be handled by qualified professionals.</p>
          </div>
                  <CommercialCtaRow context={{ serviceIntent: "apostille", source: "service-medical-document-apostille" }} actions={["get_pricing", "speak"]} className="mt-6" />
        </section>
        <Footer />
      </main>
    </>
  );
}
