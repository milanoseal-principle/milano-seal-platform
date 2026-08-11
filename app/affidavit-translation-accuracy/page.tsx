import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Affidavit of Translation Accuracy | The Milano Seal™",
  description:
    "International guidance for sworn translator statements confirming that a translation accurately reflects the source document.",
  alternates: { canonical: "https://themilanoseal.com/affidavit-translation-accuracy" },
};

const faqs = [
  {
    q: "What is an Affidavit of Translation Accuracy?",
    a: "It is a sworn statement by a translator confirming that a translation is complete and accurate to the best of the translator’s knowledge and ability.",
  },
  {
    q: "Who signs the affidavit?",
    a: "The translator or other person making the accuracy statement signs the affidavit. The receiving authority determines whether that person must have specific credentials or certification.",
  },
  {
    q: "Does every foreign filing require this affidavit?",
    a: "No. Translation and certification requirements vary by document, destination, receiving authority, and filing type. The Milano Seal does not add translation or affidavit requirements unless supported by the matter instructions or verified authority data.",
  },
  {
    q: "Can the affidavit require an apostille?",
    a: "It can, but not automatically. If the affidavit is notarized and the receiving authority requires authentication of the U.S. notarial act, the correct apostille or authentication path is determined from the actual jurisdiction and destination requirements.",
  },
];

export default function TranslationAccuracyAffidavitPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Service", name: "Affidavit of Translation Accuracy", provider: { "@type": "ProfessionalService", name: "The Milano Seal™", url: "https://themilanoseal.com" }, description: "Execution and authentication coordination for sworn translation-accuracy affidavits used internationally." },
          { "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
        ],
      }) }} />
      <Header />
      <main className="min-h-screen bg-[#0A0A0A]">
        <section className="mx-auto max-w-4xl px-6 pb-16 pt-32">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C6A55A]">International Affidavit Library</p>
          <h1 className="mb-6 font-serif text-4xl leading-tight text-white md:text-5xl">Affidavit of Translation Accuracy</h1>
          <p className="max-w-2xl text-lg font-light leading-relaxed text-[#8A8A8A]">
            A sworn translator statement used when a receiving authority asks for a formal declaration that the translated document accurately reflects the original.
          </p>
          <Link href="/intake" className="mt-8 inline-block rounded-sm bg-[#C6A55A] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#0A0A0A] transition-colors hover:bg-[#D4BB7A]">Begin Secure Intake</Link>
        </section>

        <section className="mx-auto max-w-4xl border-t border-[#1A1A1A] px-6 py-12">
          <h2 className="mb-5 font-serif text-2xl text-white">Common Uses</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Translations accompanying birth, marriage, death, or other civil records.",
              "Immigration, visa, residency, or citizenship submissions requiring certified translation evidence.",
              "Legal or corporate filings where the recipient requests a sworn accuracy statement.",
              "Professional, academic, licensing, or credential documents used abroad.",
            ].map((item) => <div key={item} className="rounded-xl border border-[#1A1A1A] bg-[#111111] p-5 text-sm font-light leading-relaxed text-[#8A8A8A]">{item}</div>)}
          </div>
        </section>

        <section className="mx-auto max-w-4xl border-t border-[#1A1A1A] px-6 py-12">
          <h2 className="mb-6 font-serif text-2xl text-white">Execution Process</h2>
          <div className="space-y-4">
            {[
              ["01", "Document & Destination Review", "Confirm the source document, destination, and receiving-authority instructions."],
              ["02", "Translation Packet Review", "Confirm the final translation and the identity of the person making the accuracy statement."],
              ["03", "Affidavit Execution", "Execute the affidavit using the required notarial act."],
              ["04", "Authentication Review", "Determine whether the notarized affidavit itself requires apostille, authentication, or no additional authentication."],
              ["05", "Release", "Complete quality review and coordinate final packet delivery."],
            ].map(([step, title, description]) => <div key={step} className="flex gap-6 rounded-xl border border-[#1A1A1A] bg-[#111111] p-5"><span className="flex-shrink-0 font-serif text-2xl text-[#C6A55A]">{step}</span><div><p className="mb-1 text-sm font-medium text-white">{title}</p><p className="text-sm font-light text-[#8A8A8A]">{description}</p></div></div>)}
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
              ["/affidavit-name-discrepancy", "Affidavit of Name Discrepancy"],
              ["/affidavit-one-and-the-same", "Affidavit of One and the Same Person"],
              ["/map", "Global Document Intelligence"],
            ].map(([href, label]) => <Link key={href} href={href} className="group flex items-center justify-between rounded-lg border border-[#1A1A1A] bg-[#111111] px-5 py-3.5 transition-colors hover:border-[#C6A55A]/30"><span className="text-sm text-[#B0B0B0] group-hover:text-white">{label}</span><span className="text-xs text-[#C6A55A]">→</span></Link>)}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
