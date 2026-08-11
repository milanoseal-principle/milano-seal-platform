/**
 * Topical Authority — types. A canonical topic architecture that MAPS existing
 * content (service pages, country pages via Atlas, documents, guides) to pillars.
 * It reuses Atlas/country data and existing SEO utilities; it never duplicates
 * country/service/FAQ registries, schema, metadata, or sitemap logic.
 */

export type ContentType =
  | "pillar"
  | "service"
  | "destination"
  | "document"
  | "client"
  | "institution"
  | "industry"
  | "guide"
  | "glossary"
  | "faq"
  | "case_study"
  | "founder_insight"
  | "comparison"
  | "checklist"
  | "resource"
  | "capability"
  | "intake_landing";

export type SearchIntent =
  | "informational"
  | "commercial_investigation"
  | "transactional"
  | "navigational"
  | "institutional"
  | "professional_referral"
  | "urgent"
  | "local"
  | "destination_specific"
  | "document_specific";

export interface TopicRecord {
  id: string;
  slug: string;
  name: string;
  pillarId: string;
  contentType: ContentType;
  searchIntent: SearchIntent;
  primaryRoute: string;
  internalLinkTargets: string[];
  /** Canonical source of the underlying facts (e.g. "atlas" for country data). */
  canonicalSource: string;
  status: "planned" | "published" | "update_due" | "consolidated" | "deprecated";
}
