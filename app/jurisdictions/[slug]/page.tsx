import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Check, FileText, Shield } from "lucide-react";
import { JURISDICTION_PROFILES } from "@/lib/jurisdiction-data";
import { JurisdictionJsonLd } from "@/components/seo/jurisdiction-jsonld";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return JURISDICTION_PROFILES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = JURISDICTION_PROFILES.find((p) => p.slug === slug);
  if (!profile) return {};
  return {
    title: profile.seo.title,
    description: profile.seo.description,
    keywords: profile.seo.keywords,
    alternates: {
      canonical: `/jurisdictions/${profile.slug}`,
    },
  };
}

export default async function JurisdictionPage({ params }: Props) {
  const { slug } = await params;
  const profile = JURISDICTION_PROFILES.find((p) => p.slug === slug);
  if (!profile) notFound();

  const isHague = profile.routeType === "Hague Convention Routing";

  return (
    <>
      <JurisdictionJsonLd profile={profile} />

      <main className="min-h-screen bg-[#050507] text-white">
        {/* Header bar */}
        <div className="border-b border-[#1A1A1A]">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="font-serif text-sm text-[#C6A55A] hover:text-[#D4B76A] transition-colors"
            >
              The Milano Seal™
            </Link>
            <Link
              href="/map"
              className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#555] hover:text-[#888] transition-colors"
            >
              ← Global Map
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          {/* Eyebrow */}
          <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-[#6A5520] block mb-6">
            Jurisdiction Routing Profile
          </span>

          {/* H1 */}
          <h1 className="font-serif text-3xl md:text-5xl font-medium text-white mb-4 text-balance leading-tight">
            {profile.name} Document Execution Route
          </h1>

          {/* Route type badge */}
          <div className="flex items-center gap-3 mb-12">
            <span
              className={`inline-flex items-center gap-2 font-mono text-[10px] px-3 py-1.5 rounded border ${
                isHague
                  ? "border-green-500/25 text-green-400/80 bg-green-500/[0.05]"
                  : "border-amber-500/25 text-amber-400/80 bg-amber-500/[0.05]"
              }`}
            >
              {profile.routeType}
            </span>
            <span className="font-mono text-[9px] text-[#444] tracking-wider">
              FL ORIGIN → {profile.name.toUpperCase()} VECTOR
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Left column — main content */}
            <div className="md:col-span-2 space-y-10">

              {/* Jurisdictional Status */}
              <section>
                <h2 className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555] mb-4">
                  Jurisdictional Status
                </h2>
                <div className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="w-4 h-4 text-[#C6A55A] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium mb-1">
                        {profile.routeType}
                      </p>
                      <p className="text-xs text-[#888] leading-relaxed">
                        {isHague
                          ? "This destination participates in the Hague Apostille Convention. Florida-origin documents may be routed through the Florida Department of State for apostille issuance."
                          : "This destination route requires embassy or consular authentication review in addition to or instead of standard apostille processing. Chain-of-custody coordination applies."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Filing Channel */}
              <section>
                <h2 className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555] mb-4">
                  Filing Channel
                </h2>
                <div className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-5">
                  <p className="text-sm text-white font-medium mb-2">{profile.filingChannel}</p>
                  <p className="text-xs text-[#888] leading-relaxed">{profile.reviewProtocol}</p>
                </div>
              </section>

              {/* Execution Sequence */}
              <section>
                <h2 className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555] mb-4">
                  Execution Sequence
                </h2>
                <div className="space-y-3">
                  {profile.executionSequence.map((step, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className="font-mono text-[#C6A55A]/40 text-[10px] mt-0.5 w-6 flex-shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm text-[#B0B0B0] leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Review Protocol note */}
              <section>
                <h2 className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555] mb-4">
                  Important Review Note
                </h2>
                <div className="bg-[#0D0D0D] border border-[#C6A55A]/10 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-[#C6A55A]/60 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#888] leading-relaxed">{profile.disclaimer}</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Right column — sidebar */}
            <div className="space-y-6">
              {/* Common Documents */}
              <section className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-5">
                <h2 className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555] mb-4 flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  Common Document Types
                </h2>
                <ul className="space-y-2.5">
                  {profile.commonDocuments.map((doc) => (
                    <li key={doc} className="flex items-start gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#C6A55A] mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-[#B0B0B0] leading-snug">{doc}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Origin */}
              <section className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-5">
                <h2 className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555] mb-3">
                  Execution Origin
                </h2>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C6A55A]" />
                  <span className="text-sm text-white">Florida, United States</span>
                </div>
                <p className="font-mono text-[9px] text-[#444] tracking-wider">
                  FLORIDA NOTARY #668288
                </p>
              </section>

              {/* Internal links */}
              <section className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-5">
                <h2 className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555] mb-3">
                  Related
                </h2>
                <div className="space-y-2">
                  <Link
                    href="/map"
                    className="block text-xs text-[#888] hover:text-[#C6A55A] transition-colors"
                  >
                    → Global Document Intelligence Map
                  </Link>
                  <Link
                    href="/apostille"
                    className="block text-xs text-[#888] hover:text-[#C6A55A] transition-colors"
                  >
                    → Apostille Coordination
                  </Link>
                  <Link
                    href="/intake"
                    className="block text-xs text-[#888] hover:text-[#C6A55A] transition-colors"
                  >
                    → Begin Secure Intake
                  </Link>
                </div>
              </section>
            </div>
          </div>

          {/* CTA */}
          <div className="border-t border-[#1A1A1A] pt-12 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href={`/intake?country=${encodeURIComponent(profile.name)}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#C6A55A] text-[#050507] font-bold tracking-[0.12em] text-sm uppercase rounded-lg hover:bg-[#D4B76A] transition-colors"
            >
              Begin Secure Intake
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-6 py-4 border border-[#C6A55A]/30 text-[#C6A55A] text-sm font-medium rounded-lg hover:border-[#C6A55A] hover:bg-[#C6A55A]/5 transition-colors"
            >
              View Global Map
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
