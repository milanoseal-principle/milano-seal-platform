export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { VAOperatorPanel } from "@/components/dashboard/va/VAOperatorPanel";
import { VATaskIntelligencePanel } from "@/components/dashboard/va/VATaskIntelligencePanel";

export default async function VATaskManagementPage() {
  const { role } = await requireDashboardAccess();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Role header */}
      <div>
        <p
          className="text-[9px] font-mono tracking-[0.3em]"
          style={{ color: "rgba(212,175,55,0.4)" }}
        >
          {role.replace(/_/g, " ").toUpperCase()} · OPERATOR ENVIRONMENT
        </p>
        <h1
          className="text-xl font-light mt-1"
          style={{
            color: "rgba(255,255,255,0.75)",
            fontFamily: "var(--font-playfair),Georgia,serif",
          }}
        >
          VA Task Management
        </h1>
      </div>

      {/* Task Intelligence — generated from matter state, no DB table needed */}
      <VATaskIntelligencePanel />

      {/* Operator panel — assigned tasks from DB */}
      <VAOperatorPanel />
    </div>
  );
}
