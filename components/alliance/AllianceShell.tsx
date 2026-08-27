"use client";

import type { ReactNode } from "react";
import { MilanoOSShell, type MilanoOSNavItem } from "@/components/os/MilanoOSShell";

const ALLIANCE_NAV: MilanoOSNavItem[] = [
  { href: "/alliance/dashboard", label: "Alliance Desk", icon: "layout", group: "Command", hint: "Partner execution posture" },
  { href: "/alliance/toolbelt", label: "Tool Belt", icon: "wrench", group: "Command", hint: "Execution resources" },
  { href: "/alliance/benefits", label: "Benefits", icon: "gift", group: "Partnership", hint: "Alliance program access" },
  { href: "/alliance/compliance", label: "Compliance", icon: "shield", group: "Partnership", hint: "Readiness requirements" },
  { href: "/alliance/referrals", label: "Referrals", icon: "gitFork", group: "Matter Flow", hint: "Governed Matter handoff" },
  { href: "/alliance/matters", label: "Matters", icon: "files", group: "Matter Flow", hint: "Shared Matter visibility" },
  { href: "/alliance/payouts", label: "Payouts", icon: "wallet", group: "Account", hint: "Eligible payment visibility" },
  { href: "/alliance/profile", label: "Profile", icon: "user", group: "Account", hint: "Partner profile" },
  { href: "/alliance/support", label: "Support", icon: "headphones", group: "Account", hint: "Execution support" },
];

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
  const organization = firmName ?? "Alliance Organization";
  const member = partnerName ?? "Alliance Member";

  const sidebarContext = (
    <div className="ms-os-context-card">
      <div className="ms-os-context-label">Alliance Account</div>
      <div className="ms-os-context-title">{organization}</div>
      <div className="ms-os-context-meta">{member}</div>
      <div className="mt-3 flex items-center justify-between gap-3 text-[9px] uppercase tracking-[0.13em] text-white/35">
        <span>Execution routing</span>
        <strong className={routingEligible ? "font-medium text-emerald-300/75" : "font-medium text-red-300/70"}>
          {routingEligible ? "Active" : "Locked"}
        </strong>
      </div>
    </div>
  );

  return (
    <MilanoOSShell
      mode="alliance"
      nav={ALLIANCE_NAV}
      eyebrow="Global Execution Alliance"
      title="Alliance Workspace"
      subtitle="Partner readiness · Matter handoff · execution visibility"
      brandSubtitle="Global Execution Alliance"
      sidebarContext={sidebarContext}
      identity={{ name: member, meta: organization }}
      statusItems={[
        {
          label: "Routing",
          value: routingEligible ? "Active" : "Locked",
          tone: routingEligible ? "green" : "red",
        },
        { label: "Access", value: "Partner", tone: "gold" },
      ]}
      footerNote="Alliance access · Matter boundaries and protected actions enforced"
      maxWidth={1440}
    >
      {children}
    </MilanoOSShell>
  );
}
