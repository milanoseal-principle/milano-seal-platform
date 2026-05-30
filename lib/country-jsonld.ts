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
      a: "Yes. Florida-commissioned notaries performing RON produce valid notarizations that the Florida DOS will apostille for recognition in Italy and across the European Union.",
    },
  ],
  spain: [
    {
      q: "Do I need an apostille for Spanish property transactions?",
      a: "Yes. Spain processes over 2.1 million apostilles annually — more than any other Hague member. A Florida-issued apostille is directly recognized across all 17 Spanish autonomous communities and Spanish territories.",
    },
    {
      q: "How long does apostille processing take for Spain?",
      a: "3–5 business days for notarization and Florida DOS apostille coordination through The Milano Seal™.",
    },
    {
      q: "What documents need apostille for Spain?",
      a: "Real estate contracts, birth and marriage certificates, corporate documents, affidavits, educational credentials, and immigration-related records.",
    },
    {
      q: "Is a Spanish translation required with the apostille?",
      a: "The apostille itself does not require translation, but the underlying document may require a certified Spanish translation depending on the receiving Spanish institution. The Milano Seal™ coordinates translation referrals.",
    },
  ],
  uae: [
    {
      q: "Does the UAE accept apostille documents from Florida?",
      a: "Yes — since January 2021, when the UAE acceded to the Hague Apostille Convention. Prior to 2021, full consular legalization through the US State Department and UAE Embassy was required.",
    },
    {
      q: "How long does UAE document authentication take?",
      a: "5–7 business days. Documents destined for DIFC or ADGM financial zones may require additional review steps coordinated by The Milano Seal™.",
    },
    {
      q: "What documents are commonly authenticated for the UAE?",
      a: "Entity formation documents, bank mandate letters, real estate deeds, employment contracts, and corporate resolutions for DIFC and ADGM registrations.",
    },
    {
      q: "Is the UAE part of the Hague Convention?",
      a: "Yes. The UAE acceded to the Hague Convention on Private International Law's Apostille Convention effective January 11, 2021. Both Dubai's DIFC and Abu Dhabi's ADGM now formally recognize Hague apostilles.",
    },
  ],
  brazil: [
    {
      q: "Does Brazil accept Florida apostille documents?",
      a: "Yes. Brazil joined the Hague Convention in August 2016. Documents previously requiring full consular legalization now move directly into Brazil's CNJ federal registry via Florida apostille — cutting processing from weeks to days.",
    },
    {
      q: "How long does apostille processing take for Brazil?",
      a: "5–7 business days through The Milano Seal™. Portuguese translation is required by most Brazilian receiving institutions.",
    },
    {
      q: "What documents are commonly apostilled for Brazil?",
      a: "Property deeds, CPF registration documents, corporate filings, inheritance records, powers of attorney, and Cartório-bound notarial acts.",
    },
    {
      q: "Is Portuguese translation required for apostilled documents going to Brazil?",
      a: "Yes, in most cases. While the apostille certificate itself is accepted, the underlying document must be translated into Portuguese by a certified translator for Brazilian legal and registry proceedings.",
    },
  ],
  mexico: [
    {
      q: "Does Mexico accept apostille documents?",
      a: "Mexico has been a Hague Convention member since 1995. However, documents must align with Mexico's Notario Público system — Florida's RON certification is formally recognized as its functional equivalent for cross-border execution.",
    },
    {
      q: "How long does apostille processing take for Mexico?",
      a: "3–5 business days for Hague-eligible documents. Non-Hague pathways through the Mexican Consulate add 5–10 additional business days.",
    },
    {
      q: "What documents need apostille for Mexico?",
      a: "Property escrituras, business powers of attorney, corporate resolutions, vital records, and immigration-related affidavits.",
    },
    {
      q: "Do I need Mexican Consulate legalization for documents going to Mexico?",
      a: "For most standard documents, the Hague apostille route through Florida DOS is sufficient since Mexico acceded in 1995. Consular legalization is only required for specific document categories outside the Hague framework.",
    },
  ],
  portugal: [
    {
      q: "Does Portugal accept Florida apostille documents?",
      a: "Yes. Portugal has been a member of the Hague Apostille Convention since 1968 — one of the original signatories. Portugal also serves as the apostille gateway for Lusophone jurisdictions including Brazil, Angola, and Mozambique.",
    },
    {
      q: "How long does apostille processing take for Portugal?",
      a: "3–5 business days for notarization and Florida DOS apostille coordination through The Milano Seal™.",
    },
    {
      q: "What documents need apostille for Portugal?",
      a: "Residence permit documentation, powers of attorney, property deeds, vital records, and documents for NHR (Non-Habitual Resident) tax status applications.",
    },
    {
      q: "Can an apostilled document from Florida be used across other Lusophone countries?",
      a: "Portugal-bound apostilles are specifically authenticated for Portuguese jurisdiction. Brazil, being a separate Hague member since 2016, has its own direct Florida apostille pathway. The Milano Seal™ can coordinate authentication for any Lusophone destination.",
    },
  ],
  greece: [
    {
      q: "Does Greece accept apostille for citizenship restoration documents?",
      a: "Yes. Greece has been a Hague Convention member since 1985. The Hellenic Ministry of Interior requires apostilled documents from Florida for Greek citizenship restoration (citizenship by descent), property inheritance, and registry filings.",
    },
    {
      q: "How long does apostille processing take for Greece?",
      a: "5–7 business days through The Milano Seal™. Translation into Greek is required by most Hellenic registry and court authorities.",
    },
    {
      q: "What documents are commonly apostilled for Greece?",
      a: "Greek citizenship restoration documents, birth and marriage certificates, inheritance and estate records, powers of attorney, maritime corporate filings, and property deeds.",
    },
    {
      q: "Is a Greek translation required with the apostille?",
      a: "Yes, for most official proceedings. The Hellenic Ministry of Interior and Greek courts require certified translations of apostilled documents. The Milano Seal™ coordinates certified translation referrals as part of the execution sequence.",
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
  const pageUrl = `${SITE_URL}/countries/${slug}`;
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
      { "@type": "State",   name: "Florida", containedInPlace: { "@type": "Country", name: "United States" } },
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
      { "@type": "ListItem", position: 1, name: "Home",         item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Countries",    item: `${SITE_URL}/countries` },
      { "@type": "ListItem", position: 3, name: compliance.name, item: pageUrl },
    ],
  };

  return { service, faqPage: faqPage ?? {}, breadcrumb };
}

export { COUNTRY_FAQS };
