import type { Metadata } from "next";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { FounderAccessBar } from "@/components/dashboard/FounderAccessBar";

export const metadata: Metadata = {
  title: "Admin — The Milano Seal™",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireDashboardAccess();
  return (
    <>
      {role === "founder_admin" && <FounderAccessBar />}
      {children}
    </>
  );
}
