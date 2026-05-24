"use client";

import { ReactNode } from "react";
import { PortalProvider } from "./portal-context";
import { PortalShell } from "./portal-shell";

export function PortalFrame({ children }: { children: ReactNode }) {
  return (
    <PortalProvider>
      <PortalShell>{children}</PortalShell>
    </PortalProvider>
  );
}
