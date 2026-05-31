import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { ExecutionToolkit } from "@/components/dashboard/tools/ExecutionToolkit";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Execution Toolkit — The Milano Seal",
};

export default async function ToolsPage() {
  await requireDashboardAccess();

  return <ExecutionToolkit />;
}
