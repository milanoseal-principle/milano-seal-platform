import type { Metadata } from "next";
import { ReactNode } from "react";
import { requireVAAccess } from "@/lib/vaAuth";
import { VAWorkspaceShell } from "@/components/va/VAWorkspaceShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VA Workspace | The Milano Seal™",
  robots: { index: false, follow: false },
};

export default async function VALayout({ children }: { children: ReactNode }) {
  await requireVAAccess();
  return <VAWorkspaceShell>{children}</VAWorkspaceShell>;
}
