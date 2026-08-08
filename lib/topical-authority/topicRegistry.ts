/**
 * topicRegistry — the sixteen canonical authority pillars. Every public content
 * page maps to exactly one primary pillar.
 */

export interface AuthorityPillar {
  id: string;
  name: string;
  primaryRoute: string;
  /** Existing vertical/engine or data source this pillar draws on. */
  reuses: string | null;
}

export const AUTHORITY_PILLARS: AuthorityPillar[] = [
  { id: "pillar-international-execution", name: "International Document Execution", primaryRoute: "/services/international-document-execution", reuses: null },
  { id: "pillar-apostille-authentication", name: "Apostille, Authentication & Legalization", primaryRoute: "/services/apostille-coordination", reuses: null },
  { id: "pillar-ron-international", name: "Remote Online Notarization for International Use", primaryRoute: "/services/florida-remote-online-notary-international", reuses: null },
  { id: "pillar-country-intelligence", name: "Country & Destination Intelligence", primaryRoute: "/map", reuses: "atlas (data/destinations)" },
  { id: "pillar-poa-affidavits", name: "International Powers of Attorney & Affidavits", primaryRoute: "/services/international-power-of-attorney-execution", reuses: null },
  { id: "pillar-citizenship-civil", name: "Citizenship, Civil Records & Family Documents", primaryRoute: "/services/citizenship-document-execution", reuses: null },
  { id: "pillar-education-credentials", name: "Education & Professional Credentials", primaryRoute: "/services/education-credential-apostille", reuses: null },
  { id: "pillar-attorney-execution", name: "Attorney & Law Firm Document Execution", primaryRoute: "/services/attorney-document-execution", reuses: "revenue-stack legal_professional" },
  { id: "pillar-corporate-enterprise", name: "Corporate & Enterprise Document Execution", primaryRoute: "/services/corporate-international-document-execution", reuses: "revenue-stack corporate_international" },
  { id: "pillar-government-institutional", name: "Government & Institutional Document Execution", primaryRoute: "/services/government-document-execution", reuses: "procurement engine" },
  { id: "pillar-maritime-logistics", name: "Maritime, Customs & Global Logistics Execution", primaryRoute: "/services/maritime-global-logistics-document-execution", reuses: "maritime + high-value-assets" },
  { id: "pillar-airport-traveler", name: "Airport & Urgent Traveler Document Execution", primaryRoute: "/services/airport-emergency-document-execution", reuses: null },
  { id: "pillar-healthcare", name: "Healthcare Credential Document Execution", primaryRoute: "/services/healthcare-credential-document-execution", reuses: "revenue-stack healthcare_medical" },
  { id: "pillar-executive-family-office", name: "Executive & Family Office Document Execution", primaryRoute: "/services/executive-concierge-document-execution", reuses: "high-value-assets private client" },
  { id: "pillar-trust-chain", name: "Controlled Handoffs & Trust Chain Visibility", primaryRoute: "/trust-chain", reuses: "lib/trust-chain events" },
  { id: "pillar-founder", name: "The Milano Seal Founder & Operating Philosophy", primaryRoute: "/founder", reuses: null },
];

export function getPillar(id: string): AuthorityPillar | null {
  return AUTHORITY_PILLARS.find((p) => p.id === id) ?? null;
}

export const PILLAR_COUNT = AUTHORITY_PILLARS.length;
