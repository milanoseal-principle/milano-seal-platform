export type SeoIntent = "transactional" | "professional" | "country" | "document" | "informational" | "local" | "brand";
export type SeoAudience = "international_attorney" | "law_firm" | "professional_advisor" | "private_client" | "business" | "citizenship_professional";
export type SeoPillar = "apostille_authentication" | "international_document_execution" | "power_of_attorney" | "affidavits" | "vital_records" | "corporate_documents" | "international_professionals" | "country_intelligence" | "florida_execution" | "chain_of_custody";
export type SeoIndexStatus = "DRAFT" | "REVIEW_REQUIRED" | "INDEXABLE" | "NOINDEX" | "RETIRED";

export interface SeoAuthorityNode {
  id: string;
  path: string;
  intent: SeoIntent;
  pillar: SeoPillar;
  audience: SeoAudience[];
  primaryQuery: string;
  secondaryQueries: string[];
  countrySlug?: string;
  documentSlug?: string;
  language: string;
  canonicalParent?: string;
  supportingPages: string[];
  conversionTarget: string;
  status: SeoIndexStatus;
  uniqueTitle: string;
  uniqueDescription: string;
  h1: string;
  priority: number;
}
