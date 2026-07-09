import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { TrustNetworkCommandCenter } from "@/components/dashboard/alliance/intelligence/TrustNetworkCommandCenter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Trust Network Intelligence — The Milano Seal™",
  robots: { index: false, follow: false },
};

export default async function TrustNetworkIntelligencePage() {
  await requireDashboardAccess();
  return (
    <main className="min-h-screen bg-[#05070b] px-4 py-8 text-white sm:px-6 lg:px-10 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-7xl">
        <TrustNetworkCommandCenter />
      </div>
    </main>
  );
}
