import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AllianceShell } from "@/components/alliance/AllianceShell";
import { AllianceMatterQueue, type MatterRow } from "@/components/alliance/AllianceMatterQueue";
import { GitBranch } from "lucide-react";

export default async function AllianceReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/alliance/login");

  const { data: partner } = await supabase
    .from("alliance_partners")
    .select("id, firm_name, contact_name, routing_eligible")
    .eq("user_id", user.id)
    .single();

  let referrals: MatterRow[] = [];
  if (partner?.id) {
    const { data } = await supabase
      .from("referral_ledger")
      .select("id, client_name, destination_country, document_type, referral_status, commission_status, submitted_at")
      .eq("partner_id", partner.id)
      .order("submitted_at", { ascending: false })
      .limit(100);
    referrals = (data ?? []) as MatterRow[];
  }

  return (
    <AllianceShell
      partnerName={partner?.contact_name ?? undefined}
      firmName={partner?.firm_name ?? undefined}
      routingEligible={partner?.routing_eligible ?? false}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1100 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
              Referral Ledger
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 8px" }}>
              Referred Matters
            </h1>
            <p style={{ fontSize: 13, color: "#A8A29A", margin: 0 }}>
              Matters referred through your partner account. Statuses are partner-safe.
            </p>
          </div>
          <Link
            href="/alliance/referrals/new"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: "rgba(198,166,91,0.1)",
              border: "1px solid rgba(198,166,91,0.3)",
              borderRadius: 4,
              color: "#C6A55A",
              fontSize: 12,
              fontFamily: "monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <GitBranch size={13} />
            New Referral
          </Link>
        </div>

        <div style={{ background: "#0d0d0d", border: "1px solid rgba(198,166,91,0.12)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(198,166,91,0.08)" }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: "#A8A29A" }}>
              {referrals.length} referral{referrals.length !== 1 ? "s" : ""}
            </div>
          </div>
          <AllianceMatterQueue matters={referrals} />
        </div>
      </div>
    </AllianceShell>
  );
}
