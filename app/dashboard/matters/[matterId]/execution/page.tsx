export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { ExecutionReadiness } from "@/components/dashboard/execution/ExecutionReadiness";

export const metadata = { title: "Execution Readiness — The Milano Seal™", robots: { index: false } };

export default async function MatterExecutionPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  await requireDashboardAccess();
  const { matterId } = await params;

  return (
    <div className="max-w-5xl space-y-6">
      <DashboardPageHeader
        eyebrow={`Matter · ${matterId}`}
        title="Execution Readiness"
        description="Non-bypassable execution gates. Progression blocks until each required gate passes. Gate statuses populate from canonical Matter, payment, RON, and QC records once wired live."
      />
      <ExecutionReadiness />
    </div>
  );
}
