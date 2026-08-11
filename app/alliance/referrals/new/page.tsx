import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AllianceShell } from "@/components/alliance/AllianceShell";
import { AllianceReferralEngine } from "@/components/alliance/AllianceReferralEngine";

export default async function AllianceNewReferralPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/alliance/login");

  const { data: partner } = await supabase
    .from("alliance_partners")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const p = (partner ?? {}) as Record<string, unknown>;
  const referralCode = String(p.referral_code ?? p.partner_code ?? "") || null;
  const partnerEmail = String(p.email ?? user.email ?? "") || null;

  return (
    <AllianceShell
      partnerName={String(p.contact_name ?? p.full_name ?? "") || undefined}
      firmName={String(p.firm_name ?? "") || undefined}
      routingEligible={Boolean(p.routing_eligible ?? false)}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
            Referral Submission
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 8px" }}>
            Submit a Referral
          </h1>
          <p style={{ fontSize: 13, color: "#A8A29A", margin: 0, lineHeight: 1.6 }}>
            Refer a client matter to The Milano Seal for international document execution. Your authenticated Alliance account is preserved as the referral source.
          </p>
        </div>

        <div style={{ padding: "28px", background: "#0d0d0d", border: "1px solid rgba(198,166,91,0.14)", borderRadius: 8 }}>
          <AllianceReferralEngine partnerEmail={partnerEmail} referralCode={referralCode} />
        </div>

        <div style={{ padding: "16px 20px", background: "rgba(198,166,91,0.04)", border: "1px solid rgba(198,166,91,0.12)", borderRadius: 6 }}>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
            What happens next
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Your referral is received and reviewed by the Milano Seal operations team.",
              "You will receive a partner-safe status update within 1–2 business days.",
              "If accepted, the matter enters the execution queue. You will see status updates in your referral list.",
              "Commission eligibility is reviewed upon matter completion — not automatically assigned.",
            ].map((step, i) => (
              <li key={i} style={{ display: "flex", gap: 12, fontSize: 13, color: "#A8A29A", lineHeight: 1.5 }}>
                <span style={{ color: "#C6A55A", fontFamily: "monospace", fontSize: 11, flexShrink: 0, lineHeight: 1.8 }}>{i + 1}.</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AllianceShell>
  );
}
