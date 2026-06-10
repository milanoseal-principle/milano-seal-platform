import type { Metadata } from "next";
import { ReactNode } from "react";
import { requireVAAccess } from "@/lib/vaAuth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VA Portal | The Milano Seal™",
  robots: { index: false, follow: false },
};

// Standalone layout — bypasses VAWorkspaceShell intentionally.
// /va/portal is a self-contained tactical interface with its own header/footer.
export default async function VAPortalLayout({ children }: { children: ReactNode }) {
  await requireVAAccess();
  return <>{children}</>;
}
