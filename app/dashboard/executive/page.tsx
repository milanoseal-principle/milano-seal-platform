import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";
import { ExecutiveIntelligenceCommand } from "@/components/dashboard/ExecutiveIntelligenceCommand";
import { MatterExecutionCorridorSpine } from "@/components/dashboard/MatterExecutionCorridorSpine";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Executive Dashboard — Milano Seal",
  robots: { index: false },
};

export default async function ExecutivePage() {
  await requireDashboardAccess();

  const executiveEmail = process.env.EXECUTIVE_EMAIL;
  if (executiveEmail) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== executiveEmail) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#050507",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.4)",
            fontFamily: "monospace",
            fontSize: 12,
          }}
        >
          Executive access restricted.
        </div>
      );
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <MatterExecutionCorridorSpine />
      <ExecutiveDashboard />
      <ExecutiveIntelligenceCommand />
    </div>
  );
}
