export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { HighValueAssetCommandCenter } from "@/components/high-value-assets/HighValueAssetCommandCenter";

export const metadata = {
  title: "High-Value Assets — The Milano Seal™",
  robots: { index: false },
};

export default async function HighValueAssetsDashboardPage() {
  await requireDashboardAccess();

  return (
    <div className="max-w-6xl space-y-6">
      <DashboardPageHeader
        eyebrow="High-Value Asset Intelligence · extends Maritime"
        title="High-Value Assets"
        description="Document-execution, notarization, apostille, and entity-authority routing for vessels, aircraft, exotic vehicles, art, and other high-value assets. Document execution support only — not an ownership, title, customs, insurance, or regulatory-approval service."
      />

      <p className="rounded-xl border border-amber-300/20 bg-black/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-amber-200/70">
        Payment Gate Status: ENFORCED · Review-dependent workflows · Honest empty states
      </p>

      <HighValueAssetCommandCenter />
    </div>
  );
}
