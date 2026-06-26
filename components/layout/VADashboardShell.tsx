import type { ReactNode } from "react";

export function VADashboardShell({ children }: { children: ReactNode }) {
  return <div data-role-shell="va-execution-workbench">{children}</div>;
}
