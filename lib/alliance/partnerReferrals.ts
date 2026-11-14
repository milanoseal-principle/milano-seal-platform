import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeMatterStatus, type MatterStatus } from "@/lib/stateMachine";
import type { MatterRow } from "@/components/alliance/AllianceMatterQueue";

// Partner-facing referral history.
//
// public.referral_ledger holds attribution only (matter_id, partner_id, attribution_status,
// captured_at). Display fields come from the canonical Matter (public.deals) and commission status
// from public.payout_reviews. Every read is scoped to the partner id resolved from the verified
// session (resolveAlliancePartner), and only partner-safe fields leave this module:
//   * client first name only (no surname, email, phone or address);
//   * canonical Matter status mapped to partner-safe queue keys (no payment or internal states);
//   * commission review status only (no amounts, notes or reviewer).

const LIMIT = 100;

const PARTNER_STATUS: Record<MatterStatus, string> = {
  intake_received: "submitted",
  under_review: "under_review",
  quoted: "under_review",
  awaiting_payment: "under_review",
  payment_confirmed: "in_progress",
  scheduled: "in_progress",
  in_execution: "in_progress",
  apostille_processing: "apostille",
  in_transit: "in_transit",
  delivered: "completed",
  completed: "completed",
  dormant: "under_review",
};

const COMMISSION_STATUS: Record<string, string> = {
  not_eligible: "NOT_ELIGIBLE",
  pending_review: "PENDING_REVIEW",
  approved: "APPROVED",
  rejected: "REJECTED",
  paid: "PAID",
};

export function partnerSafeMatterStatus(status: unknown): string {
  const canonical = normalizeMatterStatus(String(status ?? ""));
  return canonical ? PARTNER_STATUS[canonical] : "under_review";
}

export function partnerSafeCommissionStatus(reviewStatus: unknown): string {
  return COMMISSION_STATUS[String(reviewStatus ?? "")] ?? "PENDING_REVIEW";
}

export function clientFirstName(name: unknown): string | null {
  const first = typeof name === "string" ? name.trim().split(/\s+/)[0] : "";
  return first ? first : null;
}

export type PartnerReferralsResult = { referrals: MatterRow[]; unavailable: boolean };

type Ledger = { id: string; matter_id: string; captured_at: string };
type Matter = { id: string; client_name: string | null; destination_country: string | null; document_type: string | null; status: string | null };
type Review = { referral_ledger_id: string | null; review_status: string | null; created_at: string | null };

export async function loadPartnerReferrals(partnerId: string | null | undefined, db: SupabaseClient = createAdminClient()): Promise<PartnerReferralsResult> {
  if (!partnerId) return { referrals: [], unavailable: false };

  const { data: ledger, error: ledgerError } = await db
    .from("referral_ledger")
    .select("id, matter_id, captured_at")
    .eq("partner_id", partnerId)
    .order("captured_at", { ascending: false })
    .limit(LIMIT);
  if (ledgerError || !Array.isArray(ledger)) return { referrals: [], unavailable: true };
  if (!ledger.length) return { referrals: [], unavailable: false };

  const rows = ledger as Ledger[];
  const matterIds = [...new Set(rows.map((row) => row.matter_id))];
  const [matters, reviews] = await Promise.all([
    db.from("deals").select("id, client_name, destination_country, document_type, status").in("id", matterIds),
    db.from("payout_reviews").select("referral_ledger_id, review_status, created_at").eq("partner_id", partnerId).in("referral_ledger_id", rows.map((row) => row.id)),
  ]);
  if (matters.error || reviews.error || !Array.isArray(matters.data) || !Array.isArray(reviews.data)) return { referrals: [], unavailable: true };

  const matterById = new Map((matters.data as Matter[]).map((m) => [m.id, m]));
  // Latest review per ledger row decides the commission label.
  const reviewByLedger = new Map<string, Review>();
  for (const review of reviews.data as Review[]) {
    if (!review.referral_ledger_id) continue;
    const current = reviewByLedger.get(review.referral_ledger_id);
    if (!current || String(review.created_at ?? "") > String(current.created_at ?? "")) reviewByLedger.set(review.referral_ledger_id, review);
  }

  return {
    unavailable: false,
    referrals: rows.map((row) => {
      const matter = matterById.get(row.matter_id);
      return {
        id: row.id,
        client_name: clientFirstName(matter?.client_name),
        destination_country: matter?.destination_country ?? null,
        document_type: matter?.document_type ?? null,
        referral_status: partnerSafeMatterStatus(matter?.status),
        commission_status: partnerSafeCommissionStatus(reviewByLedger.get(row.id)?.review_status),
        submitted_at: row.captured_at,
      };
    }),
  };
}
