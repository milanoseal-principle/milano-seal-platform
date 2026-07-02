import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, FileCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, faqSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Florida Apostille Timeline Guide | The Milano Seal™",
  description:
    "Understanding what affects the Florida apostille timeline — notarization, Florida Department of State processing queue, and courier. No timing is guaranteed.",
  alternates: { canonical: "https://www.themilanoseal.com/guides/florida-apostille-timeline" },
  robots: { index: true, follow: true },
};

const faqs = [
  {
    question: "How long does a Florida apostille take?",
    answer:
      "Processing time depends on the Florida Department of State's current workload and submission method. Timing cannot be guaranteed in advance. Factors include the type of document, completeness of submission, and current processing queue. Inquire during intake for current estimates.",
  },
  {
    question: "Is there a rush apostille option in Florida?",
    answer:
      "The Florida Department of State may offer expedited processing options. However, timing cannot be guaranteed even with expedited processing, as availability depends on the Department's current volume. Rush requests must be confirmed at the time of submission.",
  },
  {
    question: "What can delay a Florida apostille?",
    answer:
      "Common delays include incomplete or incorrect submissions, documents with notarizations that cannot be verified in the state database, missing certified copies, high processing volume at the Florida Department of State, and holidays or administrative closures.",
  },
  {
    question: "What should I tell the operator about my deadline?",
    answer:
      "Include your deadline or closing date in the intake form. The operator will review feasibility and advise whether the timeline is realistic given current processing conditions. If the deadline cannot be met, the operator will advise alternative options.",
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
          { name: "Florida Apostille Timeline Guide", url: "/guides/florida-apostille-timeline" },
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
              Florida Apostille Timeline Guide
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed">
              The time required to complete a Florida apostille depends on several factors — from notarization scheduling to Florida Department of State processing volume to courier transit. Understanding what affects timing helps set realistic expectations.
            </p>
          </div>
        </section>
        <section className="pb-16 px-6">
          <div className="max-w-3xl mx-auto space-y-10">

            <div className="p-5 bg-[#1A1400] border border-[#C6A55A]/20 rounded-xl">
              <h2 className="font-medium text-[#C6A55A] mb-2">Important Notice</h2>
              <p className="text-[#B0B0B0] text-sm leading-relaxed">
                Apostille timing cannot be guaranteed. The Florida Department of State sets its own processing schedule, which fluctuates based on submission volume, staffing, and administrative conditions. No provider can guarantee apostille completion by a specific date. The Milano Seal will advise on current conditions during intake review.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">What Affects Florida Apostille Timing</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                The Florida apostille process involves multiple sequential steps, each with its own timeline. Total time is the sum of all steps — a delay at any stage affects the overall timeline.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Step 1: Notarization</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                The document must be properly notarized before it can be submitted for apostille. For Remote Online Notarization (RON), scheduling is typically faster than coordinating an in-person mobile notary. The document must be finalized and ready before the notarization session — the notary cannot advise on content.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                For wet-ink notarization, physical document logistics (printing, signing, returning to the operator) add time.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Step 2: Florida Department of State Processing</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                After notarization, the document is submitted to the Florida Department of State for apostille issuance. The Department's processing time varies based on current submission volume. Standard processing typically takes longer than expedited processing, but neither carries a guarantee.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                The Department may return documents that are incomplete, have notarization issues, or do not meet submission requirements. Rejections restart the clock.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Step 3: Courier and International Transit</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                After the apostille is returned, the document packet is prepared for courier delivery to the destination. International courier transit adds time depending on the destination country. Customs clearance and local delivery in the destination country can also introduce variability.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Rush Handling</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Rush handling can reduce time at certain stages — particularly notarization scheduling and courier selection. However, Florida Department of State processing time is outside the operator's control. Expedited submission options may be available but cannot guarantee completion by a specific date.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                Clients with hard deadlines (property closings, visa appointments, court filings) should begin the process as early as possible and include deadline information in the intake form.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">What to Include in Your Intake</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                To help the operator assess your timeline, include in your intake:
              </p>
              <ul className="space-y-1 text-[#B0B0B0] list-disc list-inside">
                <li>Document type and origin jurisdiction</li>
                <li>Destination country and receiving authority</li>
                <li>Deadline or closing date (if any)</li>
                <li>Whether rush handling is needed</li>
                <li>Whether the document draft is ready or still being prepared</li>
              </ul>
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
