export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { CourierOperationsPanel } from "@/components/dashboard/courier/CourierOperationsPanel";
import { ShippingControlDeck } from "@/components/dashboard/courier/ShippingControlDeck";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { Reveal } from "@/components/dashboard/system/DashboardMotion";

export const metadata = {
  title: "Shipping Control Room — The Milano Seal™",
  robots: { index: false },
};

export default async function CourierPage() {
  await requireDashboardAccess();

  return (
    <div className="max-w-7xl">
      <Reveal>
        <DashboardPageHeader
          eyebrow="International Release Operations"
          title="Shipping Control Room"
          description="Carrier policy, release readiness, custody handoff, live shipment evidence and international delivery review. Delivery does not equal release — final release remains gated."
          primaryAction={{ label: "Review Matter", href: "/dashboard/deals" }}
        />
      </Reveal>
      <Reveal delay={0.04}>
        <ShippingControlDeck />
      </Reveal>
      <Reveal delay={0.08}>
        <CourierOperationsPanel />
      </Reveal>
    </div>
  );
}
