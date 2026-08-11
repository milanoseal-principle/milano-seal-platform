export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { CommercialCommandCenter } from "@/components/dashboard/commercial/CommercialCommandCenter";

export const metadata = {
  title: "Commercial — The Milano Seal™",
  robots: { index: false },
};

export default async function CommercialDashboardPage() {
  await requireDashboardAccess();

  return (
    <div className="max-w-6xl space-y-6">
      <DashboardPageHeader
        eyebrow="Commercial · Vertical Intelligence"
        title="Commercial Command"
        description="One configuration-driven framework across fifteen verticals — organizations, commercial accounts, relationships, authority, and pipeline. Real revenue requires verified payment; forecasts are labelled planning scenarios."
      />

      <CommercialCommandCenter />
    </div>
  );
}
