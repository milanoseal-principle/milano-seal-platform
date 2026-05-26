export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { ComplianceIntelligenceFeed } from "@/components/dashboard/ComplianceIntelligenceFeed";

export default async function ComplianceIntelligencePage() {
  await requireDashboardAccess();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div
          className="text-[9px] font-mono uppercase tracking-[0.28em] mb-1"
          style={{ color: "rgba(212,175,55,0.5)" }}
        >
          Global Compliance Intelligence Engine
        </div>
        <h1 className="font-serif text-2xl">Compliance Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Active compliance alerts derived from open matters. Apostille dependencies, translation requirements, multi-country routing.
          Procedural guidance only — not legal advice.
        </p>
      </div>
      <ComplianceIntelligenceFeed />
    </div>
  );
}
