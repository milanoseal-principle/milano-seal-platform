import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { buildMetadata } from "@/lib/seo";
import { DESTINATIONS } from "@/data/destinations";
import { DOCUMENTS, USE_CASES } from "@/data/documents";

type Props = {
  params: Promise<{ country: string; document: string; "use-case": string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  return buildMetadata(p.country, p.document, p["use-case"]);
}

export async function generateStaticParams() {
  const combos: { country: string; document: string; "use-case": string }[] =
    [];
  // Top 10 countries × 8 docs × 10 use cases = 800 pages
  DESTINATIONS.slice(0, 10).forEach((d) =>
    DOCUMENTS.slice(0, 8).forEach((doc) =>
      USE_CASES.forEach((uc) =>
        combos.push({ country: d.slug, document: doc.id, "use-case": uc.id })
      )
    )
  );
  return combos;
}

export default async function UseCasePage({ params }: Props) {
  const p = await params;
  const country = DESTINATIONS.find((d) => d.slug === p.country);
  const document = DOCUMENTS.find((d) => d.id === p.document);
  const useCase = USE_CASES.find((u) => u.id === p["use-case"]);
  if (!country || !document || !useCase) return notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${document.label} Apostille for ${country.name} — ${useCase.label}`,
    provider: {
      "@type": "ProfessionalService",
      name: "The Milano Seal™",
      url: "https://themilanoseal.com",
    },
    serviceType: "Notarization and Apostille",
    areaServed: country.name,
    description: `${
      document.label
    } execution and apostille coordination for ${useCase.label.toLowerCase()} in ${
      country.name
    }. Florida Notary #668288.`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Header />
      <main className="bg-[#0A0A0A] min-h-screen">
        <section className="max-w-4xl mx-auto px-6 pt-32 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{country.flag}</span>
            <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-semibold">
              {useCase.label}
            </p>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-light leading-tight mb-6">
            {document.label} Apostille
            <br />
            for {country.name}
          </h1>
          <p className="text-[#8A8A8A] text-lg font-light leading-relaxed max-w-2xl mb-8">
            Structured U.S. document execution and apostille coordination for{" "}
            {document.label.toLowerCase()} documents used in{" "}
            {useCase.label.toLowerCase()} scenarios in {country.name}. Executed
            personally by Nicholas Milano, Florida Notary Public #668288.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/intake?country=${p.country}&document=${p.document}`}
              className="px-8 py-3.5 bg-[#C6A55A] text-[#0A0A0A] text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#D4BB7A] transition-colors"
            >
              Begin This Matter
            </Link>
            <Link
              href={`/apostille/${p.country}/${p.document}`}
              className="px-8 py-3.5 border border-[#2A2A2A] text-[#C6A55A] text-xs font-semibold tracking-[0.15em] uppercase hover:border-[#C6A55A] transition-colors"
            >
              {document.label} for {country.name}
            </Link>
          </div>
        </section>

        {/* Use case context */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white font-light mb-4">
            Why {useCase.label} Requires Apostille
          </h2>
          <p className="text-[#8A8A8A] text-base font-light leading-relaxed">
            Documents intended for {useCase.label.toLowerCase()} in{" "}
            {country.name} must be authenticated for foreign recognition.
            {country.hague
              ? ` ${country.name} is a member of the Hague Apostille Convention. U.S.-executed documents require apostille certification through the Florida Department of State before they are accepted.`
              : ` ${country.name} is not a Hague Convention member. Documents require the full consular legalization chain — authentication by the Florida Secretary of State, the U.S. State Department, and the ${country.name} consulate.`}
          </p>
        </section>

        {/* Other use cases for same country/doc */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-xl text-white font-light mb-4">
            Other {document.label} Use Cases for {country.name}
          </h2>
          <div className="space-y-2">
            {USE_CASES.filter((u) => u.id !== p["use-case"]).map((u) => (
              <Link
                key={u.id}
                href={`/apostille/${p.country}/${p.document}/${u.id}`}
                className="flex items-center justify-between px-4 py-3 bg-[#111111] border border-[#1A1A1A] rounded-lg hover:border-[#C6A55A]/20 transition-colors group"
              >
                <span className="text-sm text-[#B0B0B0] group-hover:text-white transition-colors">
                  {document.label} for {u.label} in {country.name}
                </span>
                <span className="text-[#C6A55A] text-xs">→</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
