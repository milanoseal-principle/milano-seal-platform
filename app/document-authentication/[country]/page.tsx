import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { getCountryBySlug, COUNTRY_REGISTRY } from "@/lib/compliance/countries";
import { buildCountryPageSchema } from "@/lib/compliance/schemaBuilders";
import { CLIENT_COPY } from "@/lib/compliance/clientCopy";
import { CountryAuthorityPage } from "@/components/seo/CountryAuthorityPage";

type Props = { params: Promise<{ country: string }> };

export async function generateStaticParams() {
  return COUNTRY_REGISTRY.filter(c => c.hagueMember !== "member").map(c => ({ country: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) return {};
  return {
    title: `Document Authentication for ${country.name} | The Milano Seal™`,
    description: `Florida document authentication for ${country.name}. ${country.hagueMember !== "member" ? country.name + " is not a Hague Convention member — documents require consular authentication." : ""}`,
    robots: { index: true, follow: true },
  };
}

export default async function DocumentAuthenticationCountryPage({ params }: Props) {
  const { country: slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) notFound();

  const schema = buildCountryPageSchema(
    country,
    `https://www.themilanoseal.com/document-authentication/${slug}`
  );

  return (
    <>
      <Header />
      <main className="bg-[#060606] min-h-screen pb-16" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        <CountryAuthorityPage country={country} authMode="authentication" />
      </main>
      <Footer />
    </>
  );
}
