import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AllianceShell } from "@/components/alliance/AllianceShell";
import {
  AllianceBenefitsCard,
  type AllianceBenefitView,
} from "@/components/alliance/AllianceBenefitsCard";

export const dynamic = "force-dynamic";

export default async function AllianceBenefitsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/alliance/login");

  const { data: partner } = await supabase
    .from("alliance_partners")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const p = (partner ?? {}) as Record<string, unknown>;
  const partnerId = String(p.id ?? "") || null;
  const partnerName = String(p.contact_name ?? p.full_name ?? "") || undefined;
  const firmName = String(p.firm_name ?? "") || undefined;
  const referralCode = String(p.referral_code ?? p.partner_code ?? "") || null;
  const routingEligible = Boolean(p.routing_eligible ?? false);

  let benefits: AllianceBenefitView[] = [];
  let referralCount = 0;

  if (partnerId) {
    const admin = createAdminClient();
    const { data: codeRows } = await admin
      .from("discount_codes")
      .select("id,code,discount_type,discount_value,status,usage_limit,usage_count,expires_at,client_label,metadata")
      .contains("metadata", { alliance_member_id: partnerId })
      .neq("status", "revoked")
      .order("created_at", { ascending: false });

    benefits = (codeRows ?? [])
      .filter((row) => row.discount_type === "percentage")
      .map((row) => {
        const metadata = (row.metadata ?? {}) as Record<string, unknown>;
        return {
          id: String(row.id),
          code: String(row.code),
          percentage: Number(row.discount_value ?? 0),
          status: String(row.status ?? "inactive"),
          usageLimit: row.usage_limit == null ? null : Number(row.usage_limit),
          usageCount: Number(row.usage_count ?? 0),
          expiresAt: row.expires_at ? String(row.expires_at) : null,
          label: String(row.client_label ?? "Milano Seal Alliance benefit"),
          serviceScope: String(metadata.eligible_service_scope ?? "all_eligible_services"),
        } satisfies AllianceBenefitView;
      });

    const { count } = await admin
      .from("referral_ledger")
      .select("id", { count: "exact", head: true })
      .eq("partner_id", partnerId);
    referralCount = count ?? 0;
  }

  const referralPath = referralCode
    ? `/alliance/referrals/new?ref=${encodeURIComponent(referralCode)}`
    : null;

  return (
    <AllianceShell
      partnerName={partnerName}
      firmName={firmName}
      routingEligible={routingEligible}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 980 }}>
        <header>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
            Alliance Tool Belt / Benefits
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 8px" }}>
            Partner Benefits & Attribution
          </h1>
          <p style={{ fontSize: 13, color: "#A8A29A", margin: 0, lineHeight: 1.6, maxWidth: 760 }}>
            View Milano Seal benefits assigned to your Alliance account and submit referrals with your authenticated partner attribution preserved. Benefits are read-only and cannot modify canonical pricing.
          </p>
        </header>

        <AllianceBenefitsCard
          benefits={benefits}
          referralCode={referralCode}
          referralCount={referralCount}
          referralPath={referralPath}
        />
      </div>
    </AllianceShell>
  );
}
