import { SeoEditorialQueue } from "@/components/dashboard/SeoEditorialQueue";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
export const metadata = { title: "SEO Authority Review | The Milano Seal™" };
export default async function SeoEditorialPage() { await requireDashboardAccess(); return <main className="min-h-screen bg-[#050507] p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:p-8"><SeoEditorialQueue /></main>; }
