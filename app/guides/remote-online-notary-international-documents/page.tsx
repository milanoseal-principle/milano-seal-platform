import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, FileCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, faqSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Remote Online Notary for International Documents | The Milano Seal™",
  description:
    "Remote Online Notarization (RON) allows signers to execute documents via secure video connection. Florida RON-notarized documents can be apostilled — but receiving authority acceptance must be confirmed.",
  alternates: { canonical: "https://www.themilanoseal.com/guides/remote-online-notary-international-documents" },
  robots: { index: true, follow: true },
};

const faqs = [
  {
    question: "Can a RON-notarized document be apostilled?",
    answer:
      "Yes. In Florida, documents notarized via Remote Online Notarization (RON) are eligible for apostille by the Florida Department of State. The document must have been notarized by a Florida-commissioned RON notary using an approved platform.",
  },
  {
    question: "Do all foreign authorities accept RON-notarized documents?",
    answer:
      "No. Some foreign receiving authorities — particularly in certain European jurisdictions, consulates, or courts — may require wet ink notarization and may not accept RON. This must be confirmed with the receiving authority before execution begins.",
  },
  {
    question: "Where does the signer need to be for RON?",
    answer:
      "For RON, the signer can be located anywhere in the world — they do not need to be in Florida or the United States. The notary must be Florida-commissioned. The signer must have a compatible device with camera and microphone, and must be able to verify identity electronically.",
  },
  {
    question: "What happens if the receiving authority does not accept RON?",
    answer:
      "If the receiving authority requires wet ink notarization, a mobile notary or in-person execution arrangement must be made. This is why receiving authority requirements should be confirmed before execution begins.",
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
          { name: "Remote Online Notary for International Documents", url: "/guides/remote-online-notary-international-documents" },
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
              Remote Online Notary for International Documents
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed">
              Remote Online Notarization (RON) allows signers to execute notarized documents from anywhere in the world via secure video connection. For international document execution, RON offers significant logistical advantages — but receiving authority acceptance must always be confirmed in advance.
            </p>
          </div>
        </section>
        <section className="pb-16 px-6">
          <div className="max-w-3xl mx-auto space-y-10">

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">How RON Works</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                In a Remote Online Notarization session, the signer and notary connect via a compliant video platform. The signer verifies their identity through knowledge-based authentication and credential analysis. The notary observes the signing in real time, applies their electronic notarial certificate and seal, and the session is recorded and retained.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                Florida's RON framework was established under Florida Statute § 117.021 and subsequent rules, and Florida-commissioned RON notaries can notarize documents for signers located anywhere in the world.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">RON and the Apostille Path</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Florida RON-notarized documents are eligible for apostille by the Florida Department of State. The apostille process for RON documents is the same as for wet-ink notarized documents — the Florida Department of State verifies the notary's commission and issues the apostille.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                This makes RON a practical option for international signers who cannot travel to the United States but need U.S.-notarized and apostilled documents.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">When RON May Not Be Accepted</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Despite the legal validity of RON under Florida law and its eligibility for apostille, certain foreign receiving authorities may not accept electronically notarized documents. Common situations where wet ink may be required include:
              </p>
              <ul className="space-y-2 text-[#B0B0B0] list-disc list-inside">
                <li>Certain European consulates and notarial registries</li>
                <li>Italian Comuni and civil status offices for citizenship purposes</li>
                <li>Courts and tribunals in some jurisdictions</li>
                <li>Banking and financial institutions with specific wet-ink policies</li>
                <li>Real property registries in certain countries</li>
              </ul>
              <p className="text-[#B0B0B0] leading-relaxed text-sm">
                This list is not exhaustive. Requirements change and vary by receiving authority. Always confirm directly with the receiving authority before execution begins.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">RON vs. Mobile Notary for International Documents</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-[#111111] border border-[#2A2A2A] rounded-xl">
                  <h3 className="font-medium text-white mb-2">RON Advantages</h3>
                  <ul className="text-[#B0B0B0] text-sm space-y-1 list-disc list-inside">
                    <li>Signer can be anywhere in the world</li>
                    <li>No travel required</li>
                    <li>Session recorded and tamper-evident</li>
                    <li>Fast scheduling</li>
                  </ul>
                </div>
                <div className="p-5 bg-[#111111] border border-[#2A2A2A] rounded-xl">
                  <h3 className="font-medium text-white mb-2">When Mobile / Wet Ink May Be Needed</h3>
                  <ul className="text-[#B0B0B0] text-sm space-y-1 list-disc list-inside">
                    <li>Receiving authority requires wet ink</li>
                    <li>Some consulate requirements</li>
                    <li>Signer needs physical witness</li>
                    <li>Specific paper/ink requirements</li>
                  </ul>
                </div>
              </div>
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
