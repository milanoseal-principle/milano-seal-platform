"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MilanoOSShell, type MilanoOSNavItem } from "@/components/os/MilanoOSShell";
import { MilanoStatusPulse } from "@/components/motion/MilanoMotion";

const NAV: MilanoOSNavItem[] = [
  { href: "/dashboard", label: "Today", icon: "activity", group: "Command", hint: "Live execution posture" },
  { href: "/dashboard/command-center", label: "Command Center", icon: "compass", group: "Command", hint: "Operator intelligence" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "activity", group: "Command", hint: "Action and exception truth" },
  { href: "/dashboard/deals", label: "Matters", icon: "briefcase", group: "Execution", hint: "Canonical Matter records" },
  { href: "/dashboard/intake", label: "Intake", icon: "filePlus", group: "Execution", hint: "Secure Matter capture" },
  { href: "/dashboard/dispatch", label: "Dispatch", icon: "boxes", group: "Execution", hint: "Execution handoff" },
  { href: "/dashboard/review-requests", label: "Milano Review", icon: "clipboard", group: "Execution", hint: "Governed human review queue" },
  { href: "/dashboard/scheduling-readiness", label: "Scheduling", icon: "activity", group: "Execution", hint: "Canonical scheduling readiness" },
  { href: "/dashboard/ron", label: "RON / BlueNotary", icon: "clipboard", group: "Execution", hint: "Schedule and manage remote online notarization" },
  { href: "/dashboard/apostille", label: "Apostille", icon: "clipboard", group: "Execution", hint: "Authentication and apostille state" },
  { href: "/dashboard/releases", label: "Release", icon: "package", group: "Execution", hint: "Final payment, custody and release" },
  { href: "/dashboard/packaging-delivery", label: "Packaging / Delivery", icon: "package", group: "Execution", hint: "Release and delivery" },
  { href: "/dashboard/completion", label: "Completion", icon: "activity", group: "Execution", hint: "Delivery evidence and close readiness" },
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

const EXECUTION_RAIL = [
  { href: "/dashboard/intake", label: "Intake" },
  { href: "/dashboard/scheduling-readiness", label: "Ready" },
  { href: "/dashboard/ron", label: "RON" },
  { href: "/dashboard/apostille", label: "Apostille" },
  { href: "/dashboard/releases", label: "Release" },
  { href: "/dashboard/packaging-delivery", label: "Delivery" },
  { href: "/dashboard/completion", label: "Close" },
] as const;

function roleLabel(role?: string) {
  if (!role) return "Authenticated operator";
  return role.replaceAll("_", " ");
}

function isRailActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ExecutionRail({ pathname }: { pathname: string }) {
  return (
    <div className="flex h-full min-h-[52px] items-center gap-3 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
      <div className="hidden shrink-0 items-center gap-2 pr-2 md:flex">
        <MilanoStatusPulse tone="active" />
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#C6A65B]/60">Execution Path</span>
      </div>
      <div className="flex min-w-max items-center gap-1.5">
        {EXECUTION_RAIL.map((step, index) => {
          const active = isRailActive(pathname, step.href);
          return (
            <div key={step.href} className="flex items-center gap-1.5">
              <Link
                href={step.href}
                className={`group flex min-h-9 items-center gap-2 rounded-full border px-3 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A65B]/60 ${active ? "border-[#C6A65B]/45 bg-[#C6A65B]/[0.09] text-[#E7CF98] shadow-[0_0_24px_rgba(198,166,91,0.08)]" : "border-white/[0.06] bg-black/20 text-white/35 hover:border-[#C6A65B]/20 hover:text-white/60"}`}
                aria-current={active ? "page" : undefined}
              >
                <span className={`font-mono text-[8px] ${active ? "text-[#C6A65B]" : "text-white/20"}`}>{String(index + 1).padStart(2, "0")}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">{step.label}</span>
              </Link>
              {index < EXECUTION_RAIL.length - 1 ? <span aria-hidden="true" className="h-px w-3 bg-gradient-to-r from-[#C6A65B]/20 to-white/[0.04] sm:w-5" /> : null}
            </div>
          );
        })}
      </div>
      <span className="ml-auto hidden shrink-0 font-mono text-[8px] uppercase tracking-[0.15em] text-white/20 xl:block">Navigation context only · canonical Matter truth remains authoritative</span>
    </div>
  );
}

export function OperatorShell({ children, role }: { children: React.ReactNode; role?: string }) {
  const pathname = usePathname();

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
      topStrip={<ExecutionRail pathname={pathname} />}
    >
      {children}
    </MilanoOSShell>
  );
}
