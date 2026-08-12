// Canonical Entity Index — single import surface for the unified operating model.
//
// This file DOES NOT fork existing schemas. Where a controlling type already
// exists (Matter, Partner Passport, Government Opportunity/Submission), the
// canonical type re-exports or references it. New minimal entity contracts are
// defined only where the repo had no single controlling shape.
//
// Rule: unknown values stay null/undefined — never fabricated defaults.

import type { CanonicalMatterObject } from "../canonicalMatter";

export type { CanonicalMatterObject } from "../canonicalMatter";
export * from "./ids";

/** Common metadata every canonical entity carries. */
export interface CanonicalEntityMeta {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  source?: string;
  sourceRecordId?: string;
  environment?: string;
  isSample?: boolean;
  dataClassification?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Matter — controlling type is CanonicalMatterObject (lib/platform/canonicalMatter.ts).
export type Matter = CanonicalMatterObject;

export interface Contact extends CanonicalEntityMeta {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  clientType?: string | null;
}

export interface Organization extends CanonicalEntityMeta {
  name?: string;
  type?: string | null;
  country?: string | null;
}

export interface DocumentEntity extends CanonicalEntityMeta {
  title?: string;
  documentFamily?: string | null;
  requiresNotarization?: boolean | null;
}

export interface Signer extends CanonicalEntityMeta {
  contactId?: string;
  location?: string | null;
}

export interface Witness extends CanonicalEntityMeta {
  contactId?: string;
}

export interface Jurisdiction extends CanonicalEntityMeta {
  name?: string;
  countryId?: string | null;
  authorityLevel?: string | null;
}

export interface Country extends CanonicalEntityMeta {
  iso?: string;
  name?: string;
  hagueStatus?: "member" | "non_member" | "unknown";
  lastVerifiedAt?: string | null;
  verificationStatus?: "verified" | "unverified" | "conflict" | "unknown";
}

export interface Quote extends CanonicalEntityMeta {
  matterId?: string;
  quotedValue?: number | null;
  lane?: string | null;
}

export interface Invoice extends CanonicalEntityMeta {
  matterId?: string;
  amountDue?: number | null;
  amountPaid?: number | null;
  balance?: number | null;
}

// Payment — read-only view of approved payment interface. NEVER a second source
// of payment truth; carries no raw Wise payload.
export interface PaymentView extends CanonicalEntityMeta {
  matterId?: string;
  status?: string; // e.g. awaiting_payment | payment_confirmed
  reference?: string | null;
}

export interface Execution extends CanonicalEntityMeta {
  matterId?: string;
  tier?: string | null;
  path?: string | null;
}

export interface Apostille extends CanonicalEntityMeta {
  matterId?: string;
  status?: string | null;
}

export interface Courier extends CanonicalEntityMeta {
  matterId?: string;
  trackingStatus?: string | null;
}

// Custody event — read-only projection of the immutable custody ledger.
export interface CustodyEventView extends CanonicalEntityMeta {
  matterId?: string;
  event?: string;
  at?: string | null;
}

export interface Partner extends CanonicalEntityMeta {
  status?: string;
  passportId?: string | null;
}

// PartnerPassport — controlling summary type lives in
// lib/alliance/intelligence/partnerPassport.ts (see canonicalPartnerPassport.ts).
export type { PartnerPassportSummary as PartnerPassport } from "../../alliance/intelligence/partnerPassport";

export interface ReferralSource extends CanonicalEntityMeta {
  label?: string;
  channel?: string | null;
}

export interface GovernmentAgency extends CanonicalEntityMeta {
  name?: string;
  department?: string | null;
}

// Government opportunity — controlling shape lives in lib/government/types.
export type { ProcurementOpportunity as GovernmentOpportunity } from "../../government/types";

// Government submission — the recorded-submission record type lives on the
// government-submissions branch (not yet on main). Minimal canonical contract
// here until that merges; then re-export the controlling type.
export interface GovernmentSubmission extends CanonicalEntityMeta {
  solicitationNumber?: string;
  issuingAgency?: string;
  submissionStatus?: "submitted"; // never "awarded"/"won"
  awardDate?: string | null;
}

export interface QARecord extends CanonicalEntityMeta {
  matterId?: string;
  complete?: boolean;
}

export interface Blocker extends CanonicalEntityMeta {
  matterId?: string;
  reason?: string;
  resolved?: boolean;
}

export interface RevenueEvent extends CanonicalEntityMeta {
  matterId?: string;
  amount?: number | null;
  kind?: "actual" | "planned" | "projection";
}

export interface PortalAccess extends CanonicalEntityMeta {
  matterId?: string;
  contactId?: string;
}

// OperatorAction — canonical shape (also used by the operator-action engine).
export interface OperatorAction extends CanonicalEntityMeta {
  matterId?: string;
  actionType?: string;
  title?: string;
  priority?: string;
  status?: string;
  route?: string | null;
  deduplicationKey?: string;
}

export interface IntelligenceNode extends CanonicalEntityMeta {
  nodeType?: string;
  label?: string;
  verifiedAt?: string | null;
  verificationStatus?: "candidate" | "review_required" | "approved" | "rejected" | "superseded";
}

export interface CaseStudy extends CanonicalEntityMeta {
  title?: string;
  matterId?: string | null;
}

export interface SOPUpdate extends CanonicalEntityMeta {
  title?: string;
  status?: "candidate" | "review_required" | "approved" | "rejected" | "superseded";
}

export interface AuditEvent extends CanonicalEntityMeta {
  entityType?: string;
  entityId?: string;
  action?: string;
}
