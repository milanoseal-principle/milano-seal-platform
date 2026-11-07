import { CounselContextLink } from "@/components/counsel/CounselContextLink";
import { COUNSEL_CORRIDORS } from "@/lib/counsel/content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Globe2,
  ShieldCheck,
} from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { UniversalProfessionalCountrySurface } from "@/components/professional/UniversalProfessionalCountrySurface";
import {
  PROFESSIONAL_CONVENTION_DESTINATIONS,
  getProfessionalDestination,
} from "@/lib/professional/universal-attorney-journey";
import { getPremiumCorridor } from "@/lib/seo-premium-corridors";
import { getCountryBySlug } from "@/lib/compliance/countries";
import { applyVerifiedCountryOverride } from "@/lib/compliance/verified-country-overrides";

type Props = { params: Promise<{ country: string }> };

export function generateStaticParams() {
  return [
    ...PROFESSIONAL_CONVENTION_DESTINATIONS,
    getProfessionalDestination("uae")!,
  ].map((destination) => ({
    country: destination.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: slug } = await params;
  const destination = getProfessionalDestination(slug);
  if (
    !destination ||
    (!PROFESSIONAL_CONVENTION_DESTINATIONS.some((item) => item.slug === slug) &&
      slug !== "uae")
  ) {
    return {};
  }

  if ((COUNSEL_CORRIDORS as readonly string[]).includes(slug)) {
    const title = `U.S. Document Execution for ${destination.name} Counsel | The Milano Seal™`;
    const description = `Document-specific U.S. execution review, custody and international release coordination for counsel handling ${destination.name} matters. Final acceptance remains with the receiving authority.`;
    const canonical = `https://www.themilanoseal.com/professional/${slug}`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        type: "website",
        images: ["https://www.themilanoseal.com/og-image.png"],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["https://www.themilanoseal.com/og-image.png"],
      },
    };
  }
  const corridor = getPremiumCorridor(slug);
  const baseCountry = getCountryBySlug(slug);
  const canonical = `https://www.themilanoseal.com/professional/${slug}`;

  if (corridor && baseCountry) {
    const country = applyVerifiedCountryOverride(baseCountry);
    const title = `U.S. Apostille & Document Execution for ${country.name} Attorneys | The Milano Seal™`;
    const description = `${corridor.positioning} Professional U.S. execution support for attorneys, notaries, fiduciaries, family offices, corporate counsel, and cross-border advisors.`;

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
            alt: `The Milano Seal™ — U.S. apostille and document execution for ${country.name}`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["https://www.themilanoseal.com/og-image.png"],
      },
    };
  }

  const title = `U.S. Document Execution for ${destination.name} | The Milano Seal™`;
  const description = `Professional U.S. document execution, apostille/authentication routing, custody, and international release coordination for matters using U.S. documents in ${destination.name}.`;

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
          alt: `The Milano Seal™ — U.S. document execution for ${destination.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://www.themilanoseal.com/og-image.png"],
    },
  };
}

export default async function ProfessionalCountryPage({ params }: Props) {
  const { country: slug } = await params;
  const destination = getProfessionalDestination(slug);
  const governed =
    PROFESSIONAL_CONVENTION_DESTINATIONS.some((item) => item.slug === slug) ||
    slug === "uae";
  if (!destination || !governed) notFound();

  const corridor = getPremiumCorridor(slug);
  const baseCountry = getCountryBySlug(slug);

  if (
    !corridor ||
    !baseCountry ||
    (COUNSEL_CORRIDORS as readonly string[]).includes(slug)
  ) {
    return (
      <PublicShell>
        <UniversalProfessionalCountrySurface destination={destination} />
      </PublicShell>
    );
  }

  const country = applyVerifiedCountryOverride(baseCountry);
  const isHague = country.hagueMember === "member";
  const canonical = `https://www.themilanoseal.com/professional/${slug}`;
  const context = {
    corridor: `us-${slug}`,
    landing_page: `/professional/${slug}`,
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `U.S. Apostille & Document Execution for ${country.name} Attorneys & Professional Advisors`,
    description: corridor.positioning,
    url: canonical,
    mainEntity: {
      "@type": "Service",
      name: `Professional U.S. Apostille & Document Execution for ${country.name}`,
      serviceType: "U.S. document execution and apostille coordination",
      provider: {
        "@type": "Organization",
        name: "The Milano Seal™",
        url: "https://www.themilanoseal.com",
      },
      areaServed: { "@type": "Country", name: country.name },
      audience: {
        "@type": "Audience",
        audienceType:
          "Attorneys, notaries, fiduciaries, professional advisors, family offices, corporate counsel, and private-client professionals",
      },
      description: corridor.positioning,
      url: canonical,
    },
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
          name: "Professional",
          item: "https://www.themilanoseal.com/professional",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: country.name,
          item: canonical,
        },
      ],
    },
  };

  return (
    <PublicShell>
      <main
        className="min-h-screen bg-[#060606] text-white"
        style={{
          paddingTop: "calc(var(--header-total-height) + var(--sa-top))",
        }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />

        <section className="px-4 sm:px-6 pt-16 pb-12">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-4xl">
              <p className="font-mono text-[11px] tracking-[0.24em] uppercase text-[#C6A55A]/70 mb-4">
                Professional Execution Desk · {country.name}
              </p>
              <h1 className="font-serif text-5xl md:text-6xl leading-[1.02] font-medium text-white mb-6">
                U.S. Apostille & Document Execution for {country.name}{" "}
                <em className="text-[#C6A55A]">Attorneys & Advisors</em>
              </h1>
              <p className="text-[#A0A0A0] text-lg leading-relaxed mb-5 max-w-3xl">
                {corridor.positioning}
              </p>
              <p className="text-[#777] text-base leading-7 max-w-3xl">
                The Milano Seal coordinates the U.S. side of the Matter:
                document-origin review, execution when required,
                competent-authority routing, custody, status, and secure
                release. The foreign receiving authority remains the source of
                truth for its matter-specific acceptance requirements.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <CounselContextLink
                  destination={country.name}
                  context={context}
                  className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 rounded-lg bg-[#C6A55A] text-[#050507] font-semibold text-sm hover:bg-[#D4B76A] transition-colors"
                >
                  Send a U.S. Matter <ArrowRight className="w-4 h-4" />
                </CounselContextLink>
                <Link
                  href={`/apostille/${slug}`}
                  className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 rounded-lg border border-[#C6A55A]/30 text-[#C6A55A] text-sm font-medium hover:border-[#C6A55A] transition-colors"
                >
                  {isHague
                    ? "View Apostille Corridor"
                    : "View Authentication Corridor"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 border-y border-white/[0.05] bg-[#090909]">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">
            {[
              {
                Icon: ShieldCheck,
                title: "Authority-Aware",
                body: "State public records, federal documents, and privately executed documents are routed according to their actual U.S. origin rather than a one-size-fits-all apostille path.",
              },
              {
                Icon: FileText,
                title: "Matter-Controlled",
                body: "The document scope, receiving instructions, payment state, custody, and execution status remain attached to one canonical Matter.",
              },
              {
                Icon: Globe2,
                title: "Cross-Border Ready",
                body: "The professional lane is built for receiving counsel and advisors who need a dependable U.S. execution counterpart rather than a commodity stamp service.",
              },
            ].map(({ Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-white/[0.06] bg-[#060606] p-6"
              >
                <Icon className="w-5 h-5 text-[#C6A55A] mb-4" />
                <h2 className="font-serif text-2xl mb-3">{title}</h2>
                <p className="text-[#777] text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-[1.15fr_0.85fr] gap-12">
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#C6A55A]/60 mb-3">
                Common Professional Matters
              </p>
              <h2 className="font-serif text-3xl mb-7">
                U.S. documents coordinated for {country.name}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {corridor.commonMatters.map((matter) => (
                  <div
                    key={matter}
                    className="flex items-start gap-3 p-4 rounded-lg border border-white/[0.05] bg-white/[0.015]"
                  >
                    <CheckCircle className="w-4 h-4 text-[#C6A55A] mt-0.5 flex-shrink-0" />
                    <span className="text-[#A0A0A0] text-sm leading-relaxed">
                      {matter}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-xl border border-[#C6A55A]/20 bg-[#0A0906] p-6 self-start">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C6A55A]/70 mb-4">
                Corridor Control
              </p>
              <div className="space-y-5">
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-widest mb-1">
                    Destination
                  </p>
                  <p className="text-white">{country.name}</p>
                </div>
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-widest mb-1">
                    Convention status
                  </p>
                  <p className="text-white">
                    {isHague
                      ? `Hague Apostille Convention · effective ${country.hagueMemberSince ?? "verified"}`
                      : "Authentication / legalization review required"}
                  </p>
                </div>
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-widest mb-1">
                    Professional audience
                  </p>
                  <p className="text-[#999] text-sm leading-relaxed">
                    {corridor.professionalAudience}
                  </p>
                </div>
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-widest mb-1">
                    Common request language
                  </p>
                  <p className="text-[#C6A55A] text-sm">
                    {corridor.nativeLanguageQuery}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16 bg-[#090909] border-y border-white/[0.05]">
          <div className="max-w-4xl mx-auto">
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#C6A55A]/60 mb-3">
              Direct Answers for {country.name} Matters
            </p>
            <h2 className="font-serif text-3xl mb-8">
              U.S. apostille and document-execution questions
            </h2>
            <div className="space-y-4">
              {corridor.answerEngineQuestions.map((item) => (
                <article
                  key={item.question}
                  className="rounded-xl border border-white/[0.06] bg-[#060606] p-6"
                >
                  <h3 className="font-serif text-xl text-[#E8DCC0] mb-3">
                    {item.question}
                  </h3>
                  <p className="text-[#818181] text-sm leading-relaxed">
                    {item.answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-14">
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C6A55A]/60 mb-3">
              Professional U.S. Execution Desk
            </p>
            <h2 className="font-serif text-3xl mb-4">
              Send the Matter. We will structure the U.S. execution path.
            </h2>
            <p className="text-[#707070] leading-relaxed mb-7">
              Current matter facts are confirmed during secure intake.
              Prior-client recognition never bypasses identity, pricing,
              authority, payment, or execution controls.
            </p>
            <CounselContextLink
              destination={country.name}
              context={context}
              className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 rounded-lg bg-[#C6A55A] text-[#050507] font-semibold text-sm hover:bg-[#D4B76A] transition-colors"
            >
              Send a U.S. Matter <ArrowRight className="w-4 h-4" />
            </CounselContextLink>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
