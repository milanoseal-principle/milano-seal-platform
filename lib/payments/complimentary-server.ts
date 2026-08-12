import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logActivity } from "@/lib/activity";
import type { ComplimentaryReasonCode } from "./complimentary-policy";
import { createComplimentaryAuthorization, validateComplimentaryAuthorizationInput, buildComplimentaryAccountingSnapshot, type ComplimentaryQuoteSnapshot } from "./complimentary-authorization";
import { canAuthorizeComplimentaryMatter, canRequestComplimentaryAuthorization, canRevokeComplimentaryMatter, type ComplimentaryActor } from "./complimentary-policy";

export interface AuthenticatedCompActor extends ComplimentaryActor {
  email: string | null;
  displayName: string;
}

export interface DealQuoteRow {
  id: string;
  deal_id?: string | null;
  quote_id?: string | null;
  quote_version?: string | null;
  base_price?: number | null;
  witness_total?: number | null;
  total_price?: number | null;
  amount_due?: number | null;
  payment_confirmed?: boolean | null;
  payment_status?: string | null;
  deal_status?: string | null;
}

export function extractActor(user: {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): AuthenticatedCompActor {
  const app = user.app_metadata ?? {};
  const meta = user.user_metadata ?? {};
  // Authorization role + permissions come ONLY from app_metadata (service-role
  // controlled). user_metadata is user-writable and must never grant authority;
  // it is used solely for the display name below.
  const role = String(app.role ?? "");
  const permissions = Array.isArray(app.permissions) ? app.permissions.map(String) : [];
  return {
    userId: user.id,
    role,
    permissions,
    email: user.email ?? null,
    displayName: String(meta.full_name ?? meta.name ?? user.email ?? user.id),
  };
}

function money(value: unknown): number {
  return Math.max(0, Math.round((Number(value) || 0) * 100) / 100);
}

export function canonicalQuoteFromDeal(deal: DealQuoteRow): ComplimentaryQuoteSnapshot {
  const originalTotal = money(deal.total_price ?? deal.amount_due ?? 0);
  const subtotal = money(deal.base_price ?? originalTotal);
  const addOns = money((deal.witness_total ?? 0) || Math.max(0, originalTotal - subtotal));
  return {
    quoteId: deal.quote_id ?? deal.deal_id ?? deal.id,
    matterId: deal.id,
    subtotal,
    addOns,
    total: originalTotal,
    currency: "USD",
    quoteVersion: String(deal.quote_version ?? `${deal.id}:${originalTotal}`),
  };
}

export async function requestComplimentaryAuthorization(params: {
  matterId: string;
  reasonCode: ComplimentaryReasonCode;
  reasonDetail: string;
  actor: AuthenticatedCompActor;
}) {
  if (!canRequestComplimentaryAuthorization(params.actor)) {
    throw new Error("Actor is not permitted to request a complimentary authorization.");
  }
  const admin = createAdminClient();
  const { data: deal, error } = await admin.from("deals").select("*").eq("id", params.matterId).single();
  if (error) throw error;
  if (!deal) throw new Error("Matter not found.");
  const quote = canonicalQuoteFromDeal(deal as DealQuoteRow);
  await audit({
    event: "COMPLIMENTARY_AUTHORIZATION_REQUESTED",
    actor: params.actor.email ?? params.actor.userId,
    resource: params.matterId,
    payload: { matterId: params.matterId, quoteVersion: quote.quoteVersion, reasonCode: params.reasonCode, reasonDetail: params.reasonDetail, actorRole: params.actor.role },
  });
  await logActivity({
    deal_id: params.matterId,
    actor: params.actor.email ?? params.actor.userId,
    action: "complimentary_authorization_requested",
    detail: "Complimentary Authorization requested for founder or authorized operator review.",
    meta: { reason_code: params.reasonCode, quote_version: quote.quoteVersion },
  });
  return { ok: true, matterId: params.matterId, quote };
}

export async function authorizeComplimentaryMatter(params: {
  matterId: string;
  quoteId: string | null;
  reasonCode: ComplimentaryReasonCode;
  reasonDetail: string;
  confirmation: string;
  actor: AuthenticatedCompActor;
}) {
  if (!canAuthorizeComplimentaryMatter(params.actor)) {
    throw new Error("Actor is not permitted to authorize a complimentary Matter.");
  }
  const admin = createAdminClient();
  const { data: deal, error } = await admin.from("deals").select("*").eq("id", params.matterId).single();
  if (error) throw error;
  if (!deal) throw new Error("Matter not found.");
  const quote = canonicalQuoteFromDeal(deal as DealQuoteRow);
  if (params.quoteId && quote.quoteId !== params.quoteId) throw new Error("Quote changed before authorization. Reopen pricing and authorize the current quote.");
  validateComplimentaryAuthorizationInput({ quote, reasonDetail: params.reasonDetail, confirmation: params.confirmation });
  const auth = createComplimentaryAuthorization({ quote, reasonCode: params.reasonCode, reasonDetail: params.reasonDetail, authorizedByUserId: params.actor.userId, authorizedByRole: params.actor.role ?? "unknown" });
  const snapshot = buildComplimentaryAccountingSnapshot(auth);

  const { error: insertError } = await admin.from("complimentary_authorizations").insert({
    id: auth.id,
    matter_id: auth.matterId,
    quote_id: auth.quoteId,
    quote_version: auth.quoteVersion,
    original_subtotal: auth.originalSubtotal,
    original_add_ons: auth.originalAddOns,
    original_total: auth.originalTotal,
    discount_amount: auth.discountAmount,
    final_amount_due: auth.finalAmountDue,
    currency: auth.currency,
    reason_code: auth.reasonCode,
    reason_detail: auth.reasonDetail,
    authorized_by_user_id: auth.authorizedByUserId,
    authorized_by_role: auth.authorizedByRole,
    authorization_scope: auth.authorizationScope,
    status: auth.status,
    authorized_at: auth.authorizedAt,
    audit_event_id: auth.auditEventId,
  });
  if (insertError) throw insertError;

  const { error: updateError } = await admin.from("deals").update({
    payment_disposition: "complimentary",
    amount_before_adjustment: snapshot.amountBeforeAdjustment,
    complimentary_adjustment_amount: snapshot.discountAmount,
    amount_due: 0,
    amount_paid: 0,
    verified_revenue: 0,
    wise_payment_id: null,
    wise_transfer_id: null,
    payment_confirmed_at: null,
    comp_authorized: true,
    comp_authorized_by: snapshot.compAuthorizedBy,
    comp_authorized_at: snapshot.compAuthorizedAt,
    comp_reason_code: snapshot.compReasonCode,
    comp_reason_detail: snapshot.compReasonDetail,
    comp_authorization_id: snapshot.compAuthorizationId,
  }).eq("id", params.matterId);
  if (updateError) throw updateError;

  await audit({ event: "COMPLIMENTARY_AUTHORIZATION_APPROVED", actor: params.actor.email ?? params.actor.userId, resource: params.matterId, payload: { authorizationId: auth.id, quoteVersion: auth.quoteVersion, originalTotal: auth.originalTotal, discountAmount: auth.discountAmount, amountDue: 0, amountPaid: 0, verifiedRevenue: 0, reasonCode: auth.reasonCode, reasonDetail: auth.reasonDetail, actorRole: params.actor.role } });
  await logActivity({ deal_id: params.matterId, actor: params.actor.email ?? params.actor.userId, action: "complimentary_authorization_approved", detail: "Complimentary Matter authorized. Payment is not required; verified revenue remains $0.", meta: { authorization_id: auth.id, quote_version: auth.quoteVersion, original_total: auth.originalTotal, verified_revenue: 0 } });
  return { ok: true, authorization: auth, accounting: snapshot };
}

export async function revokeComplimentaryMatter(params: { matterId: string; authorizationId: string; reason: string; actor: AuthenticatedCompActor }) {
  if (!canRevokeComplimentaryMatter(params.actor)) throw new Error("Actor is not permitted to revoke a complimentary authorization.");
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: existing, error: loadError } = await admin
    .from("complimentary_authorizations")
    .select("original_total")
    .eq("id", params.authorizationId)
    .eq("matter_id", params.matterId)
    .single();
  if (loadError) throw loadError;
  const { error: authError } = await admin.from("complimentary_authorizations").update({ status: "revoked", revoked_at: now, revoked_by_user_id: params.actor.userId, revocation_reason: params.reason }).eq("id", params.authorizationId).eq("matter_id", params.matterId);
  if (authError) throw authError;
  const { error: dealError } = await admin.from("deals").update({ payment_disposition: "standard_payment", amount_due: Number(existing?.original_total ?? 0), comp_authorized: false, comp_revoked_at: now }).eq("id", params.matterId);
  if (dealError) throw dealError;
  await audit({ event: "COMPLIMENTARY_AUTHORIZATION_REVOKED", actor: params.actor.email ?? params.actor.userId, resource: params.matterId, payload: { authorizationId: params.authorizationId, reason: params.reason } });
  await logActivity({ deal_id: params.matterId, actor: params.actor.email ?? params.actor.userId, action: "complimentary_authorization_revoked", detail: params.reason, meta: { authorization_id: params.authorizationId } });
  return { ok: true, revokedAt: now };
}
