export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { RoleIntegrationCommand } from "@/components/integrations/RoleIntegrationCommand";

export const metadata = { title: "Operator Integrations — The Milano Seal™", robots: { index: false } };

export default async function Page() {
  await requireDashboardAccess();
  return (
    <div className="max-w-6xl space-y-6">
      <DashboardPageHeader eyebrow="Operations · Integration Command" title="Operator Integrations" description="Primary coordination hub for payment readiness, RON readiness, courier readiness, and role assignment." />
      <RoleIntegrationCommand role="operator" />
    </div>
  );
}
