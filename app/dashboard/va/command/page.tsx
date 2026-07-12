export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { RoleIntegrationCommand } from "@/components/integrations/RoleIntegrationCommand";

export const metadata = { title: "VA Command — The Milano Seal™", robots: { index: false } };

export default async function Page() {
  await requireDashboardAccess();
  return (
    <div className="max-w-6xl space-y-6">
      <DashboardPageHeader eyebrow="Virtual Assistant · Command" title="VA Command" description="Permission-controlled support tasks connected to Operator and Alliance through the shared matter." />
      <RoleIntegrationCommand role="virtual_assistant" />
    </div>
  );
}
