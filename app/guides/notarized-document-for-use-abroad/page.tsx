import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, FileCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, faqSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Notarized Document for Use Abroad | The Milano Seal™",
  description:
    "A notarized document intended for international use typically requires additional steps beyond notarization — including apostille coordination or consular legalization and often translation.",
  alternates: { canonical: "https://www.themilanoseal.com/guides/notarized-document-for-use-abroad" },
  robots: { index: true, follow: true },
};

const faqs = [
  {
    question: "Is a notarized document automatically valid abroad?",
    answer:
      "No. Notarization is a domestic process. For a notarized document to be recognized by a foreign authority, it typically needs an apostille (for Hague member countries) or consular legalization (for non-Hague countries).",
  },
  {
    question: "Does the notary need to be in the same state as the signer?",
    answer:
      "For traditional wet-ink notarization, the notary and signer are typically in the same physical location. For Remote Online Notarization (RON), the notary is commissioned in a specific state, but the signer can be located anywhere — though the receiving authority may have specific requirements regarding RON acceptance.",
  },
  {
    question: "What language does the notarized document need to be in?",
    answer:
      "Many foreign receiving authorities require certified translation of notarized documents. The language requirement depends on the destination country and the specific receiving authority's rules. Translation is separate from notarization and apostille.",
  },
  {
    question: "Can a Power of Attorney be notarized and apostilled for use in another country?",
    answer:
      "Yes. Powers of attorney are among the most common documents notarized and apostilled for international use. However, the receiving country or specific receiving authority may have requirements regarding the document's language, content, or specific notarization format.",
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
          { name: "Notarized Document for Use Abroad", url: "/guides/notarized-document-for-use-abroad" },
        ])}
      />
      <main className="min-h-screen bg-[#0A0A0A]">
        <Header />
        <section className="pt-[calc(var(--header-total-height)+var(--sa-top)+2rem)] pb-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
              <FileCheck className="w-4 h-4 text-[#C6A55A]" />
              <span className="text-sm text-[#C6A55A] font-medium">Guide</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6">
              Notarized Document for Use Abroad
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed">
              Notarization is only the first step for documents intended for use in another country. Understanding the full execution chain — notarization, apostille or legalization, translation — is essential to ensuring the document is accepted by the receiving authority abroad.
            </p>
          </div>
        </section>
        <section className="pb-16 px-6">
          <div className="max-w-3xl mx-auto space-y-10">

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Why Notarization Alone Is Not Enough</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                A U.S. notarization is a domestic certification. When a U.S.-notarized document is presented to a foreign authority, that authority has no way to verify the notary's commission, credentials, or the authenticity of the notary seal — unless additional authentication has been performed.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                An apostille (for Hague member countries) or consular legalization (for non-Hague countries) provides that additional layer of authentication, confirming that the notary's signature and seal are genuine.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">The Execution Chain for International Use</h2>
              <div className="space-y-3">
                {[
                  { step: "01", title: "Document Preparation", body: "The document is drafted and reviewed for compliance with both U.S. execution requirements and the destination country's receiving authority requirements." },
                  { step: "02", title: "Notarization", body: "A commissioned notary (in-person or via Remote Online Notarization) witnesses the execution and applies their notarial certificate, signature, and seal." },
                  { step: "03", title: "Apostille or Legalization", body: "For Hague member countries: apostille is obtained from the state competent authority (e.g., Florida Department of State). For non-Hague countries: multi-step legalization through U.S. State Department and destination embassy or consulate." },
                  { step: "04", title: "Translation (if required)", body: "Many receiving authorities require a certified translation into the local language. Translation is separate from notarization and apostille." },
                  { step: "05", title: "Courier and Release", body: "The completed document packet is delivered to the destination via tracked courier with controlled release." },
                ].map(({ step, title, body }) => (
                  <div key={step} className="flex gap-5 p-5 bg-[#111111] border border-[#2A2A2A] rounded-xl">
                    <span className="font-serif text-2xl font-medium text-[#C6A55A]/20 flex-shrink-0 leading-none mt-1">{step}</span>
                    <div>
                      <h3 className="font-medium text-white mb-1">{title}</h3>
                      <p className="text-[#B0B0B0] text-sm leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">RON vs. Wet Ink for International Documents</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Remote Online Notarization (RON) is accepted for apostille purposes in Florida. However, certain receiving authorities — particularly in some European jurisdictions, courts, or consulates — may require wet ink notarization. This must be confirmed with the receiving authority before execution begins.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Translation Requirements</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Translation requirements vary by country and receiving authority. Some authorities require the entire document to be translated; others only require a translation of the notarial certificate. Certified translation is distinct from notarized translation. Operator review can help clarify what is required for a specific destination.
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
