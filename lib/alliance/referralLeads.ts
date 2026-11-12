import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

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
    matter_id: matterId,
    partner_id: partnerId,
    referral_code: typeof details.referral_code === "string" ? details.referral_code : null,
    source_type: "partner_link",
    attribution_status: "captured",
  });
  if (insertError) throw Error("REFERRAL_ATTRIBUTION_NOT_STORED");
  return { recorded: true as const, duplicate: false };
}
