export const dynamic = "force-dynamic";

import { ReactNode } from "react";
import { requireVAAccess } from "@/lib/vaAuth";
import { VAWorkspaceShell } from "@/components/va/VAWorkspaceShell";

export default async function VALayout({ children }: { children: ReactNode }) {
  await requireVAAccess();
  return <VAWorkspaceShell>{children}</VAWorkspaceShell>;
}
