import type { Metadata } from "next";
import { MilanoShell } from "@/components/dashboard/milano-shell";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { FounderAccessBar } from "@/components/dashboard/FounderAccessBar";

export const metadata: Metadata = {
  title: "Admin — The Milano Seal™",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await requireDashboardAccess();
  return (
    <MilanoShell>
      {role === "founder_admin" && <FounderAccessBar />}
      {children}
    </MilanoShell>
  );
}
