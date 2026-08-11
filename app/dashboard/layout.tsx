import type { Metadata } from "next";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { FounderAccessBar } from "@/components/dashboard/FounderAccessBar";
import { OperatorShell } from "@/components/dashboard/OperatorShell";

export const metadata: Metadata = {
  title: "Admin — The Milano Seal™",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireDashboardAccess();

  return (
    <OperatorShell>
      {role === "founder_admin" && <FounderAccessBar />}
      {children}
    </OperatorShell>
  );
}
