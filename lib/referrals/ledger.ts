// Referral attribution ledger — operator-only logic.
// Partners never see: matter internals, revenue, margin, payout values.

export type AttributionStatus = "captured" | "verified" | "locked" | "disputed" | "resolved";
export type ReferralSourceType =
  | "direct" | "partner_link" | "manual_operator"
  | "utm" | "alliance_observation" | "return_client" | "unknown";

export interface ReferralLedgerEntry {
  id: string;
  matter_id: string;
  partner_id: string | null;
  referral_code: string | null;
  source_type: ReferralSourceType;
  attribution_status: AttributionStatus;
  captured_at: string;
  locked_at: string | null;
  locked_by: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
}

export type ReferralStatus =
  | "submitted" | "under_review" | "accepted"
  | "not_accepted" | "attached_to_matter"
  | "attribution_locked" | "completed";

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  accepted: "Accepted",
  not_accepted: "Not Accepted",
  attached_to_matter: "In Execution",
  attribution_locked: "Attribution Locked",
  completed: "Completed",
};

// Partner-safe fields only — never expose revenue, margin, payout, operator_notes
export interface PartnerSafeReferral {
  referral_id: string;
  submitted_at: string;
  destination_country: string | null;
  document_type: string | null;
  matter_type: string | null;
  status: ReferralStatus;
  public_next_step: string;
}

export function getPublicNextStep(status: ReferralStatus): string {
  const steps: Record<ReferralStatus, string> = {
    submitted: "Your referral has been received and is pending review.",
    under_review: "The Milano Seal team is reviewing this referral.",
    accepted: "Referral accepted. Matter is being prepared for execution.",
    not_accepted: "This referral was not accepted at this time.",
    attached_to_matter: "Matter is in execution.",
    attribution_locked: "Attribution confirmed. Matter is in execution.",
    completed: "Matter has been completed and released.",
  };
  return steps[status];
}

export function toPartnerSafeReferral(record: {
  id: string;
  created_at: string;
  destination_country?: string | null;
  document_type?: string | null;
  matter_type?: string | null;
  status: string;
}): PartnerSafeReferral {
  const status = (record.status as ReferralStatus) ?? "submitted";
  return {
    referral_id: record.id,
    submitted_at: record.created_at,
    destination_country: record.destination_country ?? null,
    document_type: record.document_type ?? null,
    matter_type: record.matter_type ?? null,
    status,
    public_next_step: getPublicNextStep(status),
  };
}
