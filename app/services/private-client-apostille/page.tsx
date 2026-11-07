import type { Metadata } from "next";
import Link from "next/link";
import { CommercialCtaRow } from "@/components/conversion/CommercialCtaRow";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, CheckCircle } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, serviceSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Private Client Apostille & Document Execution | The Milano Seal™",
  description:
    "Discreet apostille coordination and document execution support for private clients — trust affidavits, international powers of attorney, family office authorizations, and private asset transfer documents.",
  alternates: { canonical: "https://www.themilanoseal.com/services/private-client-apostille" },
};

const supported = [
  "Trust affidavits requiring notarization and apostille",
  "International powers of attorney for private client matters",
  "Family office authorization documents",
  "Private asset transfer affidavits",
  "International banking support documents",
  "Discreet intake, execution, and courier coordination",
];

export default function PrivateClientApostillePage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd
        data={serviceSchema(
          "Private Client Apostille & Document Execution",
          "Discreet apostille coordination and document execution support for private clients — trust affidavits, international powers of attorney, family office authorizations, and private asset transfer documents.",
          "/services/private-client-apostille"
        )}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Services", url: "/services" },
          { name: "Private Client Apostille", url: "/services/private-client-apostille" },
        ])}
      />
      <main className="min-h-screen bg-[#0A0A0A]">
        <Header />
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-white mb-6">
              Private Client Apostille &amp; Document Execution
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed mb-8">
              Private clients with complex international document needs — trust structures, family office operations, private asset transfers, and multi-jurisdiction matters — require discreet, precise document execution coordination. The Milano Seal provides secure intake, notarization coordination, apostille submission, and courier tracking for private client documents used abroad.
            </p>
            <div className="p-5 bg-[#111111] border border-[#C6A55A]/20 rounded-xl mb-8">
              <p className="text-sm text-[#B0B0B0]">
                <strong className="text-white">Scope of Services:</strong> The Milano Seal does not provide legal, tax, estate planning, or financial advice. Document execution support is administrative in nature. All legal, tax, and financial decisions must be made with qualified legal and financial advisors.
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
              The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. The Milano Seal does not provide legal, tax, investment, banking, fiduciary, or estate planning advice.</p>
          </div>
                  <CommercialCtaRow context={{ serviceIntent: "apostille", source: "service-private-client-apostille" }} actions={["get_pricing", "speak"]} className="mt-6" />
        </section>
        <Footer />
      </main>
    </>
  );
}
