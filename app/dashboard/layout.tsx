import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MilanoShell } from "@/components/dashboard/milano-shell";
import { getActorContext } from "@/lib/auth-guards";

export const metadata: Metadata = {
  title: "Admin — The Milano Seal™",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getActorContext();
  if (!actor || (actor.role !== "admin" && actor.role !== "operator")) {
    redirect("/login");
  }

  return <MilanoShell>{children}</MilanoShell>;
}
