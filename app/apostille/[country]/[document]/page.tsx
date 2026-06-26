import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { getCountryBySlug, COUNTRY_REGISTRY } from "@/lib/compliance/countries";
import { getDocumentBySlug, DOCUMENT_TAXONOMY } from "@/lib/compliance/documents";
import { evaluateExecutionRoute } from "@/lib/compliance/routing";
import { CLIENT_COPY } from "@/lib/compliance/clientCopy";

type Props = { params: Promise<{ country: string; document: string }> };

export async function generateStaticParams() {
  const params: { country: string; document: string }[] = [];
  for (const country of COUNTRY_REGISTRY) {
    for (const doc of DOCUMENT_TAXONOMY) {
      if (doc.commonlyApostilled) {
        params.push({ country: country.slug, document: doc.slug });
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: countrySlug, document: docSlug } = await params;
  const country = getCountryBySlug(countrySlug);
  const doc = getDocumentBySlug(docSlug);
  if (!country || !doc) return {};
  return {
    title: `${doc.name} Apostille for ${country.name} | The Milano Seal™`,
    description: `Florida apostille preparation for ${doc.name} destined for ${country.name}. Notarization, state apostille routing, and international courier custody.`,
    robots: { index: true, follow: true },
  };
}

export default async function ApostilleCountryDocumentPage({ params }: Props) {
  const { country: countrySlug, document: docSlug } = await params;
  const country = getCountryBySlug(countrySlug);
  const doc = getDocumentBySlug(docSlug);
  if (!country || !doc) notFound();

  const result = evaluateExecutionRoute(countrySlug, docSlug);

  return (
    <>
      <Header />
      <main className="bg-[#060606] min-h-screen pb-16" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-medium mb-4">
            {country.name} · {doc.category.replace("-", " ")}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-white mb-6">
            {doc.name} Apostille for <em className="text-[#C6A55A]">{country.name}</em>
          </h1>

          {result.found && result.summary && (
            <div className="mb-8 p-5 border border-[#C6A55A]/20 bg-[#0D0D0D]">
              <p className="text-[#D0D0D0] text-sm leading-relaxed">{result.summary}</p>
              {result.route && (
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-[#8A8A8A] text-xs tracking-widest uppercase">Estimated Timeline</span>
                  <span className="text-[#C6A55A] text-sm font-medium">
                    {result.route.estimatedDays.min}–{result.route.estimatedDays.max} business days
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 p-4 border border-white/5 bg-[#0A0A0A]">
            <p className="text-[#5A5A5A] text-xs leading-relaxed">{CLIENT_COPY.disclaimer}</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
