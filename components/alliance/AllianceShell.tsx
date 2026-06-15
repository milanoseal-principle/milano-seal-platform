import { ReactNode } from "react";
import { AllianceSidebar } from "./AllianceSidebar";
import { AllianceTopbar } from "./AllianceTopbar";

interface AllianceShellProps {
  children: ReactNode;
  partnerName?: string;
  firmName?: string;
  routingEligible?: boolean;
}

export function AllianceShell({
  children,
  partnerName,
  firmName,
  routingEligible = false,
}: AllianceShellProps) {
  return (
    <div
      className="ms-os-page"
      style={{
        display: "flex",
        minHeight: "100svh",
        background: "#050505",
        color: "#F6F1E6",
      }}
    >
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <AllianceSidebar partnerName={partnerName} routingEligible={routingEligible} />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AllianceTopbar
          partnerName={partnerName}
          firmName={firmName}
          routingEligible={routingEligible}
        />
        <main className="ms-alliance-content ms-safe-bottom" style={{ flex: 1, maxWidth: 1200, width: "100%" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
