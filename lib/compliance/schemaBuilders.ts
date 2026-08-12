import type { CountryComplianceProfile } from "./countries";
import type { DocumentTaxonomyItem } from "./documents";
import type { PremiumCorridorProfile } from "@/lib/seo-premium-corridors";

export function buildCountryPageSchema(
  country: CountryComplianceProfile,
  url: string,
  premiumCorridor?: PremiumCorridorProfile | null,
) {
  const serviceName =
    country.hagueMember === "member"
      ? `U.S. Apostille & Document Execution for ${country.name}`
      : `U.S. Document Authentication for ${country.name}`;

  const service = {
    "@type": "Service",
    "name": serviceName,
    "serviceType": "U.S. document execution, apostille and authentication coordination",
    "provider": {
      "@type": "Organization",
      "name": "The Milano Seal™",
      "url": "https://www.themilanoseal.com",
    },
    "areaServed": {
      "@type": "Country",
      "name": country.name,
    },
    "audience": premiumCorridor
      ? {
          "@type": "Audience",
          "audienceType":
            "Attorneys, professional advisors, private clients, and cross-border matter coordinators",
        }
      : undefined,
    "description": premiumCorridor?.positioning ?? country.seoDescription,
    "url": url,
  };

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": premiumCorridor ? serviceName : country.seoTitle,
    "description": premiumCorridor?.positioning ?? country.seoDescription,
    "url": url,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.themilanoseal.com",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Apostille",
          "item": "https://www.themilanoseal.com/apostille",
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": country.name,
          "item": url,
        },
      ],
    },
    "mainEntity": service,
    "hasPart": country.faqs.length
      ? {
          "@type": "FAQPage",
          "mainEntity": country.faqs.map((faq) => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.a,
            },
          })),
        }
      : undefined,
  };
}

export function buildDocumentPageSchema(
  document: DocumentTaxonomyItem,
  url: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": document.seoTitle,
    "description": document.seoDescription,
    "url": url,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.themilanoseal.com",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Documents",
          "item": "https://www.themilanoseal.com/documents",
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": document.name,
          "item": url,
        },
      ],
    },
    "mainEntity": document.faqs.length
      ? {
          "@type": "FAQPage",
          "mainEntity": document.faqs.map((faq) => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.a,
            },
          })),
        }
      : undefined,
  };
}
