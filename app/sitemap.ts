import { MetadataRoute } from "next";
import { countries, documents } from "@/lib/seo-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.themilanoseal.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/intake`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/founder`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Apostille country pages
  const apostillePages: MetadataRoute.Sitemap = countries.map((country) => ({
    url: `${baseUrl}/apostille/${country.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Service pages
  const servicePages: MetadataRoute.Sitemap = documents.map((doc) => ({
    url: `${baseUrl}/services/${doc.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Document + country combination pages (limited for sitemap size)
  const documentCountryPages: MetadataRoute.Sitemap = [];
  for (const doc of documents.slice(0, 10)) {
    for (const country of countries.slice(0, 20)) {
      documentCountryPages.push({
        url: `${baseUrl}/documents/${doc.slug}/${country.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    }
  }

  // Vertical service pages
  const verticalServicePages: MetadataRoute.Sitemap = [
    "/services/yacht-document-apostille",
    "/services/equine-document-apostille",
    "/services/medical-document-apostille",
    "/services/regenerative-medicine-document-support",
    "/services/gem-diamond-document-apostille",
    "/services/luxury-asset-document-apostille",
    "/services/private-client-apostille",
    "/services/hnwi-document-execution",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  // Local SEO pages
  const localPages: MetadataRoute.Sitemap = [
    "/florida/apostille-services",
    "/tampa/apostille-services",
    "/st-petersburg/apostille-services",
    "/clearwater/apostille-services",
    "/sarasota/apostille-services",
    "/bradenton/apostille-services",
    "/florida/international-notary",
    "/largo/apostille-services",
    "/palm-harbor/apostille-services",
    "/dunedin/apostille-services",
    "/oldsmar/apostille-services",
    "/westchase/apostille-services",
    "/brandon/apostille-services",
    "/new-port-richey/apostille-services",
    "/trinity/apostille-services",
    "/wesley-chapel/apostille-services",
    "/land-o-lakes/apostille-services",
    "/lakewood-ranch/apostille-services",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  // Guide pages
  const guidePages: MetadataRoute.Sitemap = [
    "/guides/what-is-an-apostille",
    "/guides/apostille-vs-legalization",
    "/guides/notarized-document-for-use-abroad",
    "/guides/remote-online-notary-international-documents",
    "/guides/document-origin-vs-destination-country",
    "/guides/how-to-prepare-documents-for-use-abroad",
    "/guides/florida-apostille-timeline",
    "/guides/power-of-attorney-for-use-abroad",
    "/guides/apostille-for-italian-citizenship-documents",
    "/guides/apostille-for-vital-records",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Country pages
  const countryPages: MetadataRoute.Sitemap = [
    "/countries/italy",
    "/countries/spain",
    "/countries/portugal",
    "/countries/greece",
    "/countries/uae",
    "/countries/france",
    "/countries/germany",
    "/countries/brazil",
    "/countries/mexico",
    "/countries/canada",
    "/countries/united-kingdom",
    "/countries/australia",
    "/countries/ireland",
    "/countries/india",
    "/countries/japan",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Additional service pages
  const newServicePages: MetadataRoute.Sitemap = [
    "/services/power-of-attorney",
    "/services/affidavits",
    "/services/vital-records",
    "/services/corporate-documents",
    "/services/courier-tracking",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [
    ...staticPages,
    ...apostillePages,
    ...servicePages,
    ...documentCountryPages,
    ...verticalServicePages,
    ...localPages,
    ...guidePages,
    ...countryPages,
    ...newServicePages,
    {
      url: `${baseUrl}/international-affidavit`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/affidavit-name-discrepancy`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/power-of-attorney-international`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
  ];
}
