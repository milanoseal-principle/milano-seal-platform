export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { VAOperatorPanel } from "@/components/dashboard/va/VAOperatorPanel";
import { VATaskIntelligencePanel } from "@/components/dashboard/va/VATaskIntelligencePanel";
import { VACourierTaskPanel } from "@/components/operators/VACourierTaskPanel";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { Reveal } from "@/components/dashboard/system/DashboardMotion";

export default async function VATaskManagementPage() {
  const { role } = await requireDashboardAccess();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Reveal>
        <DashboardPageHeader
          eyebrow={`${role.replace(/_/g, " ").toUpperCase()} · OPERATOR ENVIRONMENT`}
          title="Execution Support Queue"
          description="Internal execution-support queue — missing intake fields, document gaps, signer details, deadline gaps, upload issues, and operator escalation."
          primaryAction={{ label: "Escalate to Operator", href: "/dashboard/needs-review" }}
        />
      </Reveal>

      {/* Task Intelligence — generated from matter state, no DB table needed */}
      <VATaskIntelligencePanel />

      {/* Operator panel — assigned tasks from DB */}
      <VAOperatorPanel />

      {/* Courier task queue */}
      <VACourierTaskPanel />
    </div>
  );
}
