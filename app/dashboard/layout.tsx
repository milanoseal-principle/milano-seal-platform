import type { Metadata } from "next";
import { MilanoShell } from "@/components/dashboard/milano-shell";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const metadata: Metadata = {
  title: "Admin — The Milano Seal™",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireDashboardAccess();
  return <MilanoShell>{children}</MilanoShell>;
}
