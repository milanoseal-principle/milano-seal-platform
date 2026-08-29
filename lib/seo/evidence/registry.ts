import type { SeoEvidenceRecord } from "./types";

export const SEO_EVIDENCE: SeoEvidenceRecord[] = [
  { id: "hcch-apostille-status", authority: "HCCH", sourceUrl: "https://www.hcch.net/en/instruments/conventions/status-table/?cid=41", sourceTitle: "HCCH Apostille Convention status table", countrySlugs: ["italy", "spain", "mexico", "brazil", "portugal", "germany", "france", "switzerland", "canada"], documentSlugs: [], verifiedAt: "2026-08-29", reviewDueAt: "2027-02-28", status: "VERIFIED" },
  { id: "us-authentications", authority: "US_STATE_DEPARTMENT", sourceUrl: "https://travel.state.gov/content/travel/en/replace-certify-docs/authenticate-your-document.html", sourceTitle: "U.S. Department of State document authentication", countrySlugs: [], documentSlugs: ["fbi-background-check"], verifiedAt: "2026-08-29", reviewDueAt: "2027-02-28", status: "VERIFIED" },
  { id: "florida-apostille", authority: "FLORIDA_DOS", sourceUrl: "https://dos.fl.gov/sunbiz/other-services/apostille-notarial-certification/", sourceTitle: "Florida Apostille and Notarial Certification", countrySlugs: [], documentSlugs: [], verifiedAt: "2026-08-29", reviewDueAt: "2027-02-28", status: "VERIFIED" },
];

export const getEvidence = (id: string) => SEO_EVIDENCE.find((item) => item.id === id);
export const getEvidenceForCountry = (slug: string) => SEO_EVIDENCE.filter((item) => !item.countrySlugs.length || item.countrySlugs.includes(slug));
export const getEvidenceForCountryDocument = (country: string, document: string) => getEvidenceForCountry(country).filter((item) => !item.documentSlugs.length || item.documentSlugs.includes(document));
