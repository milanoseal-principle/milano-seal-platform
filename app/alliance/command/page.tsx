export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { RoleIntegrationCommand } from "@/components/integrations/RoleIntegrationCommand";

export const metadata = { title: "Alliance Command — The Milano Seal™", robots: { index: false } };

export default async function Page() {
  await requireDashboardAccess();
  return (
    <div className="max-w-6xl space-y-6">
      <DashboardPageHeader eyebrow="Alliance · Execution Command" title="Alliance Command" description="Assigned matter scope only — execution instructions, checklist, and permitted evidence." />
      <RoleIntegrationCommand role="alliance_member" />
    </div>
  );
}
