import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";

// Partner referrals use the canonical lead intake (public.sales_leads, lead_type
// 'alliance_referral') and the governed convert_sales_lead_to_matter transition. There is no
// separate partner_observations staging table: it never existed in the repository or the
// hosted database, so every referral written there was lost. Attribution to the partner is
// recorded in referral_ledger when the lead becomes a Matter.

export const ALLIANCE_REFERRAL_LEAD_TYPE = "alliance_referral";

export type PartnerReferralInput = {
  client_name?: string | null;
  client_email: string;
  client_phone?: string | null;
  destination_country: string;
  document_type: string;
  matter_type: string;
  urgency?: string | null;
  referral_code?: string | null;
  context: Record<string, unknown>;
};

// Stores the referral. Throws on failure: a referral must never be reported received unless stored.
export async function submitPartnerReferral(db: SupabaseClient, input: PartnerReferralInput, partnerId: string | null) {
  const id = randomUUID();
  const { error } = await db.from("sales_leads").insert({
    id,
    full_name: input.client_name || null,
    email: input.client_email.trim().toLowerCase(),
    phone: input.client_phone || null,
    audience: "individual",
    country: input.destination_country,
    document_type: input.document_type,
    product_interest: input.matter_type,
    urgency: input.urgency || null,
    source_route: "/alliance/referrals",
    desired_next_step: "operator_review",
    lead_type: ALLIANCE_REFERRAL_LEAD_TYPE,
    details: {
      ...input.context,
      destination: input.destination_country,
      // Attribution is the verified partner (session or verified code), never a typed email.
      partner_id: partnerId,
      referral_code: input.referral_code || null,
      review_status: "pending_review",
    },
  });
  if (error) throw Error("REFERRAL_NOT_STORED");
  return { id, reference: `REF-${id.slice(0, 8).toUpperCase()}` };
}

// One ledger row per referral lead and partner: the row id is derived from them, so a concurrent
// second attempt collides on the primary key instead of writing a duplicate attribution.
export function referralAttributionId(leadId: string, partnerId: string): string {
  // UUIDs are compared case-insensitively by the database, so the key uses their canonical lower case.
  const hex = createHash("sha256").update(`alliance-referral-attribution:${leadId.trim().toLowerCase()}:${partnerId.trim().toLowerCase()}`).digest("hex");
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

// Idempotently records partner attribution for a Matter created from a partner referral lead.
export async function recordPartnerReferralAttribution(db: SupabaseClient, leadId: string, matterId: string) {
  const { data: lead, error } = await db.from("sales_leads").select("lead_type, details").eq("id", leadId).maybeSingle();
  if (error) throw Error("REFERRAL_ATTRIBUTION_UNAVAILABLE");
  const details = (lead?.details ?? {}) as Record<string, unknown>;
  const partnerId = typeof details.partner_id === "string" ? details.partner_id : null;
  if (lead?.lead_type !== ALLIANCE_REFERRAL_LEAD_TYPE || !partnerId) return { recorded: false as const };
  const { data: existing, error: existingError } = await db.from("referral_ledger").select("id").eq("matter_id", matterId).eq("partner_id", partnerId).maybeSingle();
  if (existingError) throw Error("REFERRAL_ATTRIBUTION_UNAVAILABLE");
  if (existing) return { recorded: true as const, duplicate: true };
  const { error: insertError } = await db.from("referral_ledger").insert({
    id: referralAttributionId(leadId, partnerId),
    matter_id: matterId,
    partner_id: partnerId,
    referral_code: typeof details.referral_code === "string" ? details.referral_code : null,
    source_type: "partner_link",
    attribution_status: "captured",
  });
  if ((insertError as { code?: string } | null)?.code === "23505") return { recorded: true as const, duplicate: true };
  if (insertError) throw Error("REFERRAL_ATTRIBUTION_NOT_STORED");
  return { recorded: true as const, duplicate: false };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ReferralReviewResult =
  | { ok: true; status: 200 | 202; action: "accept" | "reject" | "convert"; matterId?: string; duplicate?: boolean; attribution?: "RECORDED" | "NOT_RECORDED_RETRY" }
  | { ok: false; status: number; error: string };

// Operator review of a partner referral. Accept and reject only annotate an unconverted lead;
// convert runs the governed lead-to-Matter transition (one lead, at most one Matter) and then
// records attribution. A rejected referral is never converted, and a converted one is never
// re-reviewed. Nothing here touches payment, scheduling or the Matter state machine.
export async function reviewPartnerReferral(
  db: SupabaseClient,
  input: { id: unknown; action: unknown; actorId: string; canConvert: boolean },
  now: Date = new Date(),
): Promise<ReferralReviewResult> {
  const { id, action } = input;
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, status: 400, error: "INVALID_REFERRAL_ID" };
  if (action !== "accept" && action !== "reject" && action !== "convert") return { ok: false, status: 400, error: "UNKNOWN_ACTION" };

  const { data: lead, error: leadError } = await db
    .from("sales_leads")
    .select("id, lead_type, details, canonical_matter_id")
    .eq("id", id)
    .eq("lead_type", ALLIANCE_REFERRAL_LEAD_TYPE)
    .maybeSingle();
  if (leadError) return { ok: false, status: 503, error: "REFERRALS_UNAVAILABLE" };
  if (!lead) return { ok: false, status: 404, error: "REFERRAL_NOT_FOUND" };
  const details = (lead.details ?? {}) as Record<string, unknown>;

  if (action === "accept" || action === "reject") {
    if (lead.canonical_matter_id) return { ok: false, status: 409, error: "REFERRAL_ALREADY_CONVERTED" };
    const next = { ...details, review_status: action === "accept" ? "accepted" : "rejected", reviewed_by: input.actorId, reviewed_at: now.toISOString() };
    // Guarded on the lead still being unconverted, so a review cannot land after a conversion.
    const { data: updated, error } = await db.from("sales_leads").update({ details: next }).eq("id", id).is("canonical_matter_id", null).select("id").maybeSingle();
    if (error) return { ok: false, status: 503, error: "REFERRAL_REVIEW_NOT_STORED" };
    if (!updated) return { ok: false, status: 409, error: "REFERRAL_ALREADY_CONVERTED" };
    return { ok: true, status: 200, action };
  }

  // Creating a Matter is a protected transition: same authority as the Leads workspace.
  if (!input.canConvert) return { ok: false, status: 403, error: "FORBIDDEN" };
  if (!lead.canonical_matter_id && details.review_status === "rejected") return { ok: false, status: 409, error: "REFERRAL_REJECTED" };

  const { data, error } = await db.rpc("convert_sales_lead_to_matter", { p_lead_id: lead.id, p_actor_id: input.actorId });
  if (error) {
    const code = (error as { code?: string }).code;
    // The database refuses a referral rejected after the check above (same lock as the conversion).
    const rejected = code === "22023" && /REFERRAL_REJECTED/.test(String((error as { message?: string }).message ?? ""));
    return { ok: false, status: code === "P0002" ? 404 : code === "42501" ? 403 : code === "22023" ? 409 : 503, error: rejected ? "REFERRAL_REJECTED" : code === "P0002" ? "REFERRAL_NOT_FOUND" : code === "42501" ? "FORBIDDEN" : "LEAD_CONVERSION_FAILED" };
  }
  const row = (Array.isArray(data) ? data[0] : data) as { matter_id?: string; duplicate?: boolean } | null;
  if (!row?.matter_id) return { ok: false, status: 503, error: "LEAD_CONVERSION_UNCONFIRMED" };
  try {
    await recordPartnerReferralAttribution(db, String(lead.id), row.matter_id);
  } catch {
    // The Matter exists; attribution is retried by repeating the action (both steps are idempotent).
    return { ok: true, status: 202, action, matterId: row.matter_id, duplicate: row.duplicate === true, attribution: "NOT_RECORDED_RETRY" };
  }
  return { ok: true, status: 200, action, matterId: row.matter_id, duplicate: row.duplicate === true, attribution: "RECORDED" };
}
