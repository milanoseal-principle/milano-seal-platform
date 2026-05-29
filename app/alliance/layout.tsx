import { ReactNode } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { requireAllianceAccess } from "@/lib/allianceAuth";

export const metadata = {
  title: "Alliance Partner Portal | The Milano Seal™",
  robots: { index: false, follow: false },
};

const NAV_GROUPS = [
  {
    label: "ASSIGNED WORK",
    items: [
      { href: "/alliance/dashboard", label: "Overview" },
      { href: "/alliance/jobs", label: "Dispatch Queue" },
      { href: "/alliance/onboarding", label: "Required Actions" },
    ],
  },
  {
    label: "DOCUMENTS",
    items: [
      { href: "/alliance/credentials", label: "Document Status" },
      { href: "/alliance/resources", label: "Secure Exchange" },
    ],
  },
  {
    label: "COORDINATION",
    items: [
      { href: "/alliance/compliance", label: "Compliance" },
      { href: "/alliance/payouts", label: "Payouts" },
      { href: "/alliance/toolbelt", label: "Partner SOPs" },
    ],
  },
];

export default async function AllianceLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAllianceAccess();

  return (
    <div className="ap-shell">
      <header className="ap-topbar">
        <div className="ap-brand">
          <div className="ap-brand-mark">
            <Shield size={16} color="#1a0e00" strokeWidth={2.5} />
          </div>
          <div>
            <div className="ap-brand-name">The Milano Seal™</div>
            <div className="ap-brand-sub">Alliance Partner Portal</div>
          </div>
        </div>

        {/* Desktop nav — grouped with subtle separators */}
        <nav className="ap-nav hidden md:flex items-center gap-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex items-center gap-1">
              <span
                className="text-[8px] font-mono tracking-[0.2em] mr-1 opacity-50"
                style={{ color: "currentColor" }}
              >
                {group.label}
              </span>
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className="ap-nav-item">
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Mobile nav — horizontal scrollable strip, no group headers */}
        <nav className="ap-nav flex md:hidden items-center gap-1 overflow-x-auto">
          {NAV_GROUPS.flatMap((group) =>
            group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="ap-nav-item whitespace-nowrap flex-shrink-0"
              >
                {item.label}
              </Link>
            ))
          )}
        </nav>
      </header>

      <div className="ap-content">{children}</div>
    </div>
  );
}
