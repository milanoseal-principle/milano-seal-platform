"use client";

import { ReactNode } from "react";
import { PortalProvider } from "./portal-context";
import { PortalShell } from "./portal-shell";
import { PortalOrderLedger } from "./PortalOrderLedger";

export function PortalFrame({ children }: { children: ReactNode }) {
  return (
    <PortalProvider>
      <PortalShell>
        <PortalOrderLedger />
        {children}
      </PortalShell>
    </PortalProvider>
  );
}
