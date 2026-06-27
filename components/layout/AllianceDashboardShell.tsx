import type { ReactNode } from "react";

export function AllianceDashboardShell({ children }: { children: ReactNode }) {
  return <div data-role-shell="alliance-partner-portal">{children}</div>;
}
