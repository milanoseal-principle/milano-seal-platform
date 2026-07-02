export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { RevenueIntelligencePanel } from "@/components/dashboard/RevenueIntelligencePanel";
import { PartnerScorecard } from "@/components/dashboard/PartnerScorecard";
import { PayoutReviewPanel } from "@/components/dashboard/PayoutReviewPanel";
import { IntelligenceCommandCenter2 } from "@/components/dashboard/IntelligenceCommandCenter2";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { Reveal } from "@/components/dashboard/system/DashboardMotion";

export default async function RevenueIntelligencePage() {
  await requireDashboardAccess();

  return (
    <div className="space-y-6 max-w-5xl">
      <Reveal>
        <DashboardPageHeader
          eyebrow="Revenue Intelligence Infrastructure"
          title="Revenue Intelligence"
          description="Quoted pipeline, awaiting payment, cleared payments, completed matters, unpaid balances, and reconciliation issues by destination and service lane."
          primaryAction={{ label: "Review Payment Queue", href: "/dashboard/admin/payments" }}
        />
      </Reveal>
      <RevenueIntelligencePanel />
      <div
        className="rounded-sm px-5 py-5"
        style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.28em] mb-4" style={{ color: "rgba(212,175,55,0.5)" }}>
          Partner Scorecard
        </div>
        <PartnerScorecard scores={[]} />
      </div>
      <div
        className="rounded-sm px-5 py-5"
        style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
      >
        <PayoutReviewPanel items={[]} />
      </div>
      <IntelligenceCommandCenter2 />
    </div>
  );
}
