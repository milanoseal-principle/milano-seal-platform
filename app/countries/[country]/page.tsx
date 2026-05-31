import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Shield, Clock, FileCheck, CheckCircle, ChevronRight } from "lucide-react";
import { COUNTRY_COMPLIANCE_DATA } from "@/components/landing/country-compliance-card";
import { DESTINATIONS } from "@/data/destinations";
import { buildCountryJsonLd, COUNTRY_FAQS } from "@/lib/country-jsonld";

const COUNTRY_SLUGS = [
  "italy", "spain", "uae", "brazil", "mexico", "portugal", "greece", "germany",
] as const;
type CountrySlug = typeof COUNTRY_SLUGS[number];

export function generateStaticParams() {
  return COUNTRY_SLUGS.map((country) => ({ country }));
}

interface PageProps { params: Promise<{ country: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country: slug } = await params;
  const compliance = COUNTRY_COMPLIANCE_DATA[slug];
  const dest = DESTINATIONS.find((d) => d.slug === slug);

  if (!dest) return { title: "Not Found" };

  const canonical = `https://themilanoseal.com/countries/${slug}`;
  const title = `Florida to ${dest.name} Apostille & Document Authentication | The Milano Seal™`;
  const description = compliance?.seoFact ??
    `Professional apostille and document authentication services for ${dest.name}. Notarization, apostille, and international courier. Executed properly the first time.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: "The Milano Seal™", type: "website" },
  };
}

export default async function CountryPage({ params }: PageProps) {
  const { country: slug } = await params;

  const dest = DESTINATIONS.find((d) => d.slug === slug);
  if (!dest) notFound();

  const compliance = COUNTRY_COMPLIANCE_DATA[slug];
  const faqs = COUNTRY_FAQS[slug] ?? [];

  // JSON-LD — only for countries with full compliance data
  const jsonld = compliance ? buildCountryJsonLd(slug, compliance, dest) : null;

  return (
    <>
      {/* JSON-LD */}
      {jsonld && (
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld.service) }} />
          {faqs.length > 0 && (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld.faqPage) }} />
          )}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld.breadcrumb) }} />
        </>
      )}

      <Header />
      <main className="min-h-screen bg-[#050507] text-white pt-[116px]">

        {/* Breadcrumb */}
        <nav className="max-w-5xl mx-auto px-6 pt-8 flex items-center gap-2" aria-label="Breadcrumb">
          <Link href="/" className="font-mono text-[10px] text-[#444] hover:text-[#666] tracking-widest uppercase transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-[#2A2A2A]" />
          <Link href="/map" className="font-mono text-[10px] text-[#444] hover:text-[#666] tracking-widest uppercase transition-colors">Countries</Link>
          <ChevronRight className="w-3 h-3 text-[#2A2A2A]" />
          <span className="font-mono text-[10px] text-[#C6A55A]/70 tracking-widest uppercase">{dest.name}</span>
        </nav>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-12 pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl leading-none select-none" role="img" aria-label={dest.name}>{dest.flag}</span>
                <div>
                  <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#C6A55A]/50 mb-1">
                    Florida → {dest.name.toUpperCase()}
                  </p>
                  <h1 className="font-serif text-4xl md:text-5xl text-white font-medium leading-tight">
                    {dest.name}
                  </h1>
                </div>
              </div>
              {compliance && (
                <p className="text-[#C6A55A] text-sm font-medium tracking-wide">{compliance.tagline}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className={`inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full border font-mono text-[9px] tracking-[0.15em] uppercase ${
                dest.hague
                  ? "border-green-500/30 text-green-400/80 bg-green-500/[0.06]"
                  : "border-amber-500/30 text-amber-400/80 bg-amber-500/[0.06]"
              }`}>
                <Shield className="w-3 h-3" />
                {dest.hague ? "Hague Convention Member" : "Consular Authentication Required"}
              </span>
              {dest.hague && compliance && (
                <span className="font-mono text-[8px] text-[#3A3A3A] pl-1">Member since {compliance.hagueSince}</span>
              )}
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-[#C6A55A]/25 to-transparent" />
        </section>

        {/* Authority Signal Banner */}
        <section className="max-w-5xl mx-auto px-6 pb-6">
          <div
            className="rounded-lg border border-[#C6A55A]/10 bg-[#0A0906] px-5 py-3.5"
            style={{ boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.04)" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-mono text-[8px] tracking-[0.28em] uppercase text-[#C6A55A]/55 flex-shrink-0">
                CORRIDOR STATUS:
              </span>
              <span className="font-mono text-[8px] tracking-[0.18em] uppercase text-[#C6A55A]/80">
                {dest.name.toUpperCase()} FLORIDA INTERNATIONAL ROUTE
                &nbsp;//&nbsp;
                {dest.hague
                  ? "HAGUE CONVENTION VALIDATION VERIFIED"
                  : "CONSULAR LEGALIZATION WORKFLOW REQUIRED"}
              </span>
            </div>
            <p className="font-mono text-[7px] text-[#3A3A3A] mt-1.5 leading-relaxed">
              {dest.hague
                ? `Document workflow routes through the Florida Department of State apostille channel for cross-border recognition review.`
                : `Document workflow routes through state-level authentication before embassy or consular review when required.`}
            </p>
          </div>
        </section>

        {/* Content grid */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main column */}
            <div className="lg:col-span-2 space-y-8">

              {/* Compliance intelligence (primary countries only) */}
              {compliance && (
                <div className="rounded-xl border border-[#C6A55A]/12 bg-[#C6A55A]/[0.04] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-[#C6A55A]" />
                    <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#C6A55A]">
                      Hague Compliance Intelligence
                    </span>
                  </div>
                  <p className="text-[#C0C0C0] leading-relaxed">{compliance.seoFact}</p>
                </div>
              )}

              {/* Stats row */}
              {compliance && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { Icon: Shield,    label: "Hague Since",  value: compliance.hagueSince },
                    { Icon: Clock,     label: "Processing",   value: `${compliance.processingDays} days` },
                    { Icon: FileCheck, label: "Jurisdiction", value: compliance.jurisdiction },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                      <Icon className="w-4 h-4 text-[#C6A55A] mx-auto mb-2" />
                      <div className="font-mono text-[8px] text-[#555] uppercase tracking-widest mb-1">{label}</div>
                      <div className="text-sm font-medium text-white leading-tight">{value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Execution Path */}
              <div>
                <h2 className="font-serif text-xl text-white mb-5">Execution Path</h2>
                <div className="space-y-3.5">
                  {dest.executionPath.map((step, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className="font-mono text-[#C6A55A]/40 text-[10px] mt-1 w-6 flex-shrink-0 text-right">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[#909090] leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              {faqs.length > 0 && (
                <div>
                  <h2 className="font-serif text-xl text-white mb-5">Frequently Asked Questions</h2>
                  <div className="space-y-4">
                    {faqs.map(({ q, a }, i) => (
                      <div key={i} className="border border-white/[0.05] rounded-xl p-5 bg-white/[0.01]">
                        <h3 className="text-white font-medium mb-2 leading-snug">{q}</h3>
                        <p className="text-[#888] text-sm leading-relaxed">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <p className="font-mono text-[8px] text-[#2A2A2A] leading-relaxed">
                Procedural guidance only. Not legal advice. Requirements confirmed with receiving authority before execution.
              </p>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">

              {/* CTA card */}
              <div className="relative rounded-xl border border-[#C6A55A]/20 bg-[#0A0A0A] p-5 sticky top-6"
                style={{ boxShadow: "0 0 0 1px rgba(198,165,90,0.06), 0 24px 48px rgba(0,0,0,0.6)" }}>
                <div className="absolute top-0 left-0 right-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-[#C6A55A]/50 to-transparent" />
                <p className="font-mono text-[8px] tracking-[0.28em] uppercase text-[#C6A55A]/40 mb-3">Begin Execution</p>
                <p className="text-white font-serif text-lg leading-snug mb-4">{dest.name} Document Authentication</p>
                <Link
                  href={`/intake?country=${encodeURIComponent(dest.name)}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#C6A55A] text-[#050507] font-bold tracking-[0.12em] text-[11px] uppercase rounded-lg hover:bg-[#D4B76A] transition-colors mb-3"
                >
                  Begin {dest.name} Intake <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/services/apostille"
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-white/[0.08] text-[#666] text-[11px] uppercase font-mono tracking-[0.1em] rounded-lg hover:border-[#C6A55A]/20 hover:text-[#888] transition-colors"
                >
                  View Apostille Services
                </Link>
              </div>

              {/* Compliance badges */}
              {compliance && (
                <div className="rounded-xl border border-white/[0.05] bg-[#080808] p-5">
                  <p className="font-mono text-[8px] tracking-[0.25em] uppercase text-[#444] mb-3">Compliance Clearances</p>
                  <div className="flex flex-wrap gap-1.5">
                    {compliance.complianceBadges.map((badge) => (
                      <span key={badge} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#C6A55A]/20 bg-[#C6A55A]/[0.05] text-[11px] text-[#C6A55A]">
                        <CheckCircle className="w-2.5 h-2.5 flex-shrink-0" />
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div className="rounded-xl border border-white/[0.05] bg-[#080808] p-5">
                <p className="font-mono text-[8px] tracking-[0.25em] uppercase text-[#444] mb-3">Documents Handled</p>
                <div className="flex flex-wrap gap-1.5">
                  {(compliance?.documentTypes ?? dest.commonDocuments).map((doc) => (
                    <Link
                      key={doc}
                      href={`/intake?country=${encodeURIComponent(dest.name)}&document=${encodeURIComponent(doc)}`}
                      className="px-2.5 py-1 rounded-full border border-white/[0.07] bg-white/[0.02] text-[11px] text-[#666] hover:text-[#888] hover:border-white/[0.12] transition-colors"
                    >
                      {doc}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Internal links */}
              <div className="rounded-xl border border-white/[0.05] bg-[#080808] p-5">
                <p className="font-mono text-[8px] tracking-[0.25em] uppercase text-[#444] mb-3">Related Services</p>
                <nav className="space-y-2">
                  {[
                    { label: "Apostille Coordination",         href: "/services/apostille" },
                    { label: "Mobile Notary Service",           href: "/services/mobile-notary" },
                    { label: "Remote Online Notarization",     href: "/services/ron" },
                    { label: "Document Authentication",         href: "/services" },
                    { label: "International Process Overview", href: "/process" },
                  ].map(({ label, href }) => (
                    <Link key={href} href={href} className="flex items-center justify-between py-1.5 text-[#555] hover:text-[#888] text-sm transition-colors group">
                      <span>{label}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA strip */}
        <section className="border-t border-white/[0.04] bg-[#070709]">
          <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#C6A55A]/40 mb-1">The Milano Seal™</p>
              <p className="text-white font-serif text-lg">Florida notarization. Global authentication. Delivered.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link href={`/intake?country=${encodeURIComponent(dest.name)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C6A55A] text-[#050507] font-bold text-[11px] uppercase tracking-[0.12em] rounded-lg hover:bg-[#D4B76A] transition-colors">
                Begin Intake <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/map"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#C6A55A]/30 text-[#C6A55A] text-[11px] uppercase tracking-[0.1em] rounded-lg hover:border-[#C6A55A] transition-colors">
                All Countries
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
