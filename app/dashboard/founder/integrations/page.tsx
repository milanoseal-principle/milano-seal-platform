export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { RoleIntegrationCommand } from "@/components/integrations/RoleIntegrationCommand";

export const metadata = { title: "Founder Integrations — The Milano Seal™", robots: { index: false } };

export default async function Page() {
  await requireDashboardAccess();
  return (
    <div className="max-w-6xl space-y-6">
      <DashboardPageHeader eyebrow="Founder · Integration Command" title="Founder Integrations" description="Executive oversight of Wise, BlueNotary, and Shippo health and escalations across all matters." />
      <RoleIntegrationCommand role="founder" />
    </div>
  );
}
