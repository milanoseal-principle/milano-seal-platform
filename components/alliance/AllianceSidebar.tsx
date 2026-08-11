"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  ShieldCheck,
  GitFork,
  FileStack,
  Wallet,
  Gift,
  User,
  HeadphonesIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/alliance/dashboard", label: "Alliance Desk", icon: LayoutDashboard },
  { href: "/alliance/toolbelt", label: "Tool Belt", icon: Wrench },
  { href: "/alliance/benefits", label: "Benefits", icon: Gift },
  { href: "/alliance/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/alliance/referrals", label: "Referrals", icon: GitFork },
  { href: "/alliance/matters", label: "Matters", icon: FileStack },
  { href: "/alliance/payouts", label: "Payouts", icon: Wallet },
  { href: "/alliance/profile", label: "Profile", icon: User },
  { href: "/alliance/support", label: "Support", icon: HeadphonesIcon },
];

interface AllianceSidebarProps {
  partnerName?: string;
  routingEligible?: boolean;
}

export function AllianceSidebar({ partnerName, routingEligible }: AllianceSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col"
      style={{
        width: 220,
        minHeight: "100vh",
        background: "#080808",
        borderRight: "1px solid rgba(198,166,91,0.12)",
        padding: "0",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid rgba(198,166,91,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            color: "#C6A55A",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: 2,
          }}
        >
          The Milano Seal™
        </div>
        <div style={{ fontSize: 10, color: "#A8A29A", letterSpacing: "0.12em" }}>
          Global Execution Alliance
        </div>
      </div>

      {partnerName && (
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid rgba(198,166,91,0.08)",
          }}
        >
          <div style={{ fontSize: 10, color: "#A8A29A", marginBottom: 2 }}>Signed in as</div>
          <div
            style={{
              fontSize: 13,
              color: "#F6F1E6",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {partnerName}
          </div>
        </div>
      )}

      <nav style={{ flex: 1, padding: "12px 0" }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 20px",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? "#C6A55A" : "#A8A29A",
                background: active ? "rgba(198,166,91,0.06)" : "transparent",
                borderLeft: active ? "2px solid #C6A55A" : "2px solid transparent",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(198,166,91,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {routingEligible ? (
          <>
            <CheckCircle2 size={13} color="#3FA47A" />
            <span style={{ fontSize: 11, color: "#3FA47A" }}>Routing Active</span>
          </>
        ) : (
          <>
            <XCircle size={13} color="#B85C5C" />
            <span style={{ fontSize: 11, color: "#B85C5C" }}>Routing Locked</span>
          </>
        )}
      </div>
    </aside>
  );
}
