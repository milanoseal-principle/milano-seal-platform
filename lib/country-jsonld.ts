import type { CountryData } from "@/components/landing/country-compliance-card";
import type { Destination } from "@/data/destinations";

const SITE_URL = "https://themilanoseal.com";

const ORGANIZATION = {
  "@type": "LegalService",
  name: "The Milano Seal™",
  url: SITE_URL,
  logo: `${SITE_URL}/milano-seal-gold-transparent-512.png`,
  telephone: "",
  address: {
    "@type": "PostalAddress",
    addressRegion: "FL",
    addressCountry: "US",
  },
  sameAs: [`${SITE_URL}`],
};

// Per-country FAQ content — grounded in Hague Convention facts
const COUNTRY_FAQS: Record<string, { q: string; a: string }[]> = {
  italy: [
    {
      q: "Do I need an apostille to send documents to Italy?",
      a: "Yes. Italy has been a member of the Hague Apostille Convention since 1978. A Florida-issued apostille from the Florida Department of State is recognized directly across all 27 EU member states, including Italy — no consular chain required.",
    },
    {
      q: "How long does apostille processing take for Italy?",
      a: "Standard processing through The Milano Seal™ takes 3–5 business days, including notarization and Florida Department of State apostille coordination.",
    },
    {
      q: "What documents commonly require apostille for Italy?",
      a: "Powers of attorney, Italian citizenship restoration documents, affidavits, corporate resolutions, marriage certificates, and vital records are the most frequently authenticated documents for Italy.",
    },
    {
      q: "Can Remote Online Notarization (RON) be used for documents going to Italy?",
      a: "Florida RON may be available for an eligible notarial act, but the receiving Italian authority controls whether the resulting document format is acceptable. The Milano Seal™ verifies receiving-authority, wet-ink, witness, translation, and apostille requirements before release.",
    },
  ],
  spain: [
    {
      q: "Do I need an apostille for Spanish property transactions?",
      a: "Spain is a Contracting Party to the Hague Apostille Convention. Whether a specific property document follows the apostille route depends on the document origin, document type, competent authority, and the Spanish receiving authority.",
    },
    {
      q: "How long does apostille processing take for Spain?",
      a: "3–5 business days for notarization and Florida DOS apostille coordination through The Milano Seal™.",
    },
    {
      q: "What documents need apostille for Spain?",
      a: "Real estate contracts, birth and marriage certificates, corporate documents, affidavits, educational credentials, and immigration-related records may require authentication depending on their origin and receiving authority.",
    },
    {
      q: "Is a Spanish translation required with the apostille?",
      a: "The apostille itself does not require translation, but the underlying document may require a certified Spanish translation depending on the receiving Spanish institution. The Milano Seal™ coordinates translation referrals.",
    },
  ],
  uae: [
    {
      q: "What pathway applies to Florida documents intended for the UAE?",
      a: "The pathway requires verification against the document type and receiving authority. The Milano Seal confirms whether apostille, attestation, translation, or additional authority review applies before release.",
    },
    {
      q: "How long does UAE document authentication take?",
      a: "Timing depends on the document route and receiving authority. Documents destined for DIFC or ADGM financial zones may require additional review steps coordinated by The Milano Seal™.",
    },
    {
      q: "What documents are commonly authenticated for the UAE?",
      a: "Entity formation documents, bank mandate letters, real estate deeds, employment contracts, and corporate resolutions for DIFC and ADGM registrations.",
    },
    {
      q: "Does every UAE receiving authority use the same authentication pathway?",
      a: "No. Requirements can vary by document type, emirate, free zone, and receiving authority. UAE matters remain verification-required until the current pathway is confirmed.",
    },
  ],
  brazil: [
    {
      q: "Does Brazil accept Florida apostille documents?",
      a: "Brazil is a Contracting Party to the Hague Apostille Convention. A Florida apostille can be part of the route for eligible Florida-origin documents, subject to document-specific and receiving-authority requirements.",
    },
    {
      q: "How long does apostille processing take for Brazil?",
      a: "Timing depends on the document route and receiving authority. Portuguese translation review may be required by the receiving authority.",
    },
    {
      q: "What documents are commonly apostilled for Brazil?",
      a: "Property deeds, CPF-related records, corporate filings, inheritance records, powers of attorney, and Cartório-bound notarial acts may require authentication depending on their origin and use.",
    },
    {
      q: "May Portuguese translation be required for apostilled documents going to Brazil?",
      a: "Translation review may be required depending on the document type and receiving Brazilian authority. Requirements are confirmed before international release.",
    },
  ],
  mexico: [
    {
      q: "Does Mexico accept apostille documents?",
      a: "Mexico is a Contracting Party to the Hague Apostille Convention, which entered into force for Mexico on August 14, 1995. Whether a specific document follows the apostille route depends on its origin, document type, competent authority, territorial scope, and the actual Mexican receiving authority.",
    },
    {
      q: "Can Florida Remote Online Notarization be used for documents going to Mexico?",
      a: "Florida RON is not treated as a universal substitute for Mexican notarial formalities. RON eligibility and foreign usability must be reviewed against the required notarial act, wet-ink or witness requirements, document format, and the receiving authority before execution and release.",
    },
    {
      q: "What documents may require apostille for Mexico?",
      a: "Powers of attorney, corporate records, vital records, property-related documents, and affidavits may require authentication depending on the document origin and the institution that will receive them.",
    },
    {
      q: "Do I automatically need Mexican Consulate legalization for documents going to Mexico?",
      a: "No. Mexico has an operative Hague Apostille Convention route, so consular legalization is not the default for eligible public documents within the Convention framework. Any exception or additional legalization requirement must be verified for the specific document and receiving authority.",
    },
  ],
  portugal: [
    {
      q: "Does Portugal accept Florida apostille documents?",
      a: "Portugal is a Contracting Party to the Hague Apostille Convention. Eligible Florida-origin documents may follow the Florida apostille route, subject to the document type and receiving authority.",
    },
    {
      q: "How long does apostille processing take for Portugal?",
      a: "3–5 business days for notarization and Florida DOS apostille coordination through The Milano Seal™.",
    },
    {
      q: "What documents need apostille for Portugal?",
      a: "Residence permit documentation, powers of attorney, property deeds, vital records, and other official-use documents may require authentication depending on origin and receiving authority.",
    },
    {
      q: "Can an apostilled document from Florida be used across other Lusophone countries?",
      a: "No cross-country assumption should be made. Each destination has its own treaty status, competent authority, document requirements, and receiving-authority rules. The Milano Seal™ verifies the route separately for each destination.",
    },
  ],
  greece: [
    {
      q: "Does Greece accept apostille for citizenship restoration documents?",
      a: "Greece is a Contracting Party to the Hague Apostille Convention. Citizenship, property, succession, and registry matters may require apostilled source documents depending on document origin and the receiving Greek authority.",
    },
    {
      q: "How long does apostille processing take for Greece?",
      a: "Timing depends on the document route and receiving authority. Greek translation may also be required by the receiving authority.",
    },
    {
      q: "What documents are commonly apostilled for Greece?",
      a: "Citizenship documents, birth and marriage certificates, inheritance and estate records, powers of attorney, maritime corporate filings, and property records may require authentication depending on use.",
    },
    {
      q: "Is a Greek translation required with the apostille?",
      a: "Translation requirements depend on the receiving authority and document use. The Milano Seal™ coordinates certified translation referrals when required as part of the execution sequence.",
    },
  ],
};

export interface CountryJsonLd {
  service: object;
  faqPage: object;
  breadcrumb: object;
}

export function buildCountryJsonLd(
  slug: string,
  compliance: CountryData,
  destination: Destination
): CountryJsonLd {
  const pageUrl = `${SITE_URL}/apostille/${slug}`;
  const faqs = COUNTRY_FAQS[slug] ?? [];

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    name: `${compliance.name} Apostille & Document Authentication — The Milano Seal™`,
    description: compliance.seoFact,
    url: pageUrl,
    provider: ORGANIZATION,
    areaServed: [
      { "@type": "Country", name: compliance.name },
      { "@type": "State", name: "Florida", containedInPlace: { "@type": "Country", name: "United States" } },
    ],
    serviceType: destination.hague
      ? "Hague Convention Apostille · Florida Notarization · International Document Authentication"
      : "Consular Authentication · Florida Notarization · International Document Authentication",
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/intake?country=${encodeURIComponent(compliance.name)}`,
      availability: "https://schema.org/InStock",
      priceCurrency: "USD",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${compliance.name} Document Services`,
      itemListElement: destination.commonDocuments.map((doc, i) => ({
        "@type": "Offer",
        position: i + 1,
        name: `${doc} — ${compliance.name} Authentication`,
      })),
    },
  };

  const faqPage = faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: faqs.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }
    : null;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Countries", item: `${SITE_URL}/countries` },
      { "@type": "ListItem", position: 3, name: compliance.name, item: pageUrl },
    ],
  };

  return { service, faqPage: faqPage ?? {}, breadcrumb };
}

export { COUNTRY_FAQS };
