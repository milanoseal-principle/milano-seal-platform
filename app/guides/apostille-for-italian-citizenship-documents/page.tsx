import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, FileCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, faqSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Apostille for Italian Citizenship Documents | The Milano Seal™",
  description:
    "Italian citizenship by descent often requires apostilled U.S. vital records — birth, marriage, death, and divorce documents — coordinated with Comuni and consulates.",
  alternates: { canonical: "https://www.themilanoseal.com/guides/apostille-for-italian-citizenship-documents" },
  robots: { index: true, follow: true },
};

const faqs = [
  {
    question: "What documents typically need apostilles for Italian citizenship by descent?",
    answer:
      "Common documents include U.S. birth certificates, marriage certificates, death certificates, divorce decrees, and naturalization records. The specific documents required depend on the lineage being documented and the requirements of the receiving Comune or consulate.",
  },
  {
    question: "Do all Italian Comuni accept apostilled U.S. documents?",
    answer:
      "Italy is a Hague Apostille Convention member, so apostilled U.S. documents are generally recognized. However, individual Comuni may have specific requirements regarding document format, translation, or the manner of presentation. Requirements should be confirmed with the receiving Comune or consulate.",
  },
  {
    question: "Do the documents need to be translated?",
    answer:
      "Italian authorities typically require certified Italian translation of apostilled U.S. documents. The translation must be made by a qualified translator. Translation requirements and accepted formats vary by Comune and consulate.",
  },
  {
    question: "What is apostille sequencing for citizenship documents?",
    answer:
      "Each document in the citizenship packet typically needs its own apostille. Documents must be apostilled by the competent authority in the state where they were issued. Florida-issued documents receive Florida apostilles; documents from other states require apostilles from those states' authorities.",
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
          { name: "Apostille for Italian Citizenship Documents", url: "/guides/apostille-for-italian-citizenship-documents" },
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
              Apostille for Italian Citizenship Documents
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed">
              Applications for Italian citizenship by descent typically require a packet of U.S. vital records — birth, marriage, death, and divorce documents — each with an apostille and certified Italian translation. Understanding the document requirements and sequencing helps avoid delays.
            </p>
          </div>
        </section>
        <section className="pb-16 px-6">
          <div className="max-w-3xl mx-auto space-y-10">

            <div className="p-5 bg-[#111111] border border-[#C6A55A]/20 rounded-xl">
              <h2 className="font-medium text-[#C6A55A] mb-2">Disclaimer</h2>
              <p className="text-[#B0B0B0] text-sm leading-relaxed">
                The Milano Seal does not provide Italian citizenship legal advice, citizenship eligibility determinations, consular guidance, or immigration advice. Document execution support is provided for apostille and notarization logistics only. Citizenship eligibility questions should be handled by a qualified attorney.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Common Document Types</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Italian citizenship by descent (jure sanguinis) matters typically involve assembling a chain of documentation that traces the lineage from the Italian ancestor to the current applicant. Each link in the chain typically requires one or more apostilled U.S. documents.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Birth Certificates</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                U.S. birth certificates are typically issued by the vital records office of the state where the birth occurred. For apostille purposes, the certificate must be a certified copy issued by the state vital records office — not a hospital record. The apostille is issued by the competent authority in the state of issuance.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Marriage Certificates</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Certified copies of marriage certificates from the county clerk or state vital records office are typically required for each marriage in the lineage chain. Each certificate needs its own apostille from the state where the marriage was recorded.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Divorce Records</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Certified copies of divorce decrees or divorce certificates from the relevant court are required when a marriage in the lineage chain ended in divorce. Apostille is issued by the state where the court is located.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Naturalization Records</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Documentation of naturalization is often critical in Italian citizenship by descent cases — particularly to establish whether the Italian ancestor naturalized before or after the birth of the Italian-American link in the chain. Naturalization records from USCIS or the National Archives may require additional authentication steps.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Name Variation Documents</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Name discrepancies across generations of documents — common in immigration-era records — may require affidavits of identity or name variation to explain differences. These affidavits typically require notarization and apostille.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Apostille Sequencing</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Each document in the packet requires its own apostille from the competent authority in the state where the document was issued. Documents from multiple states require apostilles from each respective state. All apostilles must be obtained before the packet is translated and submitted.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Translation Requirements</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Italian receiving authorities typically require certified Italian translation of all apostilled documents. Translation must be performed by a qualified translator. Some Comuni or consulates have specific translator qualifications or sworn translation requirements.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Comune and Consulate Receiving Authority Notes</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Individual Comuni (municipalities) and Italian consulates may have requirements that differ from general Italian law. Submission procedures, scheduling requirements, and specific document format requirements vary. Requirements should be confirmed directly with the receiving Comune or consulate before assembling the packet.
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
                <span>Start Controlled Intake</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="mt-6 text-xs text-[#4A4A4A] leading-relaxed max-w-lg mx-auto">
                The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. The Milano Seal does not provide legal advice, citizenship eligibility determinations, or consular guidance. Legal questions should be handled by a licensed attorney.
              </p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
