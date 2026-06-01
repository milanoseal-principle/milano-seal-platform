import { requireDashboardAccess } from "@/lib/dashboardAuth";
import AutopilotPanel from "@/components/dashboard/AutopilotPanel";

export default async function AutopilotPage() {
  await requireDashboardAccess();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Matter Intelligence Autopilot</h1>
        <p className="text-sm text-white/50 mt-1">
          Operator-confirmed task automation across active matters. Scan to generate task suggestions.
        </p>
      </div>
      <AutopilotPanel />
    </div>
  );
}
