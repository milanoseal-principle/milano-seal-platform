import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, FileCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, faqSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Power of Attorney for Use Abroad | The Milano Seal™",
  description:
    "International power of attorney execution requires careful attention to notary requirements, RON vs. wet ink considerations, apostille routing, and translation. Learn the execution path.",
  alternates: { canonical: "https://www.themilanoseal.com/guides/power-of-attorney-for-use-abroad" },
  robots: { index: true, follow: true },
};

const faqs = [
  {
    question: "Does a power of attorney for use abroad need to be notarized?",
    answer:
      "Yes. A power of attorney intended for international use typically requires notarization before it can receive an apostille. The notarization must meet the requirements of the origin jurisdiction and, in some cases, the specific requirements of the receiving authority in the destination country.",
  },
  {
    question: "Can I use RON for an international power of attorney?",
    answer:
      "Florida RON-notarized powers of attorney are eligible for Florida apostille. However, certain foreign receiving authorities — particularly some European registries, consulates, and courts — may require wet ink notarization. This must be confirmed with the receiving authority before execution begins.",
  },
  {
    question: "Does the power of attorney need to be translated?",
    answer:
      "Many foreign receiving authorities require a certified translation of the power of attorney into the local language. Translation requirements depend on the destination country and the specific receiving authority. Translation is separate from notarization and apostille.",
  },
  {
    question: "What if the receiving authority has specific content requirements?",
    answer:
      "Some foreign authorities — particularly for real property transactions, corporate matters, or immigration proceedings — require specific language, scope limitations, or format in the power of attorney. These requirements must be addressed in the document draft before execution. A licensed attorney should review the document for legal compliance.",
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
          { name: "Power of Attorney for Use Abroad", url: "/guides/power-of-attorney-for-use-abroad" },
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
              Power of Attorney for Use Abroad
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed">
              An international power of attorney requires careful execution to be accepted by the receiving authority in the destination country. Notarization, apostille routing, RON vs. wet ink considerations, and translation all affect whether the document will be honored.
            </p>
          </div>
        </section>
        <section className="pb-16 px-6">
          <div className="max-w-3xl mx-auto space-y-10">

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Why International POA Needs Careful Execution</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                A power of attorney executed in the United States and intended for use in another country must satisfy the legal requirements of both jurisdictions. The U.S. side requires proper notarization and apostille. The foreign side may have additional requirements regarding document language, scope of authority, form, and witness or attestation requirements.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                Failure to satisfy the receiving authority's requirements can result in rejection — even if the apostille is valid. This is why operator review before execution begins is critical for international POA matters.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Notary Requirements</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                The notary must be commissioned in a U.S. state that recognizes the type of notarization being performed. For Florida matters, the notary must hold a current Florida commission. The notarial certificate must include the required attestation language, the notary's signature, and the notary's official seal.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                Some receiving authorities require specific notarial certificate language — for example, that the notary confirmed the signer's identity and free and voluntary execution. Document preparation should account for these requirements.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">RON vs. Wet Ink Considerations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-[#111111] border border-[#2A2A2A] rounded-xl">
                  <h3 className="font-medium text-white mb-2">RON (Remote Online Notarization)</h3>
                  <p className="text-[#B0B0B0] text-sm">Florida RON-notarized POAs are valid and apostillable in Florida. Best for international signers who cannot travel to the US. Must confirm receiving authority acceptance.</p>
                </div>
                <div className="p-5 bg-[#111111] border border-[#2A2A2A] rounded-xl">
                  <h3 className="font-medium text-white mb-2">Wet Ink Notarization</h3>
                  <p className="text-[#B0B0B0] text-sm">Required by some European registries, Italian consulates, and certain courts. May require physical presence with a mobile notary. Adds logistical steps but ensures maximum receiving authority acceptance.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Apostille or Legalization Path</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                For powers of attorney destined for Hague member countries (Italy, Spain, Portugal, France, Germany, Brazil, Mexico, and most others), the apostille path applies. The Florida Department of State issues the apostille after verifying the notary's commission.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                For non-Hague countries (China, Saudi Arabia, and others), consular legalization is required — a multi-step process involving U.S. State Department authentication and destination embassy or consulate legalization.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Translation May Be Required</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Many foreign receiving authorities require a certified translation of the power of attorney into the local language. The translation is typically submitted alongside the original apostilled document. Requirements vary by country and receiving authority.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Receiving Authority Review</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Even with a valid apostille and translation, the receiving authority makes the final determination on acceptance. For high-stakes transactions — real property closings, corporate actions, estate matters — direct confirmation with the receiving authority before execution is recommended.
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
