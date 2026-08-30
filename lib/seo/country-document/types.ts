import type { Destination } from "@/data/destinations";
import type { DocumentTaxonomyItem } from "@/lib/compliance/documents";
import type {
  ProgrammaticPage,
} from "@/lib/topical-authority/programmatic/pageEligibility";
import type { TopicRecord } from "@/lib/topical-authority/types";

export interface CountryDocumentEditorialContent {
  title: string;
  description: string;
  h1: string;
  intro: string;
  commonUseCases: string[];
  executionQuestions: string[];
  receivingAuthorityQuestions: string[];
  rejectionRiskChecks: string[];
}

/**
 * A governed editorial candidate. Destination and document facts are references
 * to canonical records, never copied country/document authority.
 */
export interface CountryDocumentSeoRecord {
  id: string;
  countrySlug: string;
  documentSlug: string;
  canonicalDocumentSlug: string;
  destination: Destination;
  document: DocumentTaxonomyItem;
  topic: TopicRecord;
  page: ProgrammaticPage;
  primaryQuery: string;
  secondaryQueries: string[];
  content: CountryDocumentEditorialContent;
  relatedDocumentSlugs: string[];
  sourceCandidates: string[];
}
