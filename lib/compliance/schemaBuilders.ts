import type { CountryComplianceProfile } from "./countries";
import type { DocumentTaxonomyItem } from "./documents";

export function buildCountryPageSchema(country: CountryComplianceProfile, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": country.seoTitle,
    "description": country.seoDescription,
    "url": url,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.themilanoseal.com" },
        { "@type": "ListItem", "position": 2, "name": "Apostille", "item": "https://www.themilanoseal.com/apostille" },
        { "@type": "ListItem", "position": 3, "name": country.name, "item": url },
      ],
    },
    "mainEntity": country.faqs.length > 0 ? {
      "@type": "FAQPage",
      "mainEntity": country.faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": { "@type": "Answer", "text": faq.a },
      })),
    } : undefined,
  };
}

export function buildDocumentPageSchema(document: DocumentTaxonomyItem, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": document.seoTitle,
    "description": document.seoDescription,
    "url": url,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.themilanoseal.com" },
        { "@type": "ListItem", "position": 2, "name": "Documents", "item": "https://www.themilanoseal.com/documents" },
        { "@type": "ListItem", "position": 3, "name": document.name, "item": url },
      ],
    },
    "mainEntity": document.faqs.length > 0 ? {
      "@type": "FAQPage",
      "mainEntity": document.faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": { "@type": "Answer", "text": faq.a },
      })),
    } : undefined,
  };
}
