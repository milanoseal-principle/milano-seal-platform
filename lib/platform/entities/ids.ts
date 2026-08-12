// Canonical entity ID types. Branded string aliases so IDs of different
// entities are not accidentally interchanged at the type level.

export type MatterId = string & { readonly __brand?: "MatterId" };
export type ContactId = string & { readonly __brand?: "ContactId" };
export type OrganizationId = string & { readonly __brand?: "OrganizationId" };
export type DocumentId = string & { readonly __brand?: "DocumentId" };
export type SignerId = string & { readonly __brand?: "SignerId" };
export type WitnessId = string & { readonly __brand?: "WitnessId" };
export type JurisdictionId = string & { readonly __brand?: "JurisdictionId" };
export type CountryId = string & { readonly __brand?: "CountryId" };
export type QuoteId = string & { readonly __brand?: "QuoteId" };
export type InvoiceId = string & { readonly __brand?: "InvoiceId" };
export type PaymentId = string & { readonly __brand?: "PaymentId" };
export type PartnerId = string & { readonly __brand?: "PartnerId" };
export type GovernmentAgencyId = string & { readonly __brand?: "GovernmentAgencyId" };
export type GovernmentOpportunityId = string & { readonly __brand?: "GovernmentOpportunityId" };
export type RevenueEventId = string & { readonly __brand?: "RevenueEventId" };
export type OperatorActionId = string & { readonly __brand?: "OperatorActionId" };
export type IntelligenceNodeId = string & { readonly __brand?: "IntelligenceNodeId" };
export type CaseStudyId = string & { readonly __brand?: "CaseStudyId" };
export type AuditEventId = string & { readonly __brand?: "AuditEventId" };

// Deterministic id composer (no randomness — safe for SSR and tests).
export function composeId(prefix: string, key: string | number): string {
  return `${prefix}_${String(key)}`;
}
