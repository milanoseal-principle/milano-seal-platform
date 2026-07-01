import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, FileCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, faqSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Apostille vs. Legalization | The Milano Seal™",
  description:
    "Apostille and legalization are two different document authentication paths for international use. Which path applies depends on the destination country's Hague Convention membership status.",
  alternates: { canonical: "https://www.themilanoseal.com/guides/apostille-vs-legalization" },
  robots: { index: true, follow: true },
};

const faqs = [
  {
    question: "What is the difference between apostille and legalization?",
    answer:
      "An apostille is a simplified authentication certificate used between Hague Apostille Convention member countries. Legalization (also called consular legalization) is a multi-step authentication process required for documents destined for countries that are not Hague members.",
  },
  {
    question: "How do I know if my destination country requires an apostille or legalization?",
    answer:
      "If the destination country is a member of the Hague Apostille Convention, an apostille is the appropriate path. If not, consular legalization is typically required. The receiving authority's specific requirements should also be confirmed.",
  },
  {
    question: "Is legalization more expensive than apostille?",
    answer:
      "Legalization typically involves more steps — including authentication by the U.S. Department of State and processing by the destination country's embassy or consulate — which can make it more time-consuming and complex to coordinate.",
  },
  {
    question: "Can a document have both an apostille and legalization?",
    answer:
      "No. Apostille and legalization are alternative paths — not additive. Which path applies is determined by the destination country's Hague Convention membership status and the receiving authority's requirements.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={faqSchema(faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Guides", url: "/guides" },
          { name: "Apostille vs. Legalization", url: "/guides/apostille-vs-legalization" },
        ])}
      />
      <main className="min-h-screen bg-[#0A0A0A]">
        <Header />
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
              <FileCheck className="w-4 h-4 text-[#C6A55A]" />
              <span className="text-sm text-[#C6A55A] font-medium">Guide</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6">
              Apostille vs. Legalization
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed">
              When preparing documents for international use, the authentication path depends on where the document is going. Apostille and legalization are two different processes — and choosing the wrong one can result in rejection by the receiving authority.
            </p>
          </div>
        </section>
        <section className="pb-16 px-6">
          <div className="max-w-3xl mx-auto space-y-10">

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">The Apostille Path</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                For documents destined for countries that are members of the Hague Apostille Convention, the apostille path applies. An apostille is a single standardized certificate issued by the competent authority in the document's origin jurisdiction. In Florida, that authority is the Florida Department of State.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                The apostille path is simpler because it eliminates the need for embassy or consulate processing. Once the apostille is attached, the document is recognized by all other Hague member states without further authentication — though the receiving authority may still have its own requirements regarding translation, format, or content.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">The Legalization Path</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                For documents destined for countries that are not Hague members — such as China, Saudi Arabia, or certain other jurisdictions — consular legalization is required. This process typically involves:
              </p>
              <ol className="space-y-2 text-[#B0B0B0]">
                {[
                  "Notarization (if the document is not already a certified government-issued record)",
                  "Authentication by the state-level authority (e.g., Florida Department of State)",
                  "Authentication by the U.S. Department of State",
                  "Legalization by the destination country's embassy or consulate in the United States",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-serif text-[#C6A55A]/40 font-medium flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">How Destination Country Determines the Path</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-[#111111] border border-[#2A2A2A] rounded-xl">
                  <h3 className="font-medium text-white mb-2">Hague Member Countries</h3>
                  <p className="text-[#B0B0B0] text-sm">Italy, Spain, Portugal, France, Germany, Brazil, Mexico, United Kingdom, Australia, and 100+ others → Apostille path</p>
                </div>
                <div className="p-5 bg-[#111111] border border-[#2A2A2A] rounded-xl">
                  <h3 className="font-medium text-white mb-2">Non-Hague Countries</h3>
                  <p className="text-[#B0B0B0] text-sm">China, Saudi Arabia, Kuwait, Pakistan, and others → Consular legalization path</p>
                </div>
              </div>
              <p className="text-[#B0B0B0] leading-relaxed text-sm">
                Note: UAE joined the Hague Convention in 2021, but receiving authorities within the UAE may have additional requirements. Always confirm with the specific receiving authority.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Why Receiving Authority Requirements Matter</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Even when a destination country accepts apostilles, the specific receiving authority — a notary, registry office, bank, court, or government body — may impose additional requirements. These can include certified translation, specific document formats, or particular notarization language. Operator review before submission is always recommended.
              </p>
            </div>

            {/* FAQ */}
            <div>
              <h2 className="font-serif text-2xl font-medium text-white mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div
                    key={faq.question}
                    className="p-5 bg-[#111111] border border-[#2A2A2A] rounded-xl"
                  >
                    <h3 className="font-medium text-white mb-2">{faq.question}</h3>
                    <p className="text-[#B0B0B0] text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center py-8 border-t border-[#2A2A2A]">
              <Link
                href="/intake"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg"
              >
                <span>Start Secure Intake</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="mt-6 text-xs text-[#4A4A4A] leading-relaxed max-w-lg mx-auto">
                The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. Document execution coordination only. The Milano Seal™ does not provide legal guidance. Legal questions should be handled by a licensed attorney.
              </p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
