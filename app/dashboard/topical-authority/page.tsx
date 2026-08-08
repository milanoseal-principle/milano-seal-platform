export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { TopicalAuthorityCommandCenter } from "@/components/dashboard/topical-authority/TopicalAuthorityCommandCenter";

export const metadata = {
  title: "Topical Authority — The Milano Seal™",
  robots: { index: false },
};

export default async function TopicalAuthorityDashboardPage() {
  await requireDashboardAccess();

  return (
    <div className="max-w-6xl space-y-6">
      <DashboardPageHeader
        eyebrow="Intelligence · Topical Authority"
        title="Topical Authority"
        description="Sixteen connected authority pillars mapped over existing service and Atlas country content. Internal-link and orphan intelligence. No fabricated rankings, traffic, or backlinks."
      />

      <TopicalAuthorityCommandCenter />
    </div>
  );
}
