export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { SOPEditor } from "@/components/dashboard/sops/SOPEditor";

export default async function NewSOPPage() {
  await requireDashboardAccess();
  return <SOPEditor mode="create" />;
}
