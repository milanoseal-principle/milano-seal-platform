import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { ReleaseControlCenter } from "@/components/dashboard/ReleaseControlCenter";

export const metadata = {
  title: "Release Control Center — Milano Seal",
};

export default async function ReleasesPage() {
  await requireDashboardAccess();
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <ReleaseControlCenter />
    </div>
  );
}
