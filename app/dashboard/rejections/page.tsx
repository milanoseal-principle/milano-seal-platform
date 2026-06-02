import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { RejectionIntelligence } from "@/components/dashboard/RejectionIntelligence";

export const metadata = {
  title: "Rejection Intelligence — Milano Seal",
};

export default async function RejectionsPage() {
  await requireDashboardAccess();
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <RejectionIntelligence />
    </div>
  );
}
