export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { ComplianceIntelligenceFeed } from "@/components/dashboard/ComplianceIntelligenceFeed";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { Reveal } from "@/components/dashboard/system/DashboardMotion";

export default async function ComplianceIntelligencePage() {
  await requireDashboardAccess();

  return (
    <div className="space-y-6 max-w-3xl">
      <Reveal>
        <DashboardPageHeader
          eyebrow="Global Compliance Intelligence Engine"
          title="Compliance Intelligence"
          description="Country route coverage, manual review flags, RON risk, receiving-authority review, source freshness, and document-class risk. Operational routing snapshot only — final acceptance remains subject to the receiving authority."
          primaryAction={{ label: "Review Route Intelligence", href: "/dashboard/compliance" }}
        />
      </Reveal>
      <Reveal delay={0.06}>
        <ComplianceIntelligenceFeed />
      </Reveal>
    </div>
  );
}
