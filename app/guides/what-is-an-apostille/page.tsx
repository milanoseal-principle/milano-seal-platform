import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, FileCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, faqSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "What Is an Apostille? | The Milano Seal™",
  description:
    "An apostille is a certificate issued under the Hague Convention that authenticates a document for use in another Hague member country. Learn what it is, when you need one, and how the process works.",
  alternates: { canonical: "https://www.themilanoseal.com/guides/what-is-an-apostille" },
  robots: { index: true, follow: true },
};

const faqs = [
  {
    question: "What is an apostille?",
    answer:
      "An apostille is a standardized certificate issued under the Hague Convention of 1961 that authenticates the origin of a public document for use in another member country. It verifies the signature, seal, or stamp of the official who executed the document.",
  },
  {
    question: "Who issues an apostille in Florida?",
    answer:
      "In Florida, the Florida Department of State issues apostilles for documents executed by Florida officials, Florida-commissioned notaries, and certain other Florida public officials.",
  },
  {
    question: "Does every country accept an apostille?",
    answer:
      "No. Apostilles are recognized only by countries that are members of the Hague Apostille Convention. For documents destined for non-Hague countries, a different authentication process — typically consular legalization — is required.",
  },
  {
    question: "Can I get an apostille on any document?",
    answer:
      "Apostilles are issued on public documents: notarized documents, vital records, court documents, and certain official government documents. Private documents typically need notarization first before an apostille can be obtained.",
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
          { name: "What Is an Apostille?", url: "/guides/what-is-an-apostille" },
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
              What Is an Apostille?
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed">
              An apostille is a certificate issued under the Hague Convention that authenticates a document for recognition in another member country. Understanding what an apostille is — and when you need one — is the first step in preparing documents for international use.
            </p>
          </div>
        </section>
        <section className="pb-16 px-6">
          <div className="max-w-3xl mx-auto space-y-10">

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">The Hague Apostille Convention</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                The Hague Convention of October 5, 1961 established a simplified method for authenticating documents for use across member countries. When a document carries an apostille issued by the competent authority of its country of origin, it is accepted as authentic by all other Hague member states without further authentication.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                As of 2024, over 120 countries are members of the Hague Apostille Convention. However, membership alone does not guarantee that every receiving authority in a given country will accept every apostilled document — the receiving authority's own requirements still apply.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">What an Apostille Certifies</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                An apostille does not certify the content of a document. It certifies the authenticity of the signature, the capacity in which the person signing the document acted, and where applicable, the identity of the seal or stamp that the document bears.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                This is an important distinction: an apostille does not mean the document is "correct" or that its contents are accurate — only that the document was properly executed by the official or notary whose signature appears on it.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Documents That Typically Require an Apostille</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Power of Attorney",
                  "Birth Certificates",
                  "Marriage Certificates",
                  "Death Certificates",
                  "Divorce Decrees",
                  "Corporate Documents",
                  "Affidavits",
                  "School Transcripts",
                  "FBI Background Checks",
                  "Court Orders",
                ].map((doc) => (
                  <div
                    key={doc}
                    className="px-4 py-3 bg-[#111111] border border-[#2A2A2A] rounded-lg text-sm text-[#B0B0B0]"
                  >
                    {doc}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Who Issues the Apostille?</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Apostilles are issued by the "competent authority" designated by each country. In the United States, each state designates its own competent authority — typically the Secretary of State. The Florida Department of State issues apostilles for documents originating in Florida.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                The document must have originated in the issuing jurisdiction. A Florida notary's notarization generates a Florida apostille — not a federal apostille. Federal documents (such as FBI background checks) are apostilled by the U.S. Department of State.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">When an Apostille Is Not Enough</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                For documents destined for countries that are not members of the Hague Apostille Convention — such as China, the UAE (for certain purposes), or Saudi Arabia — a different authentication process is required. This typically involves authentication by the U.S. Department of State followed by legalization by the destination country's embassy or consulate.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                Some Hague member countries also have specific additional requirements imposed by the receiving authority, even when an apostille is present. Operator review is recommended before submitting documents.
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
