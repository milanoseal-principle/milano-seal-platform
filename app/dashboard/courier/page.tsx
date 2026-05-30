export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { CourierOperationsPanel } from "@/components/dashboard/courier/CourierOperationsPanel";

export const metadata = {
  title: "Courier Operations — The Milano Seal™",
  robots: { index: false },
};

export default async function CourierPage() {
  await requireDashboardAccess();

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div
          className="text-[9px] font-mono uppercase tracking-[0.28em] mb-1"
          style={{ color: "rgba(212,175,55,0.5)" }}
        >
          Courier Operations Center
        </div>
        <h1 className="font-serif text-2xl">Courier Operations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live shipment tracking, carrier readiness, and active matter transit status.
        </p>
      </div>
      <CourierOperationsPanel />
    </div>
  );
}
