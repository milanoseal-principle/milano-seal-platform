import type { CountryDocumentSeoRecord } from "../country-document/types";
export function buildCountryDocumentSeoSchema(record: CountryDocumentSeoRecord, countryName: string, canonical: string) {
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", "@id": `${canonical}#webpage`, url: canonical, name: record.title, description: record.description, isPartOf: { "@id": `https://www.themilanoseal.com/apostille/${record.countrySlug}#webpage` }, about: [{ "@type": "Country", name: countryName }, { "@type": "Thing", name: record.documentName }] },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://www.themilanoseal.com" }, { "@type": "ListItem", position: 2, name: countryName, item: `https://www.themilanoseal.com/apostille/${record.countrySlug}` }, { "@type": "ListItem", position: 3, name: record.documentName, item: canonical }] },
    { "@type": "Service", name: `U.S. ${record.documentName} execution coordination for ${countryName}`, provider: { "@id": "https://www.themilanoseal.com/#business" }, areaServed: { "@type": "Country", name: countryName }, serviceType: "Secure International Document Execution and Authentication Coordination" },
  ] };
}
