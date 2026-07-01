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
