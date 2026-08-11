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
    const eligibleValue = money(items.reduce((sum, item) => sum + Number(item.eligible_subtotal ?? 0), 0));
    const discountedValue = money(items.reduce((sum, item) => sum + Number(item.discount_amount ?? 0), 0));
    const adjustedMatterValue = money(Math.max(0, eligibleValue - discountedValue));

    const clientCounts = new Map<string, number>();
    for (const item of items) {
      if (!item.client_id) continue;
      const clientId = String(item.client_id);
      clientCounts.set(clientId, (clientCounts.get(clientId) ?? 0) + 1);
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
      eligible_value: eligibleValue,
      discounted_value: discountedValue,
      adjusted_matter_value: adjustedMatterValue,
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

  const totals = {
    codes: rows.length,
    active_codes: rows.filter((row) => row.status === "active").length,
    redeemed_matters: rows.reduce((sum, row) => sum + row.redeemed_matter_count, 0),
    eligible_value: money(rows.reduce((sum, row) => sum + row.eligible_value, 0)),
    discounted_value: money(rows.reduce((sum, row) => sum + row.discounted_value, 0)),
    adjusted_matter_value: money(rows.reduce((sum, row) => sum + row.adjusted_matter_value, 0)),
    partner_referrals: rows.reduce((sum, row) => sum + row.partner_referral_volume, 0),
  };

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    authority: "discount_codes + redeemed discount_redemptions + referral_ledger",
    revenue_note: "Adjusted matter value is an attribution basis from redeemed discount records; Wise reconciliation remains authoritative for paid revenue.",
    totals,
    rows,
  });
}
