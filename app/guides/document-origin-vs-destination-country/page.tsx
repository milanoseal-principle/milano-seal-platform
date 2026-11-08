import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, FileCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, faqSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Document Origin vs. Destination Country | The Milano Seal™",
  description:
    "Where a document was issued or notarized determines the apostille authority. Where it is going determines the authentication path and translation needs. Both matter — and they are often different.",
  alternates: { canonical: "https://www.themilanoseal.com/guides/document-origin-vs-destination-country" },
  robots: { index: true, follow: true },
};

const faqs = [
  {
    question: "What does document origin mean?",
    answer:
      "Document origin refers to the jurisdiction where the document was issued or notarized. This determines which competent authority can issue an apostille. A document notarized in Florida must receive its apostille from the Florida Department of State — not another state or federal agency.",
  },
  {
    question: "What does destination country mean for apostille purposes?",
    answer:
      "The destination country is where the document will be presented and used. It determines the authentication path — apostille (for Hague member countries) or consular legalization (for non-Hague countries) — and the receiving authority's specific requirements, including translation needs.",
  },
  {
    question: "Can document origin and destination country be different?",
    answer:
      "Yes. A document may originate in Florida but be used in Italy, Mexico, or the UAE. The origin determines who issues the apostille; the destination determines whether an apostille suffices or additional steps are needed.",
  },
  {
    question: "What if the signer is abroad when signing?",
    answer:
      "The signer's location is separate from the document's origin jurisdiction. For RON, a Florida-commissioned notary can serve a signer anywhere in the world. The resulting document is a Florida-origin document eligible for Florida apostille — regardless of where the signer was physically located.",
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
          { name: "Document Origin vs. Destination Country", url: "/guides/document-origin-vs-destination-country" },
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
              Document Origin vs. Destination Country: Why Both Matter
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed">
              Two distinct factors determine how an international document execution must be structured: where the document was issued or notarized, and where it will be used. These are often different — and both affect the process.
            </p>
          </div>
        </section>
        <section className="pb-16 px-6">
          <div className="max-w-3xl mx-auto space-y-10">

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">What Document Origin Means</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Document origin is the jurisdiction where the document was created, notarized, or officially issued. For a notarized document, origin is determined by the jurisdiction of the notary's commission — not the signer's location or the document's subject matter.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                Origin determines which competent authority can issue an apostille. A Florida-notarized document must receive its apostille from the Florida Department of State. A Texas-notarized document requires a Texas Secretary of State apostille. An FBI background check is apostilled by the U.S. Department of State.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">What Destination Country Means</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                The destination country is where the document will be presented to a receiving authority — a court, consulate, registry office, bank, notary, or other official body. Destination country determines:
              </p>
              <ul className="space-y-2 text-[#B0B0B0] list-disc list-inside">
                <li>Whether an apostille suffices (Hague member) or consular legalization is needed (non-Hague)</li>
                <li>Translation requirements</li>
                <li>Receiving authority-specific format or content requirements</li>
                <li>Whether additional authentication steps are required beyond the apostille</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Signer Location Is Separate</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Many clients confuse signer location with document origin. They are separate. Via Remote Online Notarization (RON), a signer in Italy can execute a document before a Florida-commissioned notary — producing a Florida-origin document eligible for Florida apostille.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                This is often the most practical solution for international clients who need U.S.-notarized and apostilled documents but are not in the United States.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Receiving Authority Requirements</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                The destination country's legal framework sets the baseline, but the specific receiving authority within that country may impose additional requirements. A receiving authority's requirements can be more restrictive than the country's general apostille rules.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Examples</h2>
              <div className="space-y-3">
                <div className="p-5 bg-[#111111] border border-[#2A2A2A] rounded-xl">
                  <h3 className="font-medium text-white mb-2">Florida Document → Italy</h3>
                  <p className="text-[#B0B0B0] text-sm leading-relaxed">A power of attorney notarized in Florida, destined for use in Italy. Origin: Florida (apostille from Florida Department of State). Italy is a Hague member — apostille path applies. Italian receiving authority may also require certified translation into Italian.</p>
                </div>
                <div className="p-5 bg-[#111111] border border-[#2A2A2A] rounded-xl">
                  <h3 className="font-medium text-white mb-2">Florida Document → China</h3>
                  <p className="text-[#B0B0B0] text-sm leading-relaxed">A corporate resolution notarized in Florida, destined for use in China. Origin: Florida (state authentication). China is not a Hague member — consular legalization path applies. Additional steps: U.S. Department of State authentication + Chinese consulate legalization.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">When Operator Review Is Needed</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Multi-jurisdiction matters — where the document originates in one state, is signed by a party in another country, and will be used in a third country — require careful routing review before execution begins. Operator review helps confirm the correct execution path and avoid rejection by the receiving authority.
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
