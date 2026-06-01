import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { ReleaseControlCenter } from "@/components/dashboard/ReleaseControlCenter";

export const metadata = {
  title: "Release Control Center — Milano Seal",
};

export default async function ReleasesPage() {
  await requireDashboardAccess();
  return <ReleaseControlCenter />;
}
