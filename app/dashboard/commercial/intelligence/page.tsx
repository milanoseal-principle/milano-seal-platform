export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { ExecutiveIntelligence } from "@/components/dashboard/commercial/intelligence/ExecutiveIntelligence";

export const metadata = {
  title: "Relationship Intelligence — The Milano Seal™",
  robots: { index: false },
};

export default async function CommercialIntelligencePage() {
  await requireDashboardAccess();

  return (
    <div className="max-w-6xl space-y-6">
      <DashboardPageHeader
        eyebrow="Commercial · Relationship Intelligence"
        title="Relationship Intelligence"
        description="A read-only executive decision layer over the canonical engines (Organizations, Matters, Payments, Referrals, Verticals). It answers six executive questions with evidence and confidence — verified revenue is never mixed with planning signals."
      />

      <ExecutiveIntelligence />
    </div>
  );
}
