import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Affidavit of One and the Same Person | The Milano Seal™",
  description:
    "International affidavit guidance for records that identify the same person under different names, spellings, maiden names, or historical variants.",
  alternates: { canonical: "https://themilanoseal.com/affidavit-one-and-the-same" },
};

const faqs = [
  {
    q: "What is an Affidavit of One and the Same Person?",
    a: "It is a sworn statement identifying multiple records or name variants as referring to the same individual. It is commonly used when historical, civil, immigration, citizenship, or family records do not use one identical name form.",
  },
  {
    q: "Is this different from a name-discrepancy affidavit?",
    a: "Yes. A name-discrepancy affidavit usually focuses on a specific spelling or formatting inconsistency. A one-and-the-same affidavit can address a broader chain of records, including maiden names, anglicized names, aliases used in historical records, or multiple variants across generations.",
  },
  {
    q: "Will the affidavit need notarization or an apostille?",
    a: "That depends on the document, issuing jurisdiction, destination country, receiving authority, and how the affidavit will be used. The Milano Seal reviews the matter before confirming the execution and authentication path.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Affidavit of One and the Same Person",
  provider: { "@type": "ProfessionalService", name: "The Milano Seal™", url: "https://themilanoseal.com" },
  description:
    "Structured U.S. execution support for affidavits identifying multiple records or name variants as one person for international use.",
};

export default function OneAndTheSameAffidavitPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              schema,
              {
                "@type": "FAQPage",
                mainEntity: faqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              },
            ],
          }),
        }}
      />
      <Header />
      <main className="min-h-screen bg-[#0A0A0A]">
        <section className="mx-auto max-w-4xl px-6 pb-16 pt-32">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C6A55A]">International Affidavit Library</p>
          <h1 className="mb-6 font-serif text-4xl leading-tight text-white md:text-5xl">Affidavit of One and the Same Person</h1>
          <p className="max-w-2xl text-lg font-light leading-relaxed text-[#8A8A8A]">
            A structured sworn statement used to establish that different records, names, or historical variants refer to the same individual. Common in citizenship, immigration, civil-registry, estate, and cross-border matters.
          </p>
          <Link href="/intake" className="mt-8 inline-block rounded-sm bg-[#C6A55A] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#0A0A0A] transition-colors hover:bg-[#D4BB7A]">Begin Secure Intake</Link>
        </section>

        <section className="mx-auto max-w-4xl border-t border-[#1A1A1A] px-6 py-12">
          <h2 className="mb-5 font-serif text-2xl text-white">Common Uses</h2>
          <ul className="space-y-3 text-sm font-light leading-relaxed text-[#8A8A8A]">
            <li>Citizenship filings involving ancestors with multiple name forms.</li>
            <li>Immigration matters involving maiden, married, shortened, or anglicized names.</li>
            <li>Civil-registry corrections or supporting explanations for inconsistent records.</li>
            <li>Estate, probate, or family-history matters involving legacy documents.</li>
          </ul>
        </section>

        <section className="mx-auto max-w-4xl border-t border-[#1A1A1A] px-6 py-12">
          <h2 className="mb-6 font-serif text-2xl text-white">Execution Path</h2>
          <div className="space-y-4">
            {[
              ["01", "Matter Review", "Identify every record and name variant that must be reconciled."],
              ["02", "Affidavit Preparation", "Prepare the sworn statement and supporting record references for the intended use."],
              ["03", "Execution", "Complete the required notarial act using the execution method that applies to the matter."],
              ["04", "Authentication Review", "Determine whether apostille, authentication, translation, or another receiving-authority step is required."],
              ["05", "Release", "Coordinate return, courier, or international delivery after quality review."],
            ].map(([step, title, description]) => (
              <div key={step} className="flex gap-6 rounded-xl border border-[#1A1A1A] bg-[#111111] p-5">
                <span className="flex-shrink-0 font-serif text-2xl font-light text-[#C6A55A]">{step}</span>
                <div><p className="mb-1 text-sm font-medium text-white">{title}</p><p className="text-sm font-light text-[#8A8A8A]">{description}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl border-t border-[#1A1A1A] px-6 py-12">
          <h2 className="mb-6 font-serif text-2xl text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-xl border border-[#1A1A1A] bg-[#111111] p-5">
                <p className="mb-2 text-sm font-medium text-white">{f.q}</p>
                <p className="text-sm font-light leading-relaxed text-[#8A8A8A]">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl border-t border-[#1A1A1A] px-6 py-12">
          <h2 className="mb-4 font-serif text-xl text-white">Related Authority Pages</h2>
          <div className="space-y-3">
            {[
              ["/affidavit-name-discrepancy", "Affidavit of Name Discrepancy"],
              ["/international-affidavit", "International Affidavit"],
              ["/power-of-attorney-international", "International Power of Attorney"],
              ["/map", "Global Document Intelligence"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="group flex items-center justify-between rounded-lg border border-[#1A1A1A] bg-[#111111] px-5 py-3.5 transition-colors hover:border-[#C6A55A]/30">
                <span className="text-sm text-[#B0B0B0] transition-colors group-hover:text-white">{label}</span><span className="text-xs text-[#C6A55A]">→</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
