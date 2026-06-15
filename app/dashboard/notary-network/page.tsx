import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { NotaryNetworkPanel } from "@/components/dashboard/NotaryNetworkPanel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notary Network — Milano Seal",
  robots: { index: false, follow: false },
};

export default async function NotaryNetworkPage() {
  await requireDashboardAccess();

  return (
    <main className="ms-os-page ms-safe-bottom min-h-screen bg-[#080808] px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="ms-os-atmosphere" aria-hidden="true" />
      <NotaryNetworkPanel />
    </main>
  );
}
