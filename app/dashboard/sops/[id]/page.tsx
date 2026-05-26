export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { SOPDetail } from "@/components/dashboard/sops/SOPDetail";

export default async function SOPDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDashboardAccess();
  const { id } = await params;
  return <SOPDetail sopId={id} />;
}
