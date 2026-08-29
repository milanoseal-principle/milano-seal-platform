import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { CountryDocumentAuthorityPage } from "@/components/seo/CountryDocumentAuthorityPage";
import { getCountryBySlug } from "@/lib/compliance/countries";
import { SEO_AUTHORITY_NODES } from "@/lib/seo/authority/registry";
import { getAuthorityLinks } from "@/lib/seo/authority/links";
import { COUNTRY_DOCUMENT_SEO_RECORDS, getCountryDocumentPath, getCountryDocumentSeoRecord } from "@/lib/seo/country-document/registry";
import { getEvidence } from "@/lib/seo/evidence/registry";
import { evaluateSeoIndexability } from "@/lib/seo/quality/indexability";
import { buildCountryDocumentSeoSchema } from "@/lib/seo/schema/seoSchema";

type Props = { params: Promise<{ country: string; document: string }> };
const BASE_URL = "https://www.themilanoseal.com";
export function generateStaticParams() { return COUNTRY_DOCUMENT_SEO_RECORDS.filter((record) => record.indexStatus === "INDEXABLE").map(({ countrySlug: country, documentSlug: document }) => ({ country, document })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, document } = await params; const record = getCountryDocumentSeoRecord(country, document); if (!record) return {};
  const canonical = `${BASE_URL}${getCountryDocumentPath(record)}`; const node = SEO_AUTHORITY_NODES.find((item) => item.path === getCountryDocumentPath(record));
  const evaluation = evaluateSeoIndexability(record, { canonical, hasSchema: true, internalLinks: node ? getAuthorityLinks(node) : [], conversionTarget: node?.conversionTarget ?? "" });
  return { title: record.title, description: record.description, alternates: { canonical }, robots: evaluation.status === "INDEXABLE" ? { index: true, follow: true } : { index: false, follow: true }, openGraph: { title: record.title, description: record.description, url: canonical, type: "website", siteName: "The Milano Seal™" } };
}
export default async function Page({ params }: Props) {
  const { country: countrySlug, document } = await params; const country = getCountryBySlug(countrySlug); const record = getCountryDocumentSeoRecord(countrySlug, document); if (!country || !record) notFound();
  const path = getCountryDocumentPath(record); const node = SEO_AUTHORITY_NODES.find((item) => item.path === path); if (!node) notFound();
  const evidence = record.evidenceIds.map(getEvidence).filter((item) => item !== undefined); const canonical = `${BASE_URL}${path}`; const schema = buildCountryDocumentSeoSchema(record, country.name, canonical);
  return <><Header/><main className="min-h-screen bg-[#060606] pb-[calc(2rem+env(safe-area-inset-bottom))]" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/><CountryDocumentAuthorityPage record={record} country={country} evidence={evidence} links={getAuthorityLinks(node)} conversionTarget={node.conversionTarget}/></main><Footer/></>;
}
