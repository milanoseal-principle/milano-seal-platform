import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { RejectionIntelligence } from "@/components/dashboard/RejectionIntelligence";

export const metadata = {
  title: "Rejection Intelligence — Milano Seal",
};

export default async function RejectionsPage() {
  await requireDashboardAccess();
  return <RejectionIntelligence />;
}
