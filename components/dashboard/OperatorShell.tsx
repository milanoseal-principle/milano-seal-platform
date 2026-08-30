"use client";

import { MilanoOSShell, type MilanoOSNavItem } from "@/components/os/MilanoOSShell";

const NAV: MilanoOSNavItem[] = [
  { href: "/dashboard", label: "Today", icon: "activity", group: "Command", hint: "Live execution posture" },
  { href: "/dashboard/command-center", label: "Command Center", icon: "compass", group: "Command", hint: "Operator intelligence" },
  { href: "/dashboard/deals", label: "Matters", icon: "briefcase", group: "Execution", hint: "Canonical Matter records" },
  { href: "/dashboard/intake", label: "Intake", icon: "filePlus", group: "Execution", hint: "Secure Matter capture" },
  { href: "/dashboard/dispatch", label: "Dispatch", icon: "boxes", group: "Execution", hint: "Execution handoff" },
  { href: "/dashboard/review-requests", label: "Milano Review", icon: "clipboard", group: "Execution", hint: "Governed human review queue" },
  { href: "/dashboard/ron", label: "RON / BlueNotary", icon: "clipboard", group: "Execution", hint: "Schedule and manage remote online notarization" },
  { href: "/dashboard/packaging-delivery", label: "Packaging / Delivery", icon: "package", group: "Execution", hint: "Release and delivery" },
  { href: "/dashboard/compliance-atlas", label: "Compliance", icon: "clipboard", group: "Intelligence", hint: "Authority and pathway review" },
  { href: "/dashboard/reconciliation", label: "Reconciliation", icon: "activity", group: "Intelligence", hint: "Cross-domain Matter truth failures" },
  { href: "/dashboard/seo", label: "SEO Revenue", icon: "chart", group: "Intelligence", hint: "Search Console to paid Matter feedback" },
  { href: "/dashboard/acquisition", label: "Acquisition", icon: "building", group: "Intelligence", hint: "Commercial pipeline" },
  { href: "/dashboard/operator-spine", label: "Intelligence", icon: "activity", group: "Intelligence", hint: "Read-only operator context" },
  { href: "/dashboard/expansion", label: "Expansion", icon: "compass", group: "Intelligence", hint: "Institutional reconciliation, trust and network engines" },
  { href: "/dashboard/payments", label: "Payments", icon: "dollar", group: "Finance", hint: "Wise settlement truth" },
  { href: "/dashboard/payments/discounts", label: "Discount Codes", icon: "percent", group: "Finance", hint: "Governed courtesy controls" },
  { href: "/dashboard/payments/discounts/report", label: "Discount Report", icon: "chart", group: "Finance", hint: "Courtesy audit" },
  { href: "/alliance/dashboard", label: "Alliance", icon: "handshake", group: "Network", hint: "Partner execution workspace" },
  { href: "/dashboard/control-plane", label: "Control Plane", icon: "settings", group: "System", hint: "System registry, authorities, ownership and build placement" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings", group: "System", hint: "Platform configuration" },
];

function roleLabel(role?: string) {
  if (!role) return "Authenticated operator";
  return role.replaceAll("_", " ");
}

export function OperatorShell({ children, role }: { children: React.ReactNode; role?: string }) {
  return (
    <MilanoOSShell
      mode="operator"
      nav={NAV}
      eyebrow="Execution Intelligence"
      title="Execution Center"
      subtitle="Matter truth · payment integrity · execution · custody · release"
      brandSubtitle="Global Document Execution OS"
      identity={{ name: "Operator Workspace", meta: roleLabel(role) }}
      statusItems={[
        { label: "Data", value: "Canonical", tone: "green" },
        { label: "Payment", value: "Wise governed", tone: "gold" },
      ]}
      primaryAction={{ href: "/dashboard/intake", label: "New Matter" }}
      footerNote="Milano Seal International LLC · governed operator access"
      maxWidth={1600}
    >
      {children}
    </MilanoOSShell>
  );
}
