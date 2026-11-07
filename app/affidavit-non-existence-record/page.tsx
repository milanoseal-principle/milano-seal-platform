import type { Metadata } from "next";
import Link from "next/link";
import { CommercialCtaRow } from "@/components/conversion/CommercialCtaRow";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Affidavit of Non-Existence of Record | The Milano Seal™",
  description:
    "International guidance for sworn statements documenting that a required civil, archival, parish, or government record could not be located after documented search efforts.",
  alternates: { canonical: "https://themilanoseal.com/affidavit-non-existence-record" },
};

const faqs = [
  {
    q: "What is an Affidavit of Non-Existence of Record?",
    a: "It is a sworn statement describing the efforts made to locate a required record and stating that the record could not be found or is not available. The receiving authority decides whether that affidavit is acceptable for the matter.",
  },
  {
    q: "What records can this apply to?",
    a: "Common examples include birth, marriage, death, parish, municipal, archival, citizenship, or historical records that cannot be located after a documented search.",
  },
  {
    q: "Does it automatically replace the missing record?",
    a: "No. An affidavit does not automatically substitute for an official record. The destination country, agency, court, municipality, consulate, or other receiving authority determines what evidence it will accept.",
  },
  {
    q: "Will notarization or apostille be required?",
    a: "The execution and authentication path depends on the affidavit, issuing jurisdiction, destination, and receiving authority. The Milano Seal confirms the required route before execution whenever the matter can be determined from verified instructions or authority data.",
  },
];

export default function NonExistenceRecordAffidavitPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Service", name: "Affidavit of Non-Existence of Record", provider: { "@type": "ProfessionalService", name: "The Milano Seal™", url: "https://themilanoseal.com" }, description: "International document execution support for sworn statements documenting an unavailable record." },
          { "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
        ],
      }) }} />
      <Header />
      <main className="min-h-screen bg-[#0A0A0A]">
        <section className="mx-auto max-w-4xl px-6 pb-16 pt-32">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C6A55A]">International Affidavit Library</p>
          <h1 className="mb-6 font-serif text-4xl leading-tight text-white md:text-5xl">Affidavit of Non-Existence of Record</h1>
          <p className="max-w-2xl text-lg font-light leading-relaxed text-[#8A8A8A]">
            When an expected civil, archival, parish, or government record cannot be located, a receiving authority may request a sworn explanation of the search performed and the record’s unavailability.
          </p>
          <Link href="/intake" className="mt-8 inline-block rounded-sm bg-[#C6A55A] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#0A0A0A] transition-colors hover:bg-[#D4BB7A]">Begin Secure Intake</Link>
                  <CommercialCtaRow context={{ serviceIntent: "international_execution", source: "affidavit-non-existence-record" }} actions={["get_pricing", "speak"]} className="mt-6" />
        </section>

        <section className="mx-auto max-w-4xl border-t border-[#1A1A1A] px-6 py-12">
          <h2 className="mb-5 font-serif text-2xl text-white">What the Affidavit Should Document</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              "The record being sought and the person or event it relates to.",
              "The archives, municipality, parish, agency, or database searched.",
              "The dates or periods of the search where relevant.",
              "Any official negative search result, letter, certificate, or supporting evidence available.",
              "The intended foreign or institutional use of the affidavit.",
              "Any instructions supplied by the receiving authority or attorney.",
            ].map((item) => <div key={item} className="rounded-xl border border-[#1A1A1A] bg-[#111111] p-5 text-sm font-light leading-relaxed text-[#8A8A8A]">{item}</div>)}
          </div>
        </section>

        <section className="mx-auto max-w-4xl border-t border-[#1A1A1A] px-6 py-12">
          <h2 className="mb-6 font-serif text-2xl text-white">Controlled Execution Process</h2>
          <div className="space-y-4">
            {[
              ["01", "Search Evidence Review", "Review the available search evidence, negative certifications, and receiving-authority instructions."],
              ["02", "Affidavit Preparation", "Prepare a factual statement describing the search and the unavailable record without adding unsupported conclusions."],
              ["03", "Notarial Execution", "Complete the notarial act required for the final affidavit."],
              ["04", "Authentication Review", "Confirm whether apostille, federal authentication, consular legalization, translation, or another step is actually required."],
              ["05", "Release & Delivery", "Complete quality review and coordinate return or international delivery."],
            ].map(([step, title, description]) => (
              <div key={step} className="flex gap-6 rounded-xl border border-[#1A1A1A] bg-[#111111] p-5"><span className="flex-shrink-0 font-serif text-2xl text-[#C6A55A]">{step}</span><div><p className="mb-1 text-sm font-medium text-white">{title}</p><p className="text-sm font-light text-[#8A8A8A]">{description}</p></div></div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl border-t border-[#1A1A1A] px-6 py-12">
          <h2 className="mb-6 font-serif text-2xl text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">{faqs.map((f) => <div key={f.q} className="rounded-xl border border-[#1A1A1A] bg-[#111111] p-5"><p className="mb-2 text-sm font-medium text-white">{f.q}</p><p className="text-sm font-light leading-relaxed text-[#8A8A8A]">{f.a}</p></div>)}</div>
        </section>

        <section className="mx-auto max-w-4xl border-t border-[#1A1A1A] px-6 py-12">
          <h2 className="mb-4 font-serif text-xl text-white">Related Authority Pages</h2>
          <div className="space-y-3">
            {[
              ["/international-affidavit", "International Affidavit"],
              ["/affidavit-one-and-the-same", "Affidavit of One and the Same Person"],
              ["/affidavit-name-discrepancy", "Affidavit of Name Discrepancy"],
              ["/map", "Global Document Intelligence"],
            ].map(([href, label]) => <Link key={href} href={href} className="group flex items-center justify-between rounded-lg border border-[#1A1A1A] bg-[#111111] px-5 py-3.5 transition-colors hover:border-[#C6A55A]/30"><span className="text-sm text-[#B0B0B0] group-hover:text-white">{label}</span><span className="text-xs text-[#C6A55A]">→</span></Link>)}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
