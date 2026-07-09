import { ClientPortalShell } from "@/components/portal2/ClientPortalShell";
export const dynamic = "force-dynamic";
export const metadata = { title: "Matter Control Portal 2.0 — The Milano Seal™", robots: { index: false } };
export default function PortalV2Page() { return <main className="min-h-screen bg-[#05070b] px-4 py-8 text-white sm:px-6 lg:px-10 pb-[calc(2rem+env(safe-area-inset-bottom))]"><div className="mx-auto max-w-7xl"><ClientPortalShell /></div></main>; }
