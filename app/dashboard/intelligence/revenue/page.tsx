export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { RevenueIntelligencePanel } from "@/components/dashboard/RevenueIntelligencePanel";

export default async function RevenueIntelligencePage() {
  await requireDashboardAccess();

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div
          className="text-[9px] font-mono uppercase tracking-[0.28em] mb-1"
          style={{ color: "rgba(212,175,55,0.5)" }}
        >
          Revenue Intelligence Infrastructure
        </div>
        <h1 className="font-serif text-2xl">Revenue Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Revenue breakdown by destination, document type, and service lane. Unpaid matter escalation.
        </p>
      </div>
      <RevenueIntelligencePanel />
    </div>
  );
}
