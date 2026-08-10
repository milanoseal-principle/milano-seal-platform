import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { getCountryBySlug, COUNTRY_REGISTRY } from "@/lib/compliance/countries";
import { buildCountryPageSchema } from "@/lib/compliance/schemaBuilders";
import { applyVerifiedCountryOverride } from "@/lib/compliance/verified-country-overrides";
import { CountryAuthorityPage } from "@/components/seo/CountryAuthorityPage";
import { getPremiumCorridor } from "@/lib/seo-premium-corridors";

type Props = { params: Promise<{ country: string }> };

export async function generateStaticParams() {
  return COUNTRY_REGISTRY.map((country) => ({ country: country.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: slug } = await params;
  const baseCountry = getCountryBySlug(slug);
  if (!baseCountry) return {};
  const country = applyVerifiedCountryOverride(baseCountry);

  const corridor = getPremiumCorridor(slug);
  const canonical = `https://www.themilanoseal.com/apostille/${slug}`;
  const title = corridor
    ? `U.S. Apostille & Document Execution for ${country.name} | The Milano Seal™`
    : country.seoTitle;
  const description = corridor
    ? `${corridor.positioning} Authority-aware U.S. processing for attorneys, professional advisors, and private clients, with receiving-authority review before release.`
    : country.seoDescription;

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
          alt: `The Milano Seal™ — U.S. document execution for ${country.name}`,
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

export default async function ApostilleCountryPage({ params }: Props) {
  const { country: slug } = await params;
  const baseCountry = getCountryBySlug(slug);
  if (!baseCountry) notFound();
  const country = applyVerifiedCountryOverride(baseCountry);

  const corridor = getPremiumCorridor(slug);
  const url = `https://www.themilanoseal.com/apostille/${slug}`;
  const schema = buildCountryPageSchema(country, url, corridor);
  const authMode = country.hagueMember === "member" ? "apostille" : "authentication";

  return (
    <>
      <Header />
      <main
        className="bg-[#060606] min-h-screen pb-16"
        style={{
          paddingTop: "calc(var(--header-total-height) + var(--sa-top))",
        }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        <CountryAuthorityPage
          country={country}
          authMode={authMode}
          premiumCorridor={corridor}
        />
      </main>
      <Footer />
    </>
  );
}
