import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, FileCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, faqSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Apostille for Vital Records | The Milano Seal™",
  description:
    "Birth certificates, marriage certificates, death certificates, and divorce decrees have specific state-level issuing authorities and apostille routing. Learn how vital records apostille works.",
  alternates: { canonical: "https://www.themilanoseal.com/guides/apostille-for-vital-records" },
  robots: { index: true, follow: true },
};

const faqs = [
  {
    question: "Do vital records need to be notarized before getting an apostille?",
    answer:
      "Typically no. Vital records issued by state vital records offices carry the certification of the issuing authority, which is sufficient for apostille. The apostille is issued directly on or with the certified copy. Notarization is not typically part of the vital records apostille path.",
  },
  {
    question: "Which state issues the apostille for a birth certificate?",
    answer:
      "The apostille must be issued by the competent authority in the state where the vital record was originally filed — not the state where the person currently lives. A birth certificate from Florida is apostilled by the Florida Department of State.",
  },
  {
    question: "Can I use a certified copy or does it need to be an original?",
    answer:
      "Most competent authorities require a certified copy issued by the state vital records office — not a photocopy or a hospital-issued record. The certified copy must carry the issuing authority's seal and signature. Contact the state vital records office for current certified copy requirements.",
  },
  {
    question: "What if the vital record is from a different state than where I live?",
    answer:
      "You must obtain the apostille from the state where the vital record was issued, regardless of your current residence. Each state's competent authority only apostilles documents originating in that state.",
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
          { name: "Apostille for Vital Records", url: "/guides/apostille-for-vital-records" },
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
              Apostille for Vital Records
            </h1>
            <p className="text-lg text-[#B0B0B0] leading-relaxed">
              Birth certificates, marriage certificates, death certificates, and divorce decrees are among the most commonly apostilled documents for international use. Each type has specific requirements regarding who issues the record, how certified copies are obtained, and how the apostille authority is determined.
            </p>
          </div>
        </section>
        <section className="pb-16 px-6">
          <div className="max-w-3xl mx-auto space-y-10">

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">What Vital Records Are</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Vital records are official government-issued documents that record significant life events: birth, marriage, death, and divorce. In the United States, vital records are maintained at the state level by each state's vital records office or bureau of vital statistics, and at the county level for certain record types.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Birth Certificates</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Birth certificates are issued by the vital records office of the state where the birth occurred. For apostille purposes, a certified copy must be obtained from that state's vital records office. The apostille is issued by the competent authority of that state.
              </p>
              <p className="text-[#B0B0B0] leading-relaxed">
                Hospital-issued birth records, informational copies, or commemorative certificates are not suitable for apostille. Only official certified copies bearing the state vital records office seal and signature qualify.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Marriage Certificates</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Marriage records are typically filed with the county clerk in the county where the marriage license was issued. Certified copies may be available from the county clerk or the state vital records office, depending on the state. The apostille authority is the state where the marriage was recorded.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Death Certificates</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Death certificates are issued by the state vital records office of the state where the death occurred. Certified copies bearing the official seal are required for apostille. The apostille is issued by the competent authority of that state.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Divorce Decrees</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Divorce records are court records, not vital records in the traditional sense. Certified copies of the final judgment of dissolution of marriage or divorce decree are issued by the court clerk in the county where the divorce was granted. The apostille is issued by the state's competent authority.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Certified Copies vs. Originals</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                For apostille purposes, a "certified copy" issued by the appropriate government office is the standard document type. An original vital record (if one even exists in usable form) is rarely required. The certified copy must carry the issuing authority's certification — typically a raised seal, embossed seal, or authorized signature.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">State Issuing Authority Matters</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Apostilles for vital records must come from the state where the record was created — not the state where the person currently lives or where the document will be used. If a person was born in New York but now lives in Florida, the apostille must be obtained from the New York Secretary of State, not the Florida Department of State.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Notarization Is Not Typically the Path for Vital Records</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Unlike privately prepared documents such as powers of attorney or affidavits, vital records are official government documents. They do not need notarization before apostille. The government-issued certification on the certified copy serves as the basis for the apostille.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-white">Apostille Authority Routing</h2>
              <p className="text-[#B0B0B0] leading-relaxed">
                Each state has its own designated competent authority for issuing apostilles — typically the Secretary of State or equivalent office. For Florida vital records, the Florida Department of State issues apostilles. For records from other states, the apostille must be obtained from that state's competent authority.
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
