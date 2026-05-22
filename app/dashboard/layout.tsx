import type { Metadata } from "next";
import { MilanoShell } from "@/components/dashboard/milano-shell";

export const metadata: Metadata = {
  title: "Admin — The Milano Seal™",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MilanoShell>{children}</MilanoShell>;
}
