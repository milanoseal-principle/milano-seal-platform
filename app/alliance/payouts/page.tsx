import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AllianceShell } from "@/components/alliance/AllianceShell";
import { AlliancePayoutPanel } from "@/components/alliance/AlliancePayoutPanel";

export default async function AlliancePayoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/alliance/login");

  const { data: partner } = await supabase
    .from("alliance_partners")
    .select("id, firm_name, contact_name, routing_eligible, compliance_verified, toolbelt_completed")
    .eq("user_id", user.id)
    .single();

  // Partner-safe: never expose base_cost, margin, or payout formula
  // Show only summary status — no internal revenue data
  const isEligible = (partner?.compliance_verified ?? false) && (partner?.toolbelt_completed ?? false);

  return (
    <AllianceShell
      partnerName={partner?.contact_name ?? undefined}
      firmName={partner?.firm_name ?? undefined}
      routingEligible={partner?.routing_eligible ?? false}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
            Commission & Payouts
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 8px" }}>
            Payout Status
          </h1>
          <p style={{ fontSize: 13, color: "#A8A29A", margin: 0, lineHeight: 1.6 }}>
            Commission status for referred matters. Payouts are processed manually by the Milano Seal team on a scheduled basis.
          </p>
        </div>

        <div style={{ padding: "28px", background: "#0d0d0d", border: "1px solid rgba(198,166,91,0.14)", borderRadius: 8 }}>
          <AlliancePayoutPanel
            data={{
              month_to_date: "—",
              outstanding: "—",
              year_to_date: "—",
              next_payment: "—",
              status: isEligible ? "PENDING_REVIEW" : "NOT_ELIGIBLE",
            }}
          />
        </div>

        <div style={{ padding: "16px 20px", background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6 }}>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 12 }}>
            Commission Policy
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Commission is only tracked for accepted and completed referral matters.",
              "Eligibility requires active partner status, completed Tool Belt, and verified compliance.",
              "Payout amounts and formulas are not visible in the partner portal.",
              "Commission disputes or questions should be directed to the Alliance support team.",
              "Payouts are processed on a scheduled basis — no automatic or immediate payouts.",
            ].map((item, i) => (
              <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "#A8A29A", lineHeight: 1.5 }}>
                <span style={{ color: "rgba(198,166,91,0.4)", flexShrink: 0 }}>—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AllianceShell>
  );
}
