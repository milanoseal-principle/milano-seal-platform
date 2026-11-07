import { COUNSEL_CORRIDORS, COUNSEL_USE_CASES } from "@/lib/counsel/content";
import type { MetadataRoute } from "next";

const BASE_URL = "https://www.themilanoseal.com";

type SitemapEntry = {
  path: string;
  priority?: number;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
};

const corePages: SitemapEntry[] = [
  { path: "/counsel", priority: 0.9 },
  { path: "/counsel/corridors", priority: 0.8 },
  { path: "/counsel/use-cases", priority: 0.8 },
  ...COUNSEL_USE_CASES.map((item) => ({
    path: `/counsel/use-cases/${item.slug}`,
    priority: 0.75,
  })),
  ...COUNSEL_CORRIDORS.map((slug) => ({
    path: `/professional/${slug}`,
    priority: 0.8,
  })),
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/intake", priority: 0.95, changeFrequency: "weekly" },
  // Client portal is authenticated and noindex; intentionally excluded here.
  { path: "/map", priority: 0.85, changeFrequency: "monthly" },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" },
  { path: "/countries", priority: 0.85, changeFrequency: "monthly" },
  {
    path: "/international-affidavits",
    priority: 0.86,
    changeFrequency: "monthly",
  },
  {
    path: "/international-affidavit",
    priority: 0.84,
    changeFrequency: "monthly",
  },
  {
    path: "/power-of-attorney-international",
    priority: 0.84,
    changeFrequency: "monthly",
  },
  {
    path: "/affidavit-name-discrepancy",
    priority: 0.82,
    changeFrequency: "monthly",
  },
  {
    path: "/affidavit-one-and-the-same",
    priority: 0.82,
    changeFrequency: "monthly",
  },
  {
    path: "/affidavit-non-existence-record",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/affidavit-translation-accuracy",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  // /documents and /guides do not have index pages; individual slugs are listed below
];

const servicePages: SitemapEntry[] = [
  { path: "/services/apostille", priority: 0.9, changeFrequency: "monthly" },
  {
    path: "/services/remote-online-notary",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/services/remote-online-notarization",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/services/embassy-consular-legalization",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/services/international-affidavit-execution",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/services/international-passport-document-execution",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/services/power-of-attorney-for-use-abroad",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/services/mobile-notary",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/services/florida-apostille-courier",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/services/immigration-documents",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/services/international-execution",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/services/yacht-document-apostille",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/services/equine-document-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/services/medical-document-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/services/regenerative-medicine-document-support",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/services/gem-diamond-document-apostille",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/services/luxury-asset-document-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/services/private-client-apostille",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/services/hnwi-document-execution",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/services/international-notary",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/services/power-of-attorney",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  { path: "/services/affidavits", priority: 0.8, changeFrequency: "monthly" },
  {
    path: "/services/vital-records",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/services/corporate-documents",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  { path: "/trust", priority: 0.8, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.85, changeFrequency: "monthly" },
  { path: "/apostille/us", priority: 0.85, changeFrequency: "monthly" },
  {
    path: "/services/courier-tracking",
    priority: 0.8,
    changeFrequency: "monthly",
  },
];

const documentPages: SitemapEntry[] = [
  {
    path: "/documents/power-of-attorney-apostille",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/affidavit-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/birth-certificate-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/marriage-certificate-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/divorce-decree-apostille",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/corporate-resolution-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/articles-of-incorporation-apostille",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/school-transcript-apostille",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/fbi-background-check-apostille",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/real-estate-documents-apostille",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/yacht-bill-of-sale-apostille",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/vessel-registration-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/yacht-power-of-attorney-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/vessel-ownership-affidavit-apostille",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/equine-bill-of-sale-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/horse-ownership-transfer-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/equine-export-documents-apostille",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/equine-power-of-attorney-apostille",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/medical-consent-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/healthcare-power-of-attorney-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/medical-records-authorization-apostille",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/treatment-authorization-apostille",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/diamond-ownership-affidavit-apostille",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/gemstone-certificate-of-origin-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/jewelry-appraisal-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/luxury-asset-bill-of-sale-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/custody-transfer-affidavit-apostille",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/international-power-of-attorney-apostille",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/private-asset-transfer-affidavit-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/family-office-authorization-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/trust-affidavit-apostille",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/documents/international-banking-support-documents-apostille",
    priority: 0.8,
    changeFrequency: "monthly",
  },
];

const guidePages: SitemapEntry[] = [
  {
    path: "/guides/what-is-an-apostille",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/apostille-vs-legalization",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/notarized-document-for-use-abroad",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/remote-online-notary-international-documents",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/document-origin-vs-destination-country",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/how-to-prepare-documents-for-use-abroad",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/florida-apostille-timeline",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/power-of-attorney-for-use-abroad",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/apostille-for-italian-citizenship-documents",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/apostille-for-vital-records",
    priority: 0.75,
    changeFrequency: "monthly",
  },
];

const localPages: SitemapEntry[] = [
  {
    path: "/florida/apostille-services",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/florida/international-notary",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/tampa/apostille-services",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/st-petersburg/apostille-services",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/clearwater/apostille-services",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/largo/apostille-services",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    path: "/palm-harbor/apostille-services",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    path: "/dunedin/apostille-services",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    path: "/oldsmar/apostille-services",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/westchase/apostille-services",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/brandon/apostille-services",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/new-port-richey/apostille-services",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/trinity/apostille-services",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/wesley-chapel/apostille-services",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/land-o-lakes/apostille-services",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/sarasota/apostille-services",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/bradenton/apostille-services",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    path: "/lakewood-ranch/apostille-services",
    priority: 0.75,
    changeFrequency: "monthly",
  },
];

const countryPages: SitemapEntry[] = [
  { path: "/countries/italy", priority: 0.9, changeFrequency: "monthly" },
  { path: "/countries/spain", priority: 0.85, changeFrequency: "monthly" },
  { path: "/countries/portugal", priority: 0.85, changeFrequency: "monthly" },
  { path: "/countries/greece", priority: 0.8, changeFrequency: "monthly" },
  { path: "/countries/uae", priority: 0.85, changeFrequency: "monthly" },
  { path: "/countries/france", priority: 0.8, changeFrequency: "monthly" },
  { path: "/countries/germany", priority: 0.8, changeFrequency: "monthly" },
  { path: "/countries/brazil", priority: 0.8, changeFrequency: "monthly" },
  { path: "/countries/mexico", priority: 0.8, changeFrequency: "monthly" },
  { path: "/countries/argentina", priority: 0.75, changeFrequency: "monthly" },
  { path: "/countries/colombia", priority: 0.75, changeFrequency: "monthly" },
  { path: "/countries/chile", priority: 0.75, changeFrequency: "monthly" },
  { path: "/countries/canada", priority: 0.8, changeFrequency: "monthly" },
  {
    path: "/countries/united-kingdom",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  { path: "/countries/australia", priority: 0.8, changeFrequency: "monthly" },
  { path: "/countries/ireland", priority: 0.75, changeFrequency: "monthly" },
  {
    path: "/countries/netherlands",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    path: "/countries/switzerland",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  { path: "/countries/austria", priority: 0.7, changeFrequency: "monthly" },
  { path: "/countries/belgium", priority: 0.7, changeFrequency: "monthly" },
  { path: "/countries/india", priority: 0.75, changeFrequency: "monthly" },
  { path: "/countries/japan", priority: 0.75, changeFrequency: "monthly" },
  { path: "/countries/south-korea", priority: 0.7, changeFrequency: "monthly" },
  { path: "/countries/china", priority: 0.75, changeFrequency: "monthly" },
  {
    path: "/countries/south-africa",
    priority: 0.7,
    changeFrequency: "monthly",
  },
];

const allPublicPages: SitemapEntry[] = [
  ...corePages,
  ...servicePages,
  ...documentPages,
  ...guidePages,
  ...localPages,
  ...countryPages,
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const uniquePages = Array.from(
    new Map(allPublicPages.map((entry) => [entry.path, entry])).values(),
  );

  return uniquePages.map((entry) => ({
    url: `${BASE_URL}${entry.path}`,
    lastModified,
    changeFrequency: entry.changeFrequency ?? "monthly",
    priority: entry.priority ?? 0.7,
  }));
}
