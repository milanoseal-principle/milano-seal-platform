import type { ReactNode } from "react";

export function OperatorDashboardShell({ children }: { children: ReactNode }) {
  return <div data-role-shell="operator-command-center">{children}</div>;
}
