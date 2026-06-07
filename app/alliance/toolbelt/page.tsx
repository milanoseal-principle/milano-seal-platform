import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AllianceShell } from "@/components/alliance/AllianceShell";
import { AllianceToolbeltMatrix, type ToolbeltModuleStatus } from "@/components/alliance/AllianceToolbeltMatrix";

async function getToolbeltProgress(partnerId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("partner_toolbelt_progress")
    .select("module_key, status")
    .eq("partner_id", partnerId);

  const progress: Record<string, ToolbeltModuleStatus> = {};
  for (const row of data ?? []) {
    progress[row.module_key] = row.status as ToolbeltModuleStatus;
  }
  return progress;
}

export default async function AllianceToolbeltPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/alliance/login");

  const { data: partner } = await supabase
    .from("alliance_partners")
    .select("id, firm_name, contact_name, routing_eligible, toolbelt_completed")
    .eq("user_id", user.id)
    .single();

  const progress = partner?.id
    ? await getToolbeltProgress(partner.id, supabase)
    : {};

  const completedCount = Object.values(progress).filter((s) => s === "approved").length;

  return (
    <AllianceShell
      partnerName={partner?.contact_name ?? undefined}
      firmName={partner?.firm_name ?? undefined}
      routingEligible={partner?.routing_eligible ?? false}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1000 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
              Partner Readiness
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 8px" }}>
              Execution Partner Toolkit™
            </h1>
            <p style={{ fontSize: 13, color: "#A8A29A", margin: 0 }}>
              Complete all 8 modules to achieve routing eligibility. Modules unlock sequentially.
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", color: "#C6A55A" }}>
              {completedCount} / 8
            </div>
            <div style={{ fontSize: 11, color: "#A8A29A", marginTop: 4 }}>Modules approved</div>
          </div>
        </div>

        <AllianceToolbeltMatrix progress={progress} />
      </div>
    </AllianceShell>
  );
}
