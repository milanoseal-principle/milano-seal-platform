import { ProductionCertificationPanel } from "@/components/dashboard/ProductionCertificationPanel";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
export const metadata = { title: "Production Certification | The Milano Seal™" };
export default async function CertificationPage() { await requireDashboardAccess(); return <main className="min-h-screen bg-[#050507] p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:p-8"><ProductionCertificationPanel /></main>; }
