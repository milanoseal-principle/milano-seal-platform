"use client";

import { MilanoOSShell, type MilanoOSNavItem } from "@/components/os/MilanoOSShell";

const NAV: MilanoOSNavItem[] = [
  { href: "/dashboard", label: "Today", icon: "activity", group: "Matter", hint: "Live Matter posture" },
  { href: "/dashboard/deals", label: "Matters", icon: "briefcase", group: "Matter", hint: "Canonical Matter records" },
  { href: "/dashboard/intake", label: "Intake", icon: "filePlus", group: "Matter", hint: "Secure Matter capture" },
  { href: "/dashboard/review-requests", label: "Milano Review", icon: "clipboard", group: "Matter", hint: "Governed human review queue" },
  { href: "/dashboard/reconciliation", label: "Reconciliation", icon: "activity", group: "Matter", hint: "Cross-domain Matter truth failures" },
  { href: "/dashboard/recovery", label: "Recovery", icon: "activity", group: "Matter", hint: "Exception and recovery command" },

  { href: "/dashboard/dispatch", label: "Dispatch", icon: "boxes", group: "Execution", hint: "Execution handoff" },
  { href: "/dashboard/scheduling-readiness", label: "Scheduling", icon: "activity", group: "Execution", hint: "Canonical scheduling readiness" },
  { href: "/dashboard/ron", label: "RON / BlueNotary", icon: "clipboard", group: "Execution", hint: "Remote online notarization readiness and execution" },
  { href: "/dashboard/apostille", label: "Apostille", icon: "clipboard", group: "Execution", hint: "Authentication and apostille state" },
  { href: "/dashboard/releases", label: "Release", icon: "package", group: "Execution", hint: "Final payment, custody and release" },
  { href: "/dashboard/packaging-delivery", label: "Packaging / Delivery", icon: "package", group: "Execution", hint: "Release and delivery" },
  { href: "/dashboard/completion", label: "Completion", icon: "activity", group: "Execution", hint: "Delivery evidence and close readiness" },

  { href: "/dashboard/corridors", label: "Corridor Command", icon: "compass", group: "Corridor", hint: "Origin-to-destination execution scale posture" },
  { href: "/dashboard/compliance-atlas", label: "Authority Atlas", icon: "clipboard", group: "Corridor", hint: "Authority and pathway review" },
  { href: "/dashboard/intelligence/freshness", label: "Freshness", icon: "activity", group: "Corridor", hint: "Authority intelligence freshness" },
  { href: "/dashboard/alliance/ron-coverage", label: "RON Coverage", icon: "compass", group: "Corridor", hint: "State coverage and notary credential readiness" },
  { href: "/dashboard/alliance/quality", label: "Alliance Capacity", icon: "handshake", group: "Corridor", hint: "Partner quality and capacity evidence" },

  { href: "/dashboard/command-center", label: "Command Center", icon: "compass", group: "Intelligence", hint: "Operator intelligence" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "activity", group: "Intelligence", hint: "Action and exception truth" },
  { href: "/dashboard/operator-spine", label: "Operator Intelligence", icon: "activity", group: "Intelligence", hint: "Read-only operator context" },
  { href: "/dashboard/professional360", label: "Professional360", icon: "building", group: "Intelligence", hint: "Governed professional account read model" },
  { href: "/today/professional", label: "Professional Day", icon: "activity", group: "Intelligence", hint: "Relationship development priority" },
  { href: "/dashboard/economics", label: "Economics", icon: "chart", group: "Intelligence", hint: "Observed Matter and corridor economics" },
  { href: "/dashboard/trust", label: "Trust", icon: "activity", group: "Intelligence", hint: "Evidence-classified lifecycle trust" },
  { href: "/dashboard/seo", label: "SEO Revenue", icon: "chart", group: "Intelligence", hint: "Search Console to paid Matter feedback" },
  { href: "/dashboard/acquisition", label: "Acquisition", icon: "building", group: "Intelligence", hint: "Commercial pipeline" },
  { href: "/dashboard/expansion", label: "Expansion", icon: "compass", group: "Intelligence", hint: "Institutional reconciliation, trust and network engines" },
  { href: "/dashboard/executive", label: "Executive", icon: "chart", group: "Intelligence", hint: "Matter Execution Corridor executive view" },

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
      eyebrow="Matter · Execution · Corridor"
      title="Milano Execution Center"
      subtitle="Canonical Matter truth → governed execution → destination corridor intelligence"
      brandSubtitle="Global Document Execution OS"
      identity={{ name: "Operator Workspace", meta: roleLabel(role) }}
      statusItems={[
        { label: "Matter", value: "Canonical", tone: "green" },
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
