export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { AcquisitionIntelligencePanel } from "@/components/dashboard/AcquisitionIntelligencePanel";

export default async function AcquisitionIntelligencePage() {
  await requireDashboardAccess();

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div
          className="text-[9px] font-mono uppercase tracking-[0.28em] mb-1"
          style={{ color: "rgba(212,175,55,0.5)" }}
        >
          Global Acquisition Intelligence
        </div>
        <h1 className="font-serif text-2xl">Acquisition Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Conversion confidence, high-value matter radar, country opportunity matrix, and abandoned intake recovery.
        </p>
      </div>
      <AcquisitionIntelligencePanel />
    </div>
  );
}
