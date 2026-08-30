import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { CountryDocumentAuthorityPage } from "@/components/seo/CountryDocumentAuthorityPage";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  COUNTRY_DOCUMENT_SEO_RECORDS,
  getCountryDocumentPath,
  getCountryDocumentSeoRecord,
} from "@/lib/seo/country-document/registry";
import { breadcrumbSchema, serviceSchema } from "@/lib/seo/schema";
import { resolveIndexation } from "@/lib/topical-authority/programmatic/pageEligibility";

type Props = { params: Promise<{ country: string; document: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return COUNTRY_DOCUMENT_SEO_RECORDS.map(({ countrySlug: country, documentSlug: document }) => ({
    country,
    document,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, document } = await params;
  const record = getCountryDocumentSeoRecord(country, document);
  if (!record) return {};

  const canonical = getCountryDocumentPath(record);
  const eligibility = resolveIndexation(record.page);

  return {
    title: record.content.title,
    description: record.content.description,
    alternates: { canonical },
    robots:
      eligibility.state === "approved_indexable"
        ? { index: true, follow: true }
        : { index: false, follow: true },
    openGraph: {
      title: record.content.title,
      description: record.content.description,
      url: canonical,
      type: "website",
      siteName: "The Milano Seal™",
    },
  };
}

export default async function CountryDocumentPage({ params }: Props) {
  const { country, document } = await params;
  const record = getCountryDocumentSeoRecord(country, document);
  if (!record) notFound();

  const path = getCountryDocumentPath(record);
  const schemas = [
    serviceSchema(record.content.h1, record.content.description, path),
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: record.destination.name, url: `/apostille/${record.countrySlug}` },
      { name: record.document.name, url: path },
    ]),
  ];

  return (
    <>
      <Header />
      <main
        className="min-h-screen bg-[#060606] pb-[calc(2rem+env(safe-area-inset-bottom))]"
        style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}
      >
        {schemas.map((schema, index) => (
          <JsonLd data={schema} key={index} />
        ))}
        <CountryDocumentAuthorityPage record={record} />
      </main>
      <Footer />
    </>
  );
}
