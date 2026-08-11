/**
 * Maritime matter types — a REFERENCE extension of the canonical Matter, not a
 * second matter object. Maritime-specific operational fields are all optional
 * and reference canonical entities by id; unknown values remain null.
 */

export type MaritimeUrgencyLevel =
  | "standard"
  | "priority"
  | "urgent"
  | "critical_shipment"
  | "executive_response"
  | "manual_review";

export type MaritimeDeadlineType =
  | "signer_deadline"
  | "courier_cutoff"
  | "filing_deadline"
  | "customs_document_deadline"
  | "sailing_deadline"
  | "vessel_arrival"
  | "vessel_departure"
  | "banking_deadline"
  | "legal_deadline"
  | "contractual_deadline"
  | "unknown";

/** Optional maritime overlay carried alongside a canonical Matter by matterId. */
export interface MaritimeMatterOverlay {
  matterId: string;
  organizationId?: string | null;
  primaryContactId?: string | null;
  commercialAccountId?: string | null;
  urgencyLevel?: MaritimeUrgencyLevel;
  shipmentReference?: string | null;
  bookingReference?: string | null;
  billOfLadingReference?: string | null;
  containerReference?: string | null;
  vesselName?: string | null;
  voyageNumber?: string | null;
  carrierName?: string | null;
  portOfOrigin?: string | null;
  portOfDestination?: string | null;
  finalDestinationCountryId?: string | null;
  documentFamily?: string | null;
  deadlineType?: MaritimeDeadlineType;
  hardDeadline?: string | null;
  courierCutoff?: string | null;
  apostilleRequired?: boolean | "unknown";
  translationReviewRequired?: boolean | "unknown";
  paymentStatus?: string | null;
  schedulingUnlocked?: boolean;
  assignedOperatorId?: string | null;
  assignedPartnerId?: string | null;
  nextOperatorAction?: string | null;
}
