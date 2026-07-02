import { DataSourceStatusCard } from "@/components/dashboard/DataSourceStatusCard";
import { OperatorNextAction } from "@/components/dashboard/OperatorNextAction";
export default function SalesLabPage(){return <main className="space-y-6"><h1 className="font-serif text-3xl">Sales Intelligence Lab</h1><p className="text-muted-foreground">Internal sales intelligence. No fake metrics or fake revenue.</p><DataSourceStatusCard moduleName="Sales Intelligence Lab" status="planned" /><OperatorNextAction action="Attach qualified opportunities back to deals and referral intelligence." /></main>}
export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { SalesLabShell } from "@/components/dashboard/intelligence/sales-lab/SalesLabShell";

export const metadata = {
  title: "Sales Intelligence Lab — The Milano Seal™",
  robots: { index: false, follow: false },
};

// Protected internal Sales Intelligence Lab. Demo workspace only — not live
// dashboard, payment, courier, or matter data.
export default async function SalesLabPage() {
  await requireDashboardAccess();
  return (
    <div className="max-w-6xl">
      <DashboardPageHeader
        eyebrow="Internal Sales Lab"
        title="Sales Intelligence Lab"
        description="Internal workspace for outreach planning, DM drafting, content prompts, and lead scoring. Demo workspace data only — not live financial reporting."
      />
      <SalesLabShell />
    </div>
  );
}
