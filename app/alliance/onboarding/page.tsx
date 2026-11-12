import { resolveAlliancePartner } from "@/lib/alliance/partnerContext";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AllianceShell } from "@/components/alliance/AllianceShell";
import { AllianceOnboardingFlow } from "@/components/alliance/AllianceOnboardingFlow";

export default async function AllianceOnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/alliance/login");

  const partner = await resolveAlliancePartner(user.id);

  return (
    <AllianceShell
      partnerName={partner?.contact_name ?? undefined}
      firmName={partner?.firm_name ?? undefined}
      routingEligible={partner?.routing_eligible ?? false}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
            Alliance Onboarding
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 8px" }}>
            Partner Onboarding
          </h1>
          <p style={{ fontSize: 13, color: "#A8A29A", margin: 0, lineHeight: 1.6 }}>
            Complete each step to activate your Alliance Partner account. Your submission will be reviewed by the Milano Seal compliance team.
          </p>
        </div>
        <AllianceOnboardingFlow />
      </div>
    </AllianceShell>
  );
}
