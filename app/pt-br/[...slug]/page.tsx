import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedAcquisitionPage } from "@/components/seo/LocalizedAcquisitionPage";
import { getHreflangAlternates } from "@/lib/seo/localization/hreflang";
import { absoluteMilanoUrl, getLocalizedSeoRecord, getPublishedLocalizedRecords, isLocalizedSeoRecordPublishable, localizedPath, slugForLocalizedRecord } from "@/lib/seo/localization/runtime";
const LOCALE = "pt-BR" as const; const PREFIX = "pt";
export const dynamicParams = false;
export function generateStaticParams() { return getPublishedLocalizedRecords(LOCALE).map((record) => ({ slug: slugForLocalizedRecord(record) })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> { const { slug } = await params; const record = getLocalizedSeoRecord(LOCALE, localizedPath(PREFIX, slug)); if (!isLocalizedSeoRecordPublishable(record)) return { robots: { index: false, follow: false } }; const languages = Object.fromEntries(Object.entries(getHreflangAlternates(record.path) ?? {}).map(([locale, path]) => [locale, absoluteMilanoUrl(String(path))])); return { title: record.title, description: record.description, alternates: { canonical: absoluteMilanoUrl(record.path), languages }, robots: { index: true, follow: true } }; }
export default async function BrazilianPortugueseLocalizedPage({ params }: { params: Promise<{ slug: string[] }> }) { const { slug } = await params; const record = getLocalizedSeoRecord(LOCALE, localizedPath(PREFIX, slug)); if (!isLocalizedSeoRecordPublishable(record)) notFound(); return <LocalizedAcquisitionPage record={record} />; }
