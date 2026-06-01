import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Executive Dashboard — Milano Seal",
};

export default async function ExecutivePage() {
  await requireDashboardAccess();

  // Additional email check for EXECUTIVE_EMAIL env var
  const executiveEmail = process.env.EXECUTIVE_EMAIL;
  if (executiveEmail) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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

  return <ExecutiveDashboard />;
}
