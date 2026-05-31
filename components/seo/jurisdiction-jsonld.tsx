import type { JurisdictionProfile } from "@/lib/jurisdiction-data";

interface Props {
  profile: JurisdictionProfile;
}

export function JurisdictionJsonLd({ profile }: Props) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${profile.name} Document Execution Coordination`,
    description: profile.seo.description,
    provider: {
      "@type": "Organization",
      name: "The Milano Seal™",
      url: "https://themilanoseal.com",
    },
    areaServed: {
      "@type": "Country",
      name: profile.name,
    },
    serviceType:
      profile.routeType === "Hague Convention Routing"
        ? "Apostille coordination and international document execution"
        : "Consular authentication review and international document execution",
    url: `https://themilanoseal.com/jurisdictions/${profile.slug}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
}
