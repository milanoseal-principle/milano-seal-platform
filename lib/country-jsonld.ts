import type { CountryData } from "@/components/landing/country-compliance-card";
import type { Destination } from "@/data/destinations";
import { PUBLIC_COUNTRY_INTELLIGENCE, getPublicCountryExecutionIntelligence } from "@/data/public-country-intelligence";

const SITE_URL = "https://www.themilanoseal.com";

const ORGANIZATION = {
  "@type": "Organization",
  name: "The Milano Seal™",
  url: SITE_URL,
  logo: `${SITE_URL}/milano-seal-gold-transparent-512.png`,
  address: {
    "@type": "PostalAddress",
    addressRegion: "FL",
    addressCountry: "US",
  },
};

export interface CountryJsonLd {
  service: object;
  faqPage: object;
  breadcrumb: object;
}

export function safeCountryFaqs(
  countryName: string,
  routeLabel: string,
  boundary: string,
): { q: string; a: string }[] {
  return [
    {
      q: `How does The Milano Seal review U.S. documents for use in ${countryName}?`,
      a: `The Matter is reviewed for document origin, execution readiness, the current authority pathway, and receiving-authority requirements before release. The public route is shown as ${routeLabel.toLowerCase()}.`,
    },
    {
      q: `Can The Milano Seal guarantee acceptance in ${countryName}?`,
      a: `No. ${boundary}`,
    },
    {
      q: `How long does processing for ${countryName} take?`,
      a: "Timing depends on the issuing authority, authentication authority, destination requirements, document type, and carrier. Any timeline shown by Milano is an estimate, not a guarantee.",
    },
    {
      q: `Can remote notarization automatically determine whether a document will be accepted in ${countryName}?`,
      a: "No. Remote notarization addresses the U.S. execution step only. Document format, authentication, translation, wet-ink, witness, and receiving-authority requirements remain Matter-specific.",
    },
  ];
}

export function buildCountryJsonLd(
  slug: string,
  compliance: CountryData,
  destination: Destination,
): CountryJsonLd {
  const pageUrl = `${SITE_URL}/apostille/${slug}`;
  const publicIntel = getPublicCountryExecutionIntelligence(
    slug,
    compliance.name,
  );
  const faqs = safeCountryFaqs(
    compliance.name,
    publicIntel.routeLabel,
    publicIntel.complianceBoundary,
  );

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    name: `${compliance.name} Document Execution & Authentication Review — The Milano Seal™`,
    description: compliance.seoFact,
    url: pageUrl,
    provider: ORGANIZATION,
    areaServed: [
      { "@type": "Country", name: compliance.name },
      {
        "@type": "State",
        name: "Florida",
        containedInPlace: { "@type": "Country", name: "United States" },
      },
    ],
    serviceType: publicIntel.routeLabel,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${compliance.name} Document Coordination`,
      itemListElement: destination.commonDocuments.map((doc, index) => ({
        "@type": "Offer",
        position: index + 1,
        name: `${doc} — ${compliance.name} execution review`,
      })),
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Countries",
        item: `${SITE_URL}/countries`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: compliance.name,
        item: pageUrl,
      },
    ],
  };

  return { service, faqPage, breadcrumb };
}


export const COUNTRY_FAQS: Record<string, { q: string; a: string }[]> =
  Object.fromEntries(
    Object.values(PUBLIC_COUNTRY_INTELLIGENCE).map((entry) => [
      entry.slug,
      safeCountryFaqs(
        entry.displayName,
        entry.routeLabel,
        entry.complianceBoundary,
      ),
    ]),
  );
