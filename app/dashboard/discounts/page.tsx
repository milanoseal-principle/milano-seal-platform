import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DiscountCodeManager } from "@/components/dashboard/DiscountCodeManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Discount Codes — Milano Seal",
  robots: { index: false, follow: false },
};

export default async function DiscountsPage() {
  const { role } = await requireDashboardAccess();

  const founderRoles = new Set(["founder", "founder_admin", "admin", "admin_operator", "ops_manager"]);
  if (!founderRoles.has(role)) {
    return (
      <main className="min-h-screen bg-[#080808] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-xl text-center pt-24">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#C6A55A]/50 mb-4">Access Restricted</p>
          <p className="text-sm text-white/30">Discount code management is restricted to founder and admin roles.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="ms-os-page ms-safe-bottom min-h-screen bg-[#080808] px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="ms-os-atmosphere" aria-hidden="true" />
      <DiscountCodeManager />
    </main>
  );
}
