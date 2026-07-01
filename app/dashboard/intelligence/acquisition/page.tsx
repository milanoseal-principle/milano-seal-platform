export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { AcquisitionIntelligencePanel } from "@/components/dashboard/AcquisitionIntelligencePanel";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { Reveal } from "@/components/dashboard/system/DashboardMotion";

export default async function AcquisitionIntelligencePage() {
  await requireDashboardAccess();

  return (
    <div className="space-y-6 max-w-5xl">
      <Reveal>
        <DashboardPageHeader
          eyebrow="Global Acquisition Intelligence"
          title="Acquisition Intelligence"
          description="Lead-source and referral visibility — intake conversion, alliance applications, acquisition channels, and follow-up opportunities."
          primaryAction={{ label: "Review New Lead", href: "/dashboard/intake" }}
        />
      </Reveal>
      <Reveal delay={0.06}>
        <AcquisitionIntelligencePanel />
      </Reveal>
    </div>
  );
}
