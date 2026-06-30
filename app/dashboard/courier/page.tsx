export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { CourierOperationsPanel } from "@/components/dashboard/courier/CourierOperationsPanel";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { Reveal } from "@/components/dashboard/system/DashboardMotion";

export const metadata = {
  title: "Courier & Release Control — The Milano Seal™",
  robots: { index: false },
};

export default async function CourierPage() {
  await requireDashboardAccess();

  return (
    <div className="max-w-5xl">
      <Reveal>
        <DashboardPageHeader
          eyebrow="Courier Operations Center"
          title="Courier & Release Control"
          description="Live shipment tracking, carrier readiness, release-gate watch, and active matter transit status. Delivery does not equal release — final release remains gated."
          primaryAction={{ label: "Review Shipment", href: "/dashboard/deals" }}
        />
      </Reveal>
      <Reveal delay={0.06}>
        <CourierOperationsPanel />
      </Reveal>
    </div>
  );
}
