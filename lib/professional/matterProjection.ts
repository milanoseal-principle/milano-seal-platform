// Client-safe projection of a canonical Matter for the referring professional.
//
// Derived only from canonical Matter truth (public.deals). It never exposes
// internal margins, operator notes, the private pricing catalog, internal
// exception notes, other professionals, Wise webhook payloads, signing
// credentials or internal risk scores.

export const RECEIVING_AUTHORITY_DISCLAIMER =
  "Final acceptance is determined by the receiving authority.";

export const PROFESSIONAL_STATUS_COPY = [
  "Intake received",
  "Under review",
  "Quote issued",
  "Awaiting payment",
  "Scheduling available",
  "Execution scheduled",
  "Execution complete",
  "Authentication / apostille in progress",
  "Ready for final release",
  "In transit",
  "Delivered",
  "Completed",
  "Review required",
] as const;
export type ProfessionalStatusCopy = (typeof PROFESSIONAL_STATUS_COPY)[number];

export interface ProfessionalMatterSource {
  id: string;
  deal_id?: string | null;
  referral_reference?: string | null;
  professional_profile_id?: string | null;
  client_name?: string | null;
  destination_country?: string | null;
  document_type?: string | null;
  deal_status?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payment_confirmed?: boolean | null;
  balance_payment_status?: string | null;
  quote_review_required?: boolean | null;
  quote_approved_at?: string | null;
  apostille_required?: boolean | null;
  scheduled_at?: string | null;
  executed_at?: string | null;
  apostille_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  completed_at?: string | null;
  courier_status?: string | null;
  created_at?: string | null;
}

export interface ProfessionalMatterView {
  id: string;
  matterReference: string;
  client: string;
  destination: string;
  document: string;
  stage: ProfessionalStatusCopy;
  nextAction: string;
  paymentPosture: string;
  executionPosture: string;
  authenticationStage: string;
  courierStage: string;
  completed: boolean;
  createdAt: string | null;
  acceptanceNotice: string;
}

/** Exactly the columns the professional dashboard may read from deals. */
export const PROFESSIONAL_MATTER_COLUMNS = [
  "id",
  "deal_id",
  "referral_reference",
  "professional_profile_id",
  "client_name",
  "destination_country",
  "document_type",
  "deal_status",
  "status",
  "payment_status",
  "payment_confirmed",
  "balance_payment_status",
  "quote_review_required",
  "quote_approved_at",
  "apostille_required",
  "scheduled_at",
  "executed_at",
  "apostille_at",
  "shipped_at",
  "delivered_at",
  "completed_at",
  "courier_status",
  "created_at",
] as const;

export const PROFESSIONAL_FORBIDDEN_FIELDS = [
  "internal_notes",
  "operator_notes",
  "notes",
  "quote_breakdown",
  "quote_review_reasons",
  "base_price",
  "net_margin",
  "margin",
  "conversion_score",
  "priority_tier",
  "risk_score",
  "wise_payload",
  "raw_webhook_payload",
  "label_url",
  "bn_signing_url",
  "full_signing_url",
  "signing_url",
  "access_token",
  "assignee",
  "email",
  "phone",
] as const;

const lower = (value: unknown) => String(value ?? "").trim().toLowerCase();
const isPaid = (m: ProfessionalMatterSource) =>
  lower(m.payment_status) === "paid" || m.payment_confirmed === true;
const paymentSubmitted = (m: ProfessionalMatterSource) =>
  ["pending", "observed_pending", "processing"].includes(lower(m.payment_status));
const courier = (m: ProfessionalMatterSource) => lower(m.courier_status);

export function professionalStage(m: ProfessionalMatterSource): ProfessionalStatusCopy {
  const dealStatus = lower(m.deal_status);
  if (m.completed_at || dealStatus === "completed") return "Completed";
  if (m.delivered_at || courier(m) === "delivered") return "Delivered";
  if (m.shipped_at || ["in_transit", "out_for_delivery", "customs_watch"].includes(courier(m))) {
    return "In transit";
  }
  if (m.quote_review_required === true) return "Review required";
  if (m.apostille_at) return "Ready for final release";
  if (m.executed_at && (m.apostille_required || dealStatus === "apostille")) {
    return "Authentication / apostille in progress";
  }
  if (m.executed_at) return "Execution complete";
  if (m.scheduled_at || dealStatus === "scheduled") return "Execution scheduled";
  if (isPaid(m) || lower(m.balance_payment_status) === "pending") return "Scheduling available";
  if (paymentSubmitted(m)) return "Awaiting payment";
  if (m.quote_approved_at) return "Quote issued";
  if (["reviewing", "under_review", "new"].includes(dealStatus)) return "Under review";
  return "Intake received";
}

const NEXT_ACTION: Record<ProfessionalStatusCopy, string> = {
  "Intake received": "The Milano Seal is reviewing the Matter facts.",
  "Under review": "The Milano Seal is confirming the U.S. execution route.",
  "Quote issued": "Client reviews the Matter-specific quote and pays the 50% Wise deposit.",
  "Awaiting payment": "Wise deposit submitted; confirmation is pending.",
  "Scheduling available": "Client selects an execution time.",
  "Execution scheduled": "Signer attends the scheduled execution.",
  "Execution complete": "The Milano Seal prepares the executed document for release.",
  "Authentication / apostille in progress": "Authentication / apostille is with the competent authority.",
  "Ready for final release": "Final balance and release checks before dispatch.",
  "In transit": "Document is with the courier.",
  Delivered: "Delivery recorded; Matter closeout pending.",
  Completed: "No further action.",
  "Review required": "The Milano Seal will contact counsel or the client for missing information.",
};

function paymentPosture(m: ProfessionalMatterSource): string {
  if (lower(m.balance_payment_status) === "paid" || (m.completed_at && isPaid(m))) return "Paid in full";
  if (isPaid(m)) {
    return m.apostille_at || m.shipped_at ? "Final balance due" : "Deposit confirmed";
  }
  if (paymentSubmitted(m)) return "Deposit submitted — confirmation pending";
  if (m.quote_approved_at && m.quote_review_required !== true) return "Deposit due";
  return "Not yet requested";
}

function executionPosture(m: ProfessionalMatterSource): string {
  if (m.executed_at) return "Executed";
  if (m.scheduled_at) return "Scheduled";
  if (isPaid(m)) return "Ready to schedule";
  return "Pending payment gate";
}

function authenticationStage(m: ProfessionalMatterSource): string {
  if (m.apostille_at) return "Completed";
  if (m.executed_at && (m.apostille_required || lower(m.deal_status) === "apostille")) return "In progress";
  if (m.apostille_required) return "Pending execution";
  return "Not indicated";
}

function courierStage(m: ProfessionalMatterSource): string {
  if (m.delivered_at || courier(m) === "delivered") return "Delivered";
  if (m.shipped_at || ["in_transit", "out_for_delivery", "customs_watch"].includes(courier(m))) return "In transit";
  if (courier(m) === "label_created") return "Preparing dispatch";
  return "Not dispatched";
}

export function projectMatterForProfessional(m: ProfessionalMatterSource): ProfessionalMatterView {
  const stage = professionalStage(m);
  return {
    id: m.id,
    matterReference: String(m.deal_id ?? m.referral_reference ?? m.id),
    client: String(m.client_name ?? "").trim() || "Client",
    destination: String(m.destination_country ?? "").trim() || "Destination pending",
    document: String(m.document_type ?? "").trim() || "Document pending",
    stage,
    nextAction: NEXT_ACTION[stage],
    paymentPosture: paymentPosture(m),
    executionPosture: executionPosture(m),
    authenticationStage: authenticationStage(m),
    courierStage: courierStage(m),
    completed: stage === "Completed",
    createdAt: m.created_at ?? null,
    acceptanceNotice: RECEIVING_AUTHORITY_DISCLAIMER,
  };
}

/** Ownership boundary: a professional sees only Matters linked to their profile. */
export function professionalOwnsMatter(
  profileId: string | null | undefined,
  matter: Pick<ProfessionalMatterSource, "professional_profile_id">,
): boolean {
  return Boolean(profileId) && matter.professional_profile_id === profileId;
}
