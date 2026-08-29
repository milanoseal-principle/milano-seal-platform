import type { SeoAudience, SeoIndexStatus, SeoPillar } from "../authority/types";
export interface CountryDocumentSeoRecord {
  countrySlug: string;
  documentSlug: string;
  documentName: string;
  primaryQuery: string;
  secondaryQueries: string[];
  audience: SeoAudience[];
  pillar: SeoPillar;
  title: string;
  description: string;
  h1: string;
  intro: string;
  commonUseCases: string[];
  executionQuestions: string[];
  receivingAuthorityQuestions: string[];
  rejectionRiskChecks: string[];
  relatedDocumentSlugs: string[];
  relatedCountrySlugs: string[];
  evidenceIds: string[];
  indexStatus: SeoIndexStatus;
}
