import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { getCountry, getDocumentType, getWorkflowOrDerive } from "@/data/intelligence";
import {
  getAuthorityBySlug,
  getAuthorityStaticParams,
  canAutoDriveReadiness,
} from "@/data/authorities";
import { generateAuthorityPack } from "@/lib/authorityPack";
import Link from "next/link";
import { ArrowRight, Shield, Globe, FileCheck, AlertCircle } from "lucide-react";
import type { Metadata } from "next";

// All currently verified authorities — empty until first authority is researched and sourced.
// Populated automatically as authority records with verified confidence are added to the registry.
export async function generateStaticParams() {
  return getAuthorityStaticParams().flatMap(({ country, authority }) => {
    return []; // No verified records yet; will expand as registry grows
  });
}

export const dynamicParams = true;

interface PageProps {
  params: Promise<{ country: string; authority: string; document: string }>;
}

function isoToFlag(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country: countrySlug, authority: authoritySlug, document: documentSlug } = await params;

  if ([countrySlug, authoritySlug, documentSlug].some((s) => s.includes("."))) {
    return { title: "Not Found" };
  }

  const country = getCountry(countrySlug);
  const doc = getDocumentType(documentSlug);
  const authority = getAuthorityBySlug(authoritySlug);

  if (!country || !doc) return { title: "Not Found" };

  const authorityName = authority?.authority_name ?? authoritySlug.replace(/-/g, " ");

  return {
    title: `${doc.name} for ${authorityName}, ${country.name} | The Milano Seal™`,
    description: `Professional U.S. document execution and apostille services for ${doc.name} accepted by ${authorityName} in ${country.name}. Authority-level preparation with procedural compliance.`,
    keywords: [
      `apostille ${country.name} ${authorityName}`,
      `${doc.name} ${authorityName}`,
      `document authentication ${country.name}`,
      `notarization for ${country.name}`,
    ],
    alternates: {
      canonical: `https://themilanoseal.com/apostille/${countrySlug}/authority/${authoritySlug}/${documentSlug}`,
    },
    openGraph: {
      title: `${doc.name} for ${authorityName} | The Milano Seal™`,
      description: `Authority-level document preparation for ${doc.name} accepted by ${authorityName}, ${country.name}.`,
    },
  };
}

export default async function AuthorityDocumentPage({ params }: PageProps) {
  const { country: countrySlug, authority: authoritySlug, document: documentSlug } = await params;

  if ([countrySlug, authoritySlug, documentSlug].some((s) => s.includes("."))) {
    notFound();
  }

  const country = getCountry(countrySlug);
  const doc = getDocumentType(documentSlug);

  if (!country || !doc) notFound();

  const authority = getAuthorityBySlug(authoritySlug);
  const workflow = getWorkflowOrDerive(countrySlug, documentSlug);
  const pack = authority
    ? generateAuthorityPack(authority.id, documentSlug, countrySlug)
    : null;

  const flag = isoToFlag(country.isoCode);
  const authorityName = authority?.authority_name ?? authoritySlug.replace(/-/g, " ");
  const isHague = country.corridorType === "hague";
  const isVerified = pack ? canAutoDriveReadiness(pack.verification_status as Parameters<typeof canAutoDriveReadiness>[0]) : false;
  const isItaly = country.isoCode.toUpperCase() === "IT";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${doc.name} for ${authorityName}`,
    provider: {
      "@type": "ProfessionalService",
      name: "The Milano Seal™",
      url: "https://themilanoseal.com",
    },
    serviceType: "Notarization and Apostille",
    areaServed: country.name,
    description: `Professional U.S. document authentication for ${doc.name} intended for ${authorityName} in ${country.name}.`,
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Header />

      {/* Hero */}
      <section className="pb-16 px-6" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <Globe className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium capitalize">
              {authority?.authority_type?.replace(/_/g, " ") ?? "Receiving Authority"}
            </span>
          </div>

          <div className="text-5xl mb-4">{flag}</div>

          <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-4 text-balance">
            {doc.name}
          </h1>
          <p className="text-lg text-[#C6A55A] mb-4">{authorityName}</p>
          <p className="text-base text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            Authority-level document preparation for {doc.name} accepted by {authorityName} in {country.name}. Structured for procedural compliance with this specific receiving authority.
          </p>

          <Link
            href={`/intake?country=${country.id}&document=${doc.id}`}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Begin Secure Intake</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Verification status notice */}
      {pack && !isVerified && (
        <section className="py-6 px-6 bg-[#111111]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-3 p-4 border border-[#C6A55A]/20 rounded-lg bg-[#C6A55A]/05">
              <AlertCircle className="w-4 h-4 text-[#C6A55A] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-[#C6A55A] font-medium mb-1">Coordinator Review Required</p>
                <p className="text-xs text-[#B0B0B0]">
                  Requirements for {authorityName} are confirmed by your coordinator before execution begins. All procedures are verified against current authority standards.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Authority summary */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-6">
            Receiving Authority
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4">
              <p className="text-xs text-[#C6A55A] uppercase tracking-widest mb-1">Authority</p>
              <p className="text-white font-medium">{authorityName}</p>
              {authority?.region && (
                <p className="text-xs text-[#B0B0B0] mt-1">{authority.region}, {country.name}</p>
              )}
            </div>
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4">
              <p className="text-xs text-[#C6A55A] uppercase tracking-widest mb-1">Authentication Route</p>
              <p className="text-white font-medium">
                {isHague ? "Hague Apostille" : "Consular Authentication"}
              </p>
            </div>
            {pack?.requirements && (
              <>
                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4">
                  <p className="text-xs text-[#C6A55A] uppercase tracking-widest mb-1">Translation</p>
                  <p className="text-white font-medium">
                    {pack.requirements.translation === "none"
                      ? "Not required"
                      : pack.requirements.translation === "certified_required"
                      ? `Certified ${pack.requirements.translation_language ?? "translation"} required`
                      : `${pack.requirements.translation_language ?? "Translation"} required`}
                  </p>
                </div>
                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4">
                  <p className="text-xs text-[#C6A55A] uppercase tracking-widest mb-1">Witnesses</p>
                  <p className="text-white font-medium">
                    {pack.requirements.witnesses === "none"
                      ? "Not required"
                      : pack.requirements.witnesses === "two_witnesses"
                      ? "2 witnesses required"
                      : "1 witness required"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Client-safe notes */}
          {pack?.client_safe_notes && (
            <p className="text-[#B0B0B0] leading-relaxed text-sm">
              {pack.client_safe_notes}
            </p>
          )}
        </div>
      </section>

      {/* Workflow — from intelligence core, not hardcoded */}
      {workflow && (
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8 text-center">
              Execution Path
            </h2>
            <div className="space-y-4">
              {workflow.executionPath.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-6 bg-[#111111] border border-[#2A2A2A] rounded-xl p-5"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C6A55A]/10 border border-[#C6A55A]/30 flex items-center justify-center">
                    <span className="text-[#C6A55A] text-xs font-medium">{i + 1}</span>
                  </div>
                  <p className="text-sm text-[#B0B0B0] leading-relaxed self-center">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Rejection warnings (client-safe labels only) */}
      {pack && pack.rejection_warnings.length > 0 && (
        <section className="py-16 px-6 bg-[#111111]">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-6 text-center">
              Items to Review Before Execution
            </h2>
            <div className="space-y-3">
              {pack.rejection_warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg"
                >
                  <Shield className="w-4 h-4 text-[#C6A55A] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#B0B0B0]">{w.client_safe_label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-[#5A5A5A] leading-relaxed text-center">
            Procedural guidance only. The Milano Seal is not a law firm and does not provide legal advice. Requirements should always be confirmed with the receiving authority. International document requirements may change.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
            Ready to Begin?
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Start your execution process for {authorityName}. Procedural compliance at every step.
          </p>
          <Link
            href={`/intake?country=${country.id}&document=${doc.id}`}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Begin Secure Intake</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
