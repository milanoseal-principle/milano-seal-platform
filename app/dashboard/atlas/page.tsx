import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { AtlasGovernancePanel } from "@/components/dashboard/AtlasGovernancePanel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Atlas Source Governance | The Milano Seal™",
  robots: { index: false, follow: false },
};

export default async function AtlasGovernancePage() {
  await requireDashboardAccess();

  return <AtlasGovernancePanel />;
}
