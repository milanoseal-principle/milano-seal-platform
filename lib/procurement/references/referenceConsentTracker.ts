/**
 * referenceConsentTracker — reference records with explicit consent tracking.
 * A reference may only be used in proposal output when consent is "confirmed",
 * and private contact details are never exposed on public surfaces.
 */

import type { ProcurementRecordMeta } from "@/lib/procurement/procurementSafety";
import { isReferenceUsable } from "@/lib/procurement/procurementSafety";

export type ConsentStatus =
  | "not_requested"
  | "requested"
  | "confirmed"
  | "declined"
  | "expired";

export interface ProcurementReference extends ProcurementRecordMeta {
  customer: string;
  organization: string;
  contactName: string | null;
  title: string | null;
  phone: string | null;
  email: string | null;
  servicesProvided: string[];
  matterType: string | null;
  relationshipType: string | null;
  completionDate: string | null;
  relationshipLength: string | null;
  consentStatus: ConsentStatus;
  eligibleSolicitationTypes: string[];
  /** Private contact fields never render publicly. */
  privateData: boolean;
  publicDisplayAllowed: boolean;
}

/** A reference is proposal-ready only when consent is explicitly confirmed. */
export function isReferenceReady(ref: ProcurementReference): boolean {
  return isReferenceUsable(ref.consentStatus);
}

/** Public-safe projection — strips private contact details regardless of flags. */
export function toPublicSafeReference(ref: ProcurementReference): {
  organization: string;
  servicesProvided: string[];
  matterType: string | null;
} {
  return {
    organization: ref.organization,
    servicesProvided: ref.servicesProvided,
    matterType: ref.matterType,
  };
}

/** No references are seeded — none exist with recorded consent yet. */
export const REFERENCE_REGISTRY: ProcurementReference[] = [];

export function listReadyReferences(): ProcurementReference[] {
  return REFERENCE_REGISTRY.filter(isReferenceReady);
}
