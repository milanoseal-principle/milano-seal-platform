export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { SOPEditor } from "@/components/dashboard/sops/SOPEditor";

export default async function EditSOPPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDashboardAccess();
  const { id } = await params;
  return <SOPEditor mode="edit" sopId={id} />;
}
