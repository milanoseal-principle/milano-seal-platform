export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { SOPLibrary } from "@/components/dashboard/sops/SOPLibrary";

export default async function SOPsPage() {
  await requireDashboardAccess();
  return <SOPLibrary />;
}
