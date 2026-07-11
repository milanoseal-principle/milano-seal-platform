export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { IntegrationHealthGrid } from "@/components/integrations/health/IntegrationHealthGrid";
import { allIntegrationHealth } from "@/lib/integration-command/integrationReadModel";

export const metadata = { title: "Integration Health — The Milano Seal™", robots: { index: false } };

export default async function IntegrationHealthCenterPage() {
  await requireDashboardAccess();
  const health = allIntegrationHealth();

  return (
    <div className="max-w-5xl space-y-6">
      <DashboardPageHeader
        eyebrow="System · Integration Health"
        title="Integration Health Center"
        description="Evidence-based health for Wise, BlueNotary, and Shippo. Configured means required credentials are present — it does not mean live. Live requires a verified, signed provider test event and recorded sign-off."
      />
      <IntegrationHealthGrid records={health} />
      <p className="font-mono text-[9px] leading-relaxed text-white/30">
        Activation sequence: Missing → Configured → Credentials Authenticated → Webhook Verified → Approved Test Event →
        Normalized State Verified → Dashboard Evidence → Production Sign-Off → Live. No secrets, tokens, or raw provider
        payloads are ever displayed here.
      </p>
    </div>
  );
}
