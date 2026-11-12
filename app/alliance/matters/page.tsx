import { resolveAlliancePartner } from "@/lib/alliance/partnerContext";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AllianceMatterQueue, type MatterRow } from "@/components/alliance/AllianceMatterQueue";
import { AllianceShell } from "@/components/alliance/AllianceShell";

async function getPartnerMatters(userId: string): Promise<{ matters: MatterRow[]; partner: { firm_name: string | null; contact_name: string | null; routing_eligible: boolean } | null }> {
  const supabase = await createClient();

  const partner = await resolveAlliancePartner(userId);

  if (!partner) return { matters: [], partner: null };

  const { data: referrals } = await supabase
    .from("referral_ledger")
    .select("id, client_name, destination_country, document_type, referral_status, commission_status, submitted_at")
    .eq("partner_id", partner.id)
    .order("submitted_at", { ascending: false })
    .limit(100);

  return {
    matters: (referrals ?? []) as MatterRow[],
    partner: {
      firm_name: partner.firm_name,
      contact_name: partner.contact_name,
      routing_eligible: partner.routing_eligible ?? false,
    },
  };
}

export default async function AllianceMattersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/alliance/login");

  const { matters, partner } = await getPartnerMatters(user.id);

  return (
    <AllianceShell
      partnerName={partner?.contact_name ?? undefined}
      firmName={partner?.firm_name ?? undefined}
      routingEligible={partner?.routing_eligible ?? false}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1100 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
            Alliance Desk
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 8px" }}>
            Partner Matter Queue
          </h1>
          <p style={{ fontSize: 13, color: "#A8A29A", margin: 0 }}>
            Matters referred through your partner account. Statuses are partner-safe — no internal processing details are shown.
          </p>
        </div>

        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(198,166,91,0.14)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(198,166,91,0.08)" }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "#C6A55A" }}>
              {matters.length} matter{matters.length !== 1 ? "s" : ""}
            </div>
          </div>
          <AllianceMatterQueue matters={matters} />
        </div>
      </div>
    </AllianceShell>
  );
}
