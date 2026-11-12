import type { SupabaseClient } from "@supabase/supabase-js";

// A release certificate may only attest what the canonical authorities already recorded:
// verified Wise settlement on the Matter and the governed exact-release custody event
// (DOC_RELEASE_CONFIRMED, written only by record_document_release).
export type CertificateEligibility =
  | { ok: true; releasedAt: string }
  | { ok: false; status: 404 | 422; error: string; gate: "MATTER_NOT_FOUND" | "VERIFIED_SETTLEMENT_REQUIRED" | "CANONICAL_RELEASE_REQUIRED" };

export async function releaseCertificateEligibility(supabase: SupabaseClient, matterId: string): Promise<CertificateEligibility> {
  const { data: deal } = await supabase
    .from("deals")
    .select("id, payment_confirmed, payment_settlement_status")
    .eq("id", matterId)
    .maybeSingle();
  if (!deal) return { ok: false, status: 404, error: "Matter not found", gate: "MATTER_NOT_FOUND" };
  if (deal.payment_confirmed !== true || deal.payment_settlement_status !== "cleared") {
    return { ok: false, status: 422, error: "Certificate requires verified settlement.", gate: "VERIFIED_SETTLEMENT_REQUIRED" };
  }
  const { data: release } = await supabase
    .from("custody_ledger")
    .select("created_at")
    .eq("deal_id", matterId)
    .eq("event", "DOC_RELEASE_CONFIRMED")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!release) {
    return { ok: false, status: 422, error: "Certificate requires the recorded exact document release.", gate: "CANONICAL_RELEASE_REQUIRED" };
  }
  return { ok: true, releasedAt: release.created_at as string };
}
