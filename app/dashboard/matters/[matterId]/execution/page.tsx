export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { DynamicSessionPlaybook } from "@/components/dashboard/execution/DynamicSessionPlaybook";
import { MatterRONReadiness } from "@/components/ron/MatterRONReadiness";
import { MatterExecutionIntelligencePanel } from "@/components/dashboard/execution/MatterExecutionIntelligencePanel";
import { PaperOutChecklistPanel } from "@/components/ron/PaperOutChecklistPanel";
import { AuthorityPacketPanel } from "@/components/dashboard/execution/AuthorityPacketPanel";
import { AuthorityLogisticsPanel } from "@/components/dashboard/execution/AuthorityLogisticsPanel";
import { AuthorityAdvisoryPanel } from "@/components/dashboard/execution/AuthorityAdvisoryPanel";

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
        description="Matter-backed operator readiness only. Unknown execution facts remain blocked until confirmed; scheduling authority, RON readiness, custody, QA, and release truth remain independently governed."
      />
      <MatterExecutionIntelligencePanel matterId={matterId} />
      <DynamicSessionPlaybook matterId={matterId} />
      <MatterRONReadiness matterId={matterId} />
      <PaperOutChecklistPanel matterId={matterId} />
      <AuthorityPacketPanel matterId={matterId} />
      <AuthorityLogisticsPanel matterId={matterId} />
      <AuthorityAdvisoryPanel matterId={matterId} />
    </div>
  );
}
