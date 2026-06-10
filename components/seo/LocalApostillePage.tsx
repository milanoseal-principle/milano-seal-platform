"use client";

import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, MapPin } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, serviceSchema, faqSchema, breadcrumbSchema } from "@/lib/seo/schema";

interface LocalApostillePageProps {
  cityName: string;
  regionLabel: string;
  slug: string;
  canonicalPath: string;
  headline: string;
  description: string;
  nearbyAreas: string[];
  metaTitle: string;
  metaDescription: string;
}

export function LocalApostillePage({
  cityName,
  regionLabel,
  slug,
  canonicalPath,
  headline,
  description,
  nearbyAreas,
}: LocalApostillePageProps) {
  const faqs = [
    {
      question: `Do I need to be in ${cityName} to use The Milano Seal?`,
      answer: `No. Remote Online Notarization (RON) allows signers to complete notarized documents from anywhere with a compliant video connection. Physical presence in ${cityName} is not required for most document types.`,
    },
    {
      question: "How long does apostille coordination take?",
      answer:
        "Timing depends on the document type, origin jurisdiction, Florida Department of State processing queue, and destination country requirements. Timing cannot be guaranteed in advance.",
    },
    {
      question: "What documents can The Milano Seal coordinate for international use?",
      answer:
        "The Milano Seal coordinates apostille and notarization for powers of attorney, affidavits, corporate documents, vital records, real estate documents, and other documents intended for international use. Document eligibility depends on origin jurisdiction and destination authority requirements.",
    },
    {
      question: "How do I start?",
      answer:
        "Submit the secure intake form with your document type, destination country, signer details, and any timing requirements. The Milano Seal will review the execution path and send a quote before any work begins.",
    },
  ];

  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd
        data={serviceSchema(
          `${cityName} Apostille Services`,
          description,
          canonicalPath
        )}
      />
      <JsonLd data={faqSchema(faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: regionLabel, url: `/${slug}` },
          { name: "Apostille Services", url: canonicalPath },
        ])}
      />
      <main className="min-h-screen bg-[#0A0A0A]">
        <Header />
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
              <MapPin className="w-4 h-4 text-[#C6A55A]" />
              <span className="text-sm text-[#C6A55A] font-medium">
                {regionLabel} · Florida
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-white mb-6">
              {headline}
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed mb-8">{description}</p>
            <Link
              href="/intake"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg"
            >
              <span>Start Secure Intake</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        <section className="pb-16 px-6">
          <div className="max-w-3xl mx-auto space-y-10">
            <div>
              <h2 className="font-serif text-2xl font-medium text-white mb-4">
                Document Execution Support for {cityName} Clients
              </h2>
              <p className="text-[#B0B0B0] leading-relaxed mb-4">
                The Milano Seal provides apostille coordination, Remote Online Notarization (RON), mobile notary coordination, and international document release support for clients in the {cityName} area and across Florida. Documents prepared in Florida must go through the Florida Department of State for apostille issuance before they can be used in Hague Convention member countries.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                The authentication path — apostille or consular legalization — depends on the destination country and receiving authority. The Milano Seal reviews each matter individually before issuing a quote or confirming execution timelines.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-medium text-white mb-4">Common Documents</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Power of Attorney",
                  "Affidavits",
                  "Corporate Resolutions",
                  "Birth Certificates",
                  "Marriage Certificates",
                  "Divorce Decrees",
                  "School Transcripts",
                  "Real Estate Documents",
                  "FBI Background Checks",
                  "Articles of Incorporation",
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

            <div>
              <h2 className="font-serif text-2xl font-medium text-white mb-4">How It Works</h2>
              <div className="space-y-3">
                {[
                  {
                    step: "01",
                    title: "Submit Secure Intake",
                    body: "Provide document type, destination country, signer details, and timing requirements.",
                  },
                  {
                    step: "02",
                    title: "Operator Review",
                    body: "The Milano Seal reviews the execution path — apostille or legalization — and confirms requirements before any work begins.",
                  },
                  {
                    step: "03",
                    title: "Quote Issued",
                    body: "A fixed quote is issued. No work begins without written confirmation.",
                  },
                  {
                    step: "04",
                    title: "Execution & Release",
                    body: "Notarization, apostille coordination, and international release with courier tracking.",
                  },
                ].map(({ step, title, body }) => (
                  <div
                    key={step}
                    className="flex gap-5 p-5 bg-[#111111] border border-[#2A2A2A] rounded-xl"
                  >
                    <span className="font-serif text-2xl font-medium text-[#C6A55A]/20 flex-shrink-0 leading-none mt-1">
                      {step}
                    </span>
                    <div>
                      <h3 className="font-medium text-white mb-1">{title}</h3>
                      <p className="text-[#B0B0B0] text-sm leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {nearbyAreas.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl font-medium text-white mb-4">Service Area</h2>
                <p className="text-[#B0B0B0] mb-4">
                  The Milano Seal serves clients in {cityName} and surrounding areas including{" "}
                  {nearbyAreas.join(", ")}. Remote Online Notarization is available to signers
                  anywhere in Florida and across the United States.
                </p>
              </div>
            )}

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

            <div className="text-center py-8 border-t border-[#2A2A2A]">
              <h2 className="font-serif text-2xl font-medium text-white mb-4">Ready to Begin?</h2>
              <p className="text-[#B0B0B0] mb-6 max-w-lg mx-auto">
                Submit your document details and destination country. The Milano Seal will confirm the
                execution path and issue a quote before any work begins.
              </p>
              <Link
                href="/intake"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg"
              >
                <span>Start Secure Intake</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="mt-6 text-xs text-[#4A4A4A] leading-relaxed max-w-lg mx-auto">
                The Milano Seal supports document execution logistics, notarization coordination,
                apostille coordination, courier tracking, and release controls. The Milano Seal does
                not provide legal advice. Legal questions should be handled by a licensed attorney.
              </p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
