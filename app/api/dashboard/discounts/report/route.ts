import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_ROLES = new Set([
  "founder",
  "founder_admin",
  "admin",
  "admin_operator",
  "finance",
  "finance_operator",
]);

interface RedemptionRow {
  discount_code_id: string;
  matter_id: string | null;
  client_id: string | null;
  eligible_subtotal: number | string | null;
  discount_amount: number | string | null;
  currency: string | null;
  status: string | null;
  redeemed_at: string | null;
}

interface DealIdentityRow {
  id: string;
  client_id: string | null;
  email: string | null;
}

async function requireReportAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = String(user.app_metadata?.role ?? "");
  return REPORT_ROLES.has(role) ? { user, role } : null;
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeCurrency(value: string | null | undefined) {
  return String(value ?? "USD").trim().toUpperCase() || "USD";
}

function identityForDeal(row: DealIdentityRow | undefined | null): string | null {
  if (!row) return null;
  if (row.client_id) return `client:${row.client_id}`;
  if (row.email) return `email:${row.email.trim().toLowerCase()}`;
  return null;
}

export async function GET() {
  if (!(await requireReportAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createAdminClient();
  const [
    { data: codes, error: codeError },
    { data: redemptions, error: redemptionError },
    { data: referrals, error: referralError },
  ] = await Promise.all([
    admin
      .from("discount_codes")
      .select("id,code,discount_type,discount_value,status,usage_limit,usage_count,client_id,matter_id,metadata,created_at,expires_at")
      .order("created_at", { ascending: false }),
    admin
      .from("discount_redemptions")
      .select("discount_code_id,matter_id,client_id,eligible_subtotal,discount_amount,currency,status,redeemed_at")
      .eq("status", "redeemed"),
    admin
      .from("referral_ledger")
      .select("id,partner_id"),
  ]);

  if (codeError) return NextResponse.json({ error: codeError.message }, { status: 500 });
  if (redemptionError) return NextResponse.json({ error: redemptionError.message }, { status: 500 });
  if (referralError) return NextResponse.json({ error: referralError.message }, { status: 500 });

  const referralCountByPartner = new Map<string, number>();
  for (const referral of referrals ?? []) {
    if (!referral.partner_id) continue;
    const id = String(referral.partner_id);
    referralCountByPartner.set(id, (referralCountByPartner.get(id) ?? 0) + 1);
  }

  const redemptionRows = (redemptions ?? []) as RedemptionRow[];
  const matterIds = Array.from(new Set(redemptionRows.map((row) => row.matter_id).filter(Boolean))) as string[];
  const dealIdentityById = new Map<string, DealIdentityRow>();
  if (matterIds.length > 0) {
    const { data: deals, error: dealError } = await admin
      .from("deals")
      .select("id,client_id,email")
      .in("id", matterIds);
    if (dealError) return NextResponse.json({ error: dealError.message }, { status: 500 });
    for (const deal of (deals ?? []) as DealIdentityRow[]) {
      dealIdentityById.set(String(deal.id), deal);
    }
  }

  const redeemedByCode = new Map<string, RedemptionRow[]>();
  for (const redemption of redemptionRows) {
    const key = String(redemption.discount_code_id);
    const bucket = redeemedByCode.get(key) ?? [];
    bucket.push(redemption);
    redeemedByCode.set(key, bucket);
  }

  const rows = (codes ?? []).map((code) => {
    const metadata = (code.metadata ?? {}) as Record<string, unknown>;
    const allianceMemberId = String(metadata.alliance_member_id ?? "") || null;
    const items = redeemedByCode.get(String(code.id)) ?? [];

    const monetaryByCurrency = new Map<string, { eligible_value: number; discounted_value: number; adjusted_matter_value: number }>();
    for (const item of items) {
      const currency = normalizeCurrency(item.currency);
      const current = monetaryByCurrency.get(currency) ?? {
        eligible_value: 0,
        discounted_value: 0,
        adjusted_matter_value: 0,
      };
      const eligible = Number(item.eligible_subtotal ?? 0);
      const discounted = Number(item.discount_amount ?? 0);
      current.eligible_value = money(current.eligible_value + eligible);
      current.discounted_value = money(current.discounted_value + discounted);
      current.adjusted_matter_value = money(current.adjusted_matter_value + Math.max(0, eligible - discounted));
      monetaryByCurrency.set(currency, current);
    }

    const monetary_totals = [...monetaryByCurrency.entries()].map(([currency, values]) => ({
      currency,
      ...values,
    }));

    const clientCounts = new Map<string, number>();
    for (const item of items) {
      const explicit = item.client_id ? `client:${String(item.client_id)}` : null;
      const derived = item.matter_id ? identityForDeal(dealIdentityById.get(String(item.matter_id))) : null;
      const identity = explicit ?? derived;
      if (!identity) continue;
      clientCounts.set(identity, (clientCounts.get(identity) ?? 0) + 1);
    }
    const repeatClients = [...clientCounts.values()].filter((count) => count > 1).length;
    const repeatClientRate = clientCounts.size > 0 ? repeatClients / clientCounts.size : null;
    const usageLimit = code.usage_limit == null ? null : Number(code.usage_limit);
    const usageCount = Number(code.usage_count ?? 0);

    return {
      id: code.id,
      code: code.code,
      discount_type: code.discount_type,
      discount_value: Number(code.discount_value ?? 0),
      status: code.status,
      usage_limit: usageLimit,
      usage_count: usageCount,
      redemption_rate: usageLimit ? Math.min(1, usageCount / usageLimit) : null,
      conversion_rate: null,
      conversion_rate_reason: "No governed code-impression denominator is stored; conversion is intentionally not inferred.",
      redeemed_matter_count: items.length,
      monetary_totals,
      repeat_client_rate: repeatClientRate,
      alliance_member_id: allianceMemberId,
      partner_referral_volume: allianceMemberId ? referralCountByPartner.get(allianceMemberId) ?? 0 : 0,
      client_id: code.client_id,
      matter_id: code.matter_id,
      service_scope: String(metadata.eligible_service_scope ?? "all_eligible_services"),
      created_at: code.created_at,
      expires_at: code.expires_at,
    };
  });

  const overallByCurrency = new Map<string, { eligible_value: number; discounted_value: number; adjusted_matter_value: number }>();
  for (const row of rows) {
    for (const monetary of row.monetary_totals) {
      const current = overallByCurrency.get(monetary.currency) ?? {
        eligible_value: 0,
        discounted_value: 0,
        adjusted_matter_value: 0,
      };
      current.eligible_value = money(current.eligible_value + monetary.eligible_value);
      current.discounted_value = money(current.discounted_value + monetary.discounted_value);
      current.adjusted_matter_value = money(current.adjusted_matter_value + monetary.adjusted_matter_value);
      overallByCurrency.set(monetary.currency, current);
    }
  }

  const uniquePartnerIds = new Set(rows.map((row) => row.alliance_member_id).filter(Boolean) as string[]);
  const partnerReferralTotal = [...uniquePartnerIds].reduce(
    (sum, partnerId) => sum + (referralCountByPartner.get(partnerId) ?? 0),
    0,
  );

  const totals = {
    codes: rows.length,
    active_codes: rows.filter((row) => row.status === "active").length,
    redeemed_matters: rows.reduce((sum, row) => sum + row.redeemed_matter_count, 0),
    monetary_totals: [...overallByCurrency.entries()].map(([currency, values]) => ({ currency, ...values })),
    partner_referrals: partnerReferralTotal,
  };

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    authority: "discount_codes + redeemed discount_redemptions + referral_ledger + deals identity projection",
    revenue_note: "Monetary attribution is grouped by original currency and is not converted. Wise reconciliation remains authoritative for paid revenue.",
    totals,
    rows,
  });
}
