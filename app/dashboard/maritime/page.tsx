export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { MaritimeCommandCenter } from "@/components/dashboard/maritime/MaritimeCommandCenter";

export const metadata = {
  title: "Maritime — The Milano Seal™",
  robots: { index: false },
};

export default async function MaritimeDashboardPage() {
  await requireDashboardAccess();

  return (
    <div className="max-w-6xl space-y-6">
      <DashboardPageHeader
        eyebrow="Maritime & Global Logistics Vertical"
        title="Maritime Command"
        description="Time-sensitive document execution for maritime, customs, freight, shipping, and international logistics operations. Coordination and administrative support only."
      />

      <p className="rounded-xl border border-amber-300/20 bg-black/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-amber-200/70">
        Payment Gate Status: ENFORCED · Honest empty states shown where no real data exists
      </p>

      <MaritimeCommandCenter />
    </div>
  );
}
