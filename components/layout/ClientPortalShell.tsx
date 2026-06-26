import type { ReactNode } from "react";

export function ClientPortalShell({ children }: { children: ReactNode }) {
  return <div data-role-shell="client-portal">{children}</div>;
}
