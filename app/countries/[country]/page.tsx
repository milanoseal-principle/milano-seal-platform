import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Shield,
  Clock,
  FileCheck,
  CheckCircle,
  ChevronRight,
  Map,
} from "lucide-react";
import { COUNTRY_COMPLIANCE_DATA } from "@/components/landing/country-compliance-card";
import { DESTINATIONS } from "@/data/destinations";
import { getCountryBySlug } from "@/lib/compliance/countries";
import { applyVerifiedCountryOverride } from "@/lib/compliance/verified-country-overrides";
import { GlobalRouteGlobe } from "@/components/globe/GlobalRouteGlobe";
import { SeoCorridorMapPreview } from "@/components/map/SeoCorridorMapPreview";

const COUNTRY_SLUGS = [
  "italy",
  "spain",
  "uae",
  "brazil",
  "mexico",
  "portugal",
  "greece",
  "germany",
  "france",
  "switzerland",
] as const;

export function generateStaticParams() {
  return COUNTRY_SLUGS.map((country) => ({ country }));
}

interface PageProps {
  params: Promise<{ country: string }>;
}

function authoritySteps(isHague: boolean) {
  return [
    "Confirm the document origin, issuing authority, and receiving authority.",
    "Determine whether notarization or another execution step is actually required for this document.",
    isHague
      ? "Route the document to the competent U.S. state or federal apostille authority based on document origin."
      : "Confirm the current U.S. authentication and destination-country legalization chain before release.",
    "Confirm any translation, certification, copy, witness, or receiving-authority requirements that apply to the Matter.",
    "Release through the secure client workflow and coordinate courier custody when selected.",
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country: slug } = await params;
  const dest = DESTINATIONS.find((destination) => destination.slug === slug);
  const baseCountry = getCountryBySlug(slug);

  if (!dest || !baseCountry) return { title: "Not Found" };
  const country = applyVerifiedCountryOverride(baseCountry);

  const canonical = `https://www.themilanoseal.com/countries/${slug}`;
  const title = `${dest.name} U.S. Document Authority & Apostille Intelligence | The Milano Seal™`;
  const description = `Authority-routing overview for U.S. documents destined for ${dest.name}. Review Hague status, document-origin logic, competent authority routing, and secure intake before execution.`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "The Milano Seal™",
      type: "website",
      images: [
        {
          url: "https://www.themilanoseal.com/og-image.png",
          width: 1200,
          height: 630,
          alt: `The Milano Seal™ — ${dest.name} document authority intelligence`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://www.themilanoseal.com/og-image.png"],
    },
    other: {
      "milano-hague-status": country.hagueMember,
    },
  };
}

export default async function CountryPage({ params }: PageProps) {
  const { country: slug } = await params;
  const dest = DESTINATIONS.find((destination) => destination.slug === slug);
  const baseCountry = getCountryBySlug(slug);
  if (!dest || !baseCountry) notFound();

  const country = applyVerifiedCountryOverride(baseCountry);
  const compliance = COUNTRY_COMPLIANCE_DATA[slug];
  const isHague = country.hagueMember === "member";
  const steps = authoritySteps(isHague);
  const canonical = `https://www.themilanoseal.com/countries/${slug}`;
  const apostilleHref = `/apostille/${slug}`;
  const intakeHref = `/intake?destination=${encodeURIComponent(slug)}&country=${encodeURIComponent(dest.name)}&source=country-intelligence`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${dest.name} U.S. Document Authority Intelligence`,
    description: `Authority-routing overview for U.S. documents destined for ${dest.name}.`,
    url: canonical,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.themilanoseal.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Countries",
          item: "https://www.themilanoseal.com/countries",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: dest.name,
          item: canonical,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="min-h-screen bg-[#050507] text-white pt-[var(--header-total-height)]">
        <nav
          className="max-w-5xl mx-auto px-6 pt-8 flex items-center gap-2"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="font-mono text-[10px] text-[#444] hover:text-[#666] tracking-widest uppercase transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-[#2A2A2A]" />
          <Link
            href="/countries"
            className="font-mono text-[10px] text-[#444] hover:text-[#666] tracking-widest uppercase transition-colors"
          >
            Countries
          </Link>
          <ChevronRight className="w-3 h-3 text-[#2A2A2A]" />
          <span className="font-mono text-[10px] text-[#C6A55A]/70 tracking-widest uppercase">
            {dest.name}
          </span>
        </nav>

        <section className="max-w-5xl mx-auto px-6 pt-12 pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span
                  className="text-5xl leading-none select-none"
                  role="img"
                  aria-label={dest.name}
                >
                  {dest.flag}
                </span>
                <div>
                  <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#C6A55A]/50 mb-1">
                    U.S. → {dest.name.toUpperCase()}
                  </p>
                  <h1 className="font-serif text-4xl md:text-5xl text-white font-medium leading-tight">
                    {dest.name} Document Authority Intelligence
                  </h1>
                </div>
              </div>
              <p className="text-[#C6A55A] text-sm font-medium tracking-wide">
                {compliance?.tagline ??
                  "Document origin · competent authority · receiving-authority review"}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span
                className={`inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full border font-mono text-[9px] tracking-[0.15em] uppercase ${
                  isHague
                    ? "border-green-500/30 text-green-400/80 bg-green-500/[0.06]"
                    : "border-amber-500/30 text-amber-400/80 bg-amber-500/[0.06]"
                }`}
              >
                <Shield className="w-3 h-3" />
                {isHague
                  ? "Hague Apostille Convention"
                  : "Authentication / Legalization Review"}
              </span>
              {isHague && country.hagueMemberSince && (
                <span className="font-mono text-[8px] text-[#3A3A3A] pl-1">
                  Entry into force {country.hagueMemberSince}
                </span>
              )}
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-[#C6A55A]/25 to-transparent" />
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-6">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#C6A55A]/60 mb-2">
                Authority Coverage
              </p>
              <GlobalRouteGlobe
                selectedSlug={slug}
                className="w-full max-w-[400px]"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#C6A55A]/60 mb-2">
                Corridor Preview
              </p>
              <SeoCorridorMapPreview slug={slug} className="w-full" />
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-6">
          <div
            className="rounded-lg border border-[#C6A55A]/10 bg-[#0A0906] px-5 py-3.5"
            style={{ boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.04)" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-mono text-[8px] tracking-[0.06em] uppercase text-[#C6A55A]/70 flex-shrink-0">
                ROUTE STATUS:
              </span>
              <span className="font-mono text-[8px] tracking-[0.08em] uppercase text-[#C6A55A]/80">
                {isHague
                  ? "HAGUE APOSTILLE PATH AVAILABLE — COMPETENT AUTHORITY DEPENDS ON DOCUMENT ORIGIN"
                  : "AUTHENTICATION / LEGALIZATION PATH REQUIRES CURRENT RECEIVING-AUTHORITY REVIEW"}
              </span>
            </div>
            <p className="font-mono text-[7px] text-[#3A3A3A] mt-1.5 leading-relaxed">
              No page-level country rule overrides the actual document origin. State public records, federal documents, and privately executed documents can require different U.S. authority paths.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="rounded-xl border border-[#C6A55A]/12 bg-[#C6A55A]/[0.04] p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-[#C6A55A]" />
                  <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-[#C6A55A]">
                    Authority Intelligence
                  </span>
                </div>
                <p className="text-[#C0C0C0] leading-relaxed">
                  {country.seoDescription}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    Icon: Shield,
                    label: "Convention",
                    value: isHague ? "Hague" : "Non-Hague",
                  },
                  {
                    Icon: Clock,
                    label: "Timeline",
                    value: "Authority-dependent",
                  },
                  {
                    Icon: FileCheck,
                    label: "Route",
                    value: "Origin-specific",
                  },
                ].map(({ Icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center"
                  >
                    <Icon className="w-4 h-4 text-[#C6A55A] mx-auto mb-2" />
                    <div className="font-mono text-[8px] text-[#555] uppercase tracking-widest mb-1">
                      {label}
                    </div>
                    <div className="text-sm font-medium text-white leading-tight">
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="font-serif text-xl text-white mb-5">
                  Authority-Aware Execution Path
                </h2>
                <div className="space-y-3.5">
                  {steps.map((step, index) => (
                    <div key={step} className="flex items-start gap-4">
                      <span className="font-mono text-[#C6A55A]/40 text-[10px] mt-1 w-6 flex-shrink-0 text-right">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[#909090] leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {country.faqs.length > 0 && (
                <div>
                  <h2 className="font-serif text-xl text-white mb-5">
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-4">
                    {country.faqs.map(({ q, a }) => (
                      <div
                        key={q}
                        className="border border-white/[0.05] rounded-xl p-5 bg-white/[0.01]"
                      >
                        <h3 className="text-white font-medium mb-2 leading-snug">
                          {q}
                        </h3>
                        <p className="text-[#888] text-sm leading-relaxed">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="font-mono text-[8px] text-[#2A2A2A] leading-relaxed">
                Procedural coordination only. Requirements are confirmed against document origin and the receiving authority before execution or release.
              </p>
            </div>

            <div className="space-y-5">
              <div
                className="relative rounded-xl border border-[#C6A55A]/20 bg-[#0A0A0A] p-5 sticky top-6"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(198,165,90,0.06), 0 24px 48px rgba(0,0,0,0.6)",
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-[#C6A55A]/50 to-transparent" />
                <p className="font-mono text-[8px] tracking-[0.06em] uppercase text-[#C6A55A]/70 mb-3">
                  Begin Secure Intake
                </p>
                <p className="text-white font-serif text-lg leading-snug mb-4">
                  {dest.name} Document Coordination
                </p>
                <Link
                  href={intakeHref}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#C6A55A] text-[#050507] font-bold tracking-[0.12em] text-[11px] uppercase rounded-lg hover:bg-[#D4B76A] transition-colors mb-3"
                >
                  Begin {dest.name} Intake <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={apostilleHref}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-[#C6A55A]/20 text-[#C6A55A]/70 text-[11px] uppercase font-mono tracking-[0.1em] rounded-lg hover:border-[#C6A55A]/50 hover:text-[#C6A55A] transition-colors mb-3"
                >
                  {isHague ? "Apostille Service Page" : "Authentication Service Page"}
                </Link>
                <Link
                  href={`/map?country=${encodeURIComponent(dest.slug)}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-[#C6A55A]/20 text-[#C6A55A]/70 text-[11px] uppercase font-mono tracking-[0.1em] rounded-lg hover:border-[#C6A55A]/50 hover:text-[#C6A55A] transition-colors"
                >
                  <Map className="w-3 h-3" /> View in Atlas
                </Link>
              </div>

              {compliance && (
                <div className="rounded-xl border border-white/[0.05] bg-[#080808] p-5">
                  <p className="font-mono text-[8px] tracking-[0.08em] uppercase text-[#666] mb-3">
                    Route Controls
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {compliance.complianceBadges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#C6A55A]/20 bg-[#C6A55A]/[0.05] text-[11px] text-[#C6A55A]"
                      >
                        <CheckCircle className="w-2.5 h-2.5 flex-shrink-0" />
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-white/[0.05] bg-[#080808] p-5">
                <p className="font-mono text-[8px] tracking-[0.08em] uppercase text-[#666] mb-3">
                  Common Matters
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(compliance?.documentTypes ?? dest.commonDocuments).map(
                    (document) => (
                      <Link
                        key={document}
                        href={`${intakeHref}&document=${encodeURIComponent(document)}`}
                        className="px-2.5 py-1 rounded-full border border-white/[0.07] bg-white/[0.02] text-[11px] text-[#666] hover:text-[#888] hover:border-white/[0.12] transition-colors"
                      >
                        {document}
                      </Link>
                    ),
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-[#080808] p-5">
                <p className="font-mono text-[8px] tracking-[0.08em] uppercase text-[#666] mb-3">
                  Related Services
                </p>
                <nav className="space-y-2">
                  {[
                    { label: "Country Service Page", href: apostilleHref },
                    { label: "Apostille Coordination", href: "/services/apostille" },
                    { label: "International Execution", href: "/services/international-execution" },
                    { label: "Document Authentication", href: "/services" },
                    { label: "International Process Overview", href: "/process" },
                  ].map(({ label, href }) => (
                    <Link
                      key={`${label}-${href}`}
                      href={href}
                      className="flex items-center justify-between py-1.5 text-[#555] hover:text-[#888] text-sm transition-colors group"
                    >
                      <span>{label}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.04] bg-[#070709]">
          <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-mono text-[9px] tracking-[0.08em] uppercase text-[#C6A55A]/40 mb-1">
                The Milano Seal™
              </p>
              <p className="text-white font-serif text-lg">
                U.S. document execution. Authority-aware authentication. Secure release.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link
                href={intakeHref}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C6A55A] text-[#050507] font-bold text-[11px] uppercase tracking-[0.12em] rounded-lg hover:bg-[#D4B76A] transition-colors"
              >
                Begin Intake <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/map?country=${encodeURIComponent(dest.slug)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#C6A55A]/30 text-[#C6A55A] text-[11px] uppercase tracking-[0.1em] rounded-lg hover:border-[#C6A55A] transition-colors"
              >
                <Map className="w-3.5 h-3.5" /> View in Atlas
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
