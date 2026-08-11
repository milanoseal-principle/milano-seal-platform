export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { ExecutionReadiness } from "@/components/dashboard/execution/ExecutionReadiness";
import { DynamicSessionPlaybook } from "@/components/dashboard/execution/DynamicSessionPlaybook";

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
        description="Non-bypassable execution gates plus a Matter-backed operator session playbook. Unknown execution facts remain blocked until confirmed; payment, QA, custody, and release gates remain authoritative."
      />
      <ExecutionReadiness />
      <DynamicSessionPlaybook matterId={matterId} />
    </div>
  );
}
