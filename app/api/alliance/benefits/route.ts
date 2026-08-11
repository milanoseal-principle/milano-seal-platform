import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: partner } = await supabase
    .from("alliance_partners")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!partner) return NextResponse.json({ benefits: [], referral_code: null, referral_count: 0 });

  const p = partner as Record<string, unknown>;
  const partnerId = String(p.id ?? "");
  const referralCode = String(p.referral_code ?? p.partner_code ?? "") || null;
  const admin = createAdminClient();

  const [{ data: codeRows }, { count: referralCount }] = await Promise.all([
    admin
      .from("discount_codes")
      .select("id,code,discount_type,discount_value,status,usage_limit,usage_count,expires_at,client_label,metadata")
      .contains("metadata", { alliance_member_id: partnerId })
      .neq("status", "revoked")
      .order("created_at", { ascending: false }),
    admin
      .from("referral_ledger")
      .select("id", { count: "exact", head: true })
      .eq("partner_id", partnerId),
  ]);

  const benefits = (codeRows ?? [])
    .filter((row) => row.discount_type === "percentage")
    .map((row) => {
      const metadata = (row.metadata ?? {}) as Record<string, unknown>;
      return {
        code: row.code,
        percentage: Number(row.discount_value ?? 0),
        status: row.status,
        usage_limit: row.usage_limit == null ? null : Number(row.usage_limit),
        usage_count: Number(row.usage_count ?? 0),
        expires_at: row.expires_at,
        label: row.client_label,
        service_scope: String(metadata.eligible_service_scope ?? "all_eligible_services"),
      };
    });

  return NextResponse.json({
    benefits,
    referral_code: referralCode,
    referral_count: referralCount ?? 0,
  });
}
