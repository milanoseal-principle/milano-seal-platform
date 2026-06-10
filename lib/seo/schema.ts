const BASE_URL = "https://www.themilanoseal.com";
const ORG_NAME = "The Milano Seal™";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: ORG_NAME,
    url: BASE_URL,
    description:
      "Premium international document execution support for apostille coordination, notarization, secure intake, matter tracking, and document release.",
    areaServed: ["Florida", "United States", "International"],
    serviceType: [
      "International Notary Coordination",
      "Apostille Coordination",
      "Remote Online Notarization",
      "Mobile Notary",
      "Document Execution Support",
      "Courier and Chain-of-Custody Tracking",
    ],
    sameAs: [],
  };
}

export function serviceSchema(
  name: string,
  description: string,
  url: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: `${BASE_URL}${url}`,
    provider: {
      "@type": "ProfessionalService",
      name: ORG_NAME,
      url: BASE_URL,
    },
    areaServed: "International",
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: ORG_NAME,
    url: BASE_URL,
    description:
      "Florida-based international document execution support. Apostille coordination, notary coordination, secure intake, and courier tracking for documents used abroad.",
    areaServed: [
      "Tampa",
      "St. Petersburg",
      "Clearwater",
      "Largo",
      "Palm Harbor",
      "Dunedin",
      "Sarasota",
      "Bradenton",
      "Tampa Bay",
      "Florida",
    ],
    serviceType: "International Notary and Apostille Coordination",
    priceRange: "$$",
  };
}
