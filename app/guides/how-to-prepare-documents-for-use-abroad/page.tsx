import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, FileCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, faqSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "How to Prepare Documents for Use Abroad | The Milano Seal™",
  description:
    "A step-by-step guide to preparing documents for international use: document type identification, jurisdiction confirmation, apostille vs. legalization routing, translation, and courier planning.",
  alternates: { canonical: "https://www.themilanoseal.com/guides/how-to-prepare-documents-for-use-abroad" },
  robots: { index: true, follow: true },
};

const faqs = [
  {
    question: "What is the first step in preparing a document for use abroad?",
    answer:
      "The first step is identifying the document type and the jurisdiction where it was issued or will be notarized. This determines which competent authority handles the apostille and whether apostille or legalization is the correct path for the destination country.",
  },
  {
    question: "Do I need to have the document notarized before getting an apostille?",
    answer:
      "For privately prepared documents (such as powers of attorney or affidavits), notarization is required before an apostille can be obtained. For government-issued vital records (birth certificates, marriage certificates, death certificates), the issuing authority's certification may be sufficient — notarization may not be needed.",
  },
  {
    question: "How do I know if my document needs translation?",
    answer:
      "Translation requirements depend on the destination country and the receiving authority. Many foreign receiving authorities require certified translation of documents into the local language. This must be confirmed with the receiving authority or the operator before execution begins.",
  },
  {
    question: "What documents should I submit with my intake form?",
    answer:
      "Include the document type, destination country, signer details, and any deadline requirements. If you have a draft of the document, include it for review. If the receiving authority has specific instructions, include those as well. The operator will review and confirm the execution path before work begins.",
  },
];

const steps = [
  {
    step: "01",
    title: "Identify the Document Type",
    body: "Determine exactly what type of document you need — power of attorney, affidavit, corporate resolution, vital record, or other. The document type affects which execution path applies and what the receiving authority will require.",
  },
  {
    step: "02",
    title: "Confirm Origin Jurisdiction",
    body: "Identify where the document will be notarized or was originally issued. For notarized documents, the notary's commission state determines the apostille authority. For vital records, the issuing state government is the origin.",
  },
  {
    step: "03",
    title: "Determine the Destination Country's Requirements",
    body: "Confirm whether the destination country is a Hague Apostille Convention member. If yes, the apostille path applies. If no, consular legalization is required. Also confirm what the specific receiving authority requires beyond the apostille.",
  },
  {
    step: "04",
    title: "Select Notarization Type",
    body: "Decide between Remote Online Notarization (RON) or wet-ink notarization based on the receiving authority's requirements. RON is eligible for Florida apostille, but some foreign authorities require wet ink. Confirm before scheduling.",
  },
  {
    step: "05",
    title: "Prepare the Document Draft",
    body: "Ensure the document is properly drafted before the notarization session. The notary cannot advise on document content. If legal review is needed, consult a licensed attorney before proceeding.",
  },
  {
    step: "06",
    title: "Execute with Notary",
    body: "Complete the notarization session — in-person or via RON. The notary witnesses the signing, applies the notarial certificate, signature, and seal. All pages requiring attestation must be present during the session.",
  },
  {
    step: "07",
    title: "Coordinate Apostille or Legalization",
    body: "Submit the notarized document for apostille by the competent state authority (e.g., Florida Department of State) or for consular legalization if the destination is a non-Hague country. This step involves submission, processing time, and return handling.",
  },
  {
    step: "08",
    title: "Arrange Translation and Courier",
    body: "If certified translation is required, coordinate it after the apostille is returned. Then arrange tracked courier delivery to the receiving authority with appropriate release controls.",
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
          { name: "How to Prepare Documents for Use Abroad", url: "/guides/how-to-prepare-documents-for-use-abroad" },
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
              How to Prepare Documents for Use Abroad
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed">
              Preparing documents for international use involves more than notarization. This guide outlines the complete execution path — from document identification through courier delivery — to help ensure documents are accepted by the receiving authority abroad.
            </p>
          </div>
        </section>
        <section className="pb-16 px-6">
          <div className="max-w-3xl mx-auto space-y-10">

            <div>
              <h2 className="font-serif text-2xl font-medium text-white mb-4">Step-by-Step Preparation Guide</h2>
              <div className="space-y-3">
                {steps.map(({ step, title, body }) => (
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
              <h2 className="font-serif text-2xl font-medium text-white">What Can Go Wrong Without Proper Preparation</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Documents are commonly rejected by foreign receiving authorities due to missing apostille, incorrect notarization format, absent translation, wrong document type, or failure to meet the receiving authority's specific requirements. Rejection can result in significant delays and require re-execution from the beginning.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                Operator review before execution begins is the most effective way to avoid rejection.
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
                The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. The Milano Seal does not provide legal advice. Legal questions should be handled by a licensed attorney.
              </p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
