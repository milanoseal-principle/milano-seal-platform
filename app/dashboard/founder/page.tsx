import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { FounderCommandCenter } from "@/components/founder/FounderCommandCenter";
export const dynamic = "force-dynamic";
export const metadata = { title: "Founder OS — The Milano Seal™", robots: { index: false } };
export default async function FounderDashboardPage() { await requireDashboardAccess(); return <main className="min-h-screen bg-[#05070b] px-4 py-8 text-white sm:px-6 lg:px-10 pb-[calc(2rem+env(safe-area-inset-bottom))]"><div className="mx-auto max-w-7xl"><FounderCommandCenter /></div></main>; }
