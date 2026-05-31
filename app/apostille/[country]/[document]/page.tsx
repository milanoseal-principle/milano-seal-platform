import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  getAllCountries,
  getAllDocumentTypes,
  getCountry,
  getDocumentType,
  getWorkflowOrDerive,
} from "@/data/intelligence";

// ISO-2 → flag emoji
function isoToFlag(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

type Props = { params: Promise<{ country: string; document: string }> };

export const dynamicParams = true;

export async function generateStaticParams() {
  const countries = getAllCountries();
  const documents = getAllDocumentTypes();
  const pairs: { country: string; document: string }[] = [];
  for (const c of countries) {
    for (const d of documents) {
      pairs.push({ country: c.id, document: d.id });
    }
  }
  return pairs;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: countrySlug, document: documentId } = await params;

  const country = getCountry(countrySlug);
  const document = getDocumentType(documentId);

  if (!country || !document) {
    return { title: "Not Found" };
  }

  const isHague = country.corridorType === "hague";

  return {
    title: `${document.name} Apostille for ${country.name} | The Milano Seal™`,
    description: `Professional apostille and authentication services for ${document.name.toLowerCase()} documents destined for ${country.name}. ${isHague ? "Hague Convention compliant" : "Consular legalization"} execution by Florida Notary Public #668288.`,
    keywords: [
      `${document.name.toLowerCase()} apostille ${country.name}`,
      `apostille ${document.name.toLowerCase()}`,
      `${country.name} ${document.name.toLowerCase()} authentication`,
      "apostille services Florida",
      "Hague Convention apostille",
    ],
    alternates: {
      canonical: `https://themilanoseal.com/apostille/${country.id}/${document.id}`,
    },
    openGraph: {
      title: `${document.name} Apostille for ${country.name} | The Milano Seal™`,
      description: `Structured U.S. document authentication for ${document.name.toLowerCase()} intended for use in ${country.name}.`,
    },
  };
}

export default async function CountryDocumentPage({ params }: Props) {
  const { country: countrySlug, document: documentId } = await params;

  const country = getCountry(countrySlug);
  const document = getDocumentType(documentId);

  if (!country || !document) return notFound();

  const workflow = getWorkflowOrDerive(country.id, document.id);
  const flag = isoToFlag(country.isoCode);
  const isHague = country.corridorType === "hague";

  // Related: same document, other countries (pick from document's commonDestinations or first 5 countries)
  const relatedCountryIds =
    document.commonDestinations?.filter((id) => id !== country.id).slice(0, 5) ??
    getAllCountries()
      .filter((c) => c.id !== country.id)
      .slice(0, 5)
      .map((c) => c.id);

  const relatedCountries = relatedCountryIds
    .map((id) => getCountry(id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  // Related: same country, other documents (pick from country's commonDocuments or first 5 doc types)
  const relatedDocIds =
    country.commonDocuments?.filter((id) => id !== document.id).slice(0, 5) ??
    getAllDocumentTypes()
      .filter((d) => d.id !== document.id)
      .slice(0, 5)
      .map((d) => d.id);

  const relatedDocuments = relatedDocIds
    .map((id) => getDocumentType(id))
    .filter((d): d is NonNullable<typeof d> => d !== undefined);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${document.name} Apostille for ${country.name}`,
    provider: {
      "@type": "ProfessionalService",
      name: "The Milano Seal™",
      url: "https://themilanoseal.com",
    },
    serviceType: "Notarization and Apostille",
    areaServed: country.name,
    description: `Structured U.S. document execution and apostille coordination for ${document.name.toLowerCase()} documents intended for use in ${country.name}.`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Header />
      <main className="bg-[#0A0A0A] min-h-screen">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-32 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{flag}</span>
            <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-semibold">
              {country.name} ·{" "}
              {isHague
                ? `Hague Convention Member${country.hagueSince ? ` (${country.hagueSince})` : ""}`
                : "Consular Authentication"}
            </p>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-light leading-tight mb-6">
            {document.name}
            <br />
            Apostille for {country.name}
          </h1>
          <p className="text-[#8A8A8A] text-lg font-light leading-relaxed max-w-2xl mb-8">
            {document.description
              ? `${document.description} `
              : ""}
            Structured execution and apostille coordination for {document.name.toLowerCase()} documents intended for use in {country.name}. All matters executed personally by Nicholas Milano, Florida Notary Public #668288.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/intake?country=${country.id}&document=${document.id}`}
              className="px-8 py-3.5 bg-[#C6A55A] text-[#0A0A0A] text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#D4BB7A] transition-colors"
            >
              Begin This Matter
            </Link>
            <Link
              href={`/apostille/${country.id}`}
              className="px-8 py-3.5 border border-[#2A2A2A] text-[#C6A55A] text-xs font-semibold tracking-[0.15em] uppercase hover:border-[#C6A55A] transition-colors"
            >
              All {country.name} Services
            </Link>
          </div>
        </section>

        {/* Workflow overview */}
        {workflow && (
          <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
            <h2 className="font-serif text-2xl text-white font-light mb-6">
              Workflow Overview
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-4">
                <p className="text-[10px] text-[#C6A55A] uppercase tracking-widest mb-1">Route</p>
                <p className="text-white text-sm font-medium">{workflow.routeType}</p>
              </div>
              <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-4">
                <p className="text-[10px] text-[#C6A55A] uppercase tracking-widest mb-1">Timeline</p>
                <p className="text-white text-sm font-medium">{workflow.estimatedTimeline}</p>
              </div>
              <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-4">
                <p className="text-[10px] text-[#C6A55A] uppercase tracking-widest mb-1">Translation</p>
                <p className="text-white text-sm font-medium">
                  {workflow.translationRequired
                    ? `${workflow.certifiedTranslationRequired ? "Certified " : ""}${workflow.translationLanguage ?? "Required"}`
                    : "Not required"}
                </p>
              </div>
              <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-4">
                <p className="text-[10px] text-[#C6A55A] uppercase tracking-widest mb-1">Notarization</p>
                <p className="text-white text-sm font-medium">
                  {workflow.notarizationRequired
                    ? workflow.notarizationType === "ron"
                      ? "RON"
                      : workflow.notarizationType === "mobile"
                      ? "Mobile"
                      : "Required"
                    : "Not required"}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Execution path */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white font-light mb-6">
            Execution Process
          </h2>
          <div className="space-y-3">
            {(workflow?.executionPath ?? []).map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-5 bg-[#111111] border border-[#1A1A1A] rounded-xl p-4"
              >
                <span className="text-[#C6A55A] font-serif text-lg font-light flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[#B0B0B0] text-sm font-light leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
            {(!workflow?.executionPath || workflow.executionPath.length === 0) && (
              <p className="text-[#8A8A8A] text-sm italic">
                Contact us to discuss the specific execution path for this matter.
              </p>
            )}
          </div>
        </section>

        {/* Rejection triggers */}
        {workflow && workflow.rejectionTriggers.length > 0 && (
          <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
            <h2 className="font-serif text-2xl text-white font-light mb-6">
              Common Rejection Triggers
            </h2>
            <div className="space-y-3">
              {workflow.rejectionTriggers.map((trigger, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 bg-[#111111] border border-[#1A1A1A] rounded-xl p-4"
                >
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider flex-shrink-0 mt-0.5 ${
                      trigger.severity === "fatal"
                        ? "text-red-400"
                        : "text-yellow-500"
                    }`}
                  >
                    {trigger.severity}
                  </span>
                  <div>
                    <p className="text-white text-sm font-medium mb-1">
                      {trigger.trigger}
                    </p>
                    <p className="text-[#8A8A8A] text-xs leading-relaxed">
                      {trigger.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related: same doc, other countries */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-xl text-white font-light mb-4">
            {document.name} — Other Destinations
          </h2>
          <div className="space-y-2">
            {relatedCountries.map((c) => (
              <Link
                key={c.id}
                href={`/apostille/${c.id}/${document.id}`}
                className="flex items-center justify-between px-4 py-3 bg-[#111111] border border-[#1A1A1A] rounded-lg hover:border-[#C6A55A]/20 transition-colors group"
              >
                <span className="flex items-center gap-3 text-sm text-[#B0B0B0] group-hover:text-white transition-colors">
                  <span>{isoToFlag(c.isoCode)}</span>
                  {document.name} for {c.name}
                </span>
                <span className="text-[#C6A55A] text-xs">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Related: same country, other docs */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-xl text-white font-light mb-4">
            Other Documents for {country.name}
          </h2>
          <div className="space-y-2">
            {relatedDocuments.map((d) => (
              <Link
                key={d.id}
                href={`/apostille/${country.id}/${d.id}`}
                className="flex items-center justify-between px-4 py-3 bg-[#111111] border border-[#1A1A1A] rounded-lg hover:border-[#C6A55A]/20 transition-colors group"
              >
                <span className="flex items-center gap-3 text-sm text-[#B0B0B0] group-hover:text-white transition-colors">
                  {d.name} for {country.name}
                </span>
                <span className="text-[#C6A55A] text-xs">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-t border-[#1A1A1A] text-center">
          <h2 className="font-serif text-3xl text-white font-light mb-4">
            Ready to Execute?
          </h2>
          <p className="text-[#8A8A8A] text-sm font-light mb-8 max-w-xl mx-auto">
            Submit your matter. Nicholas Milano reviews every{" "}
            {document.name.toLowerCase()} engagement personally before execution
            is scheduled.
          </p>
          <Link
            href={`/intake?country=${country.id}&document=${document.id}`}
            className="inline-block px-10 py-4 bg-[#C6A55A] text-[#0A0A0A] text-xs font-semibold tracking-[0.2em] uppercase hover:bg-[#D4BB7A] transition-colors"
          >
            Submit Your Matter
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
