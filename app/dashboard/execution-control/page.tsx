import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { ExecutionControlCenter } from "@/components/dashboard/ExecutionControlCenter";

export const metadata = {
  title: "Execution Control Center — Milano Seal",
};

export default async function ExecutionControlPage() {
  await requireDashboardAccess();
  return <ExecutionControlCenter />;
}
