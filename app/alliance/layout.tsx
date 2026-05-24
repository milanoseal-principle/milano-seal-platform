import { ReactNode } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { requireAllianceAccess } from "@/lib/allianceAuth";

export const metadata = {
  title: "Alliance Partner Portal | The Milano Seal™",
};

const NAV = [
  { href: "/alliance/dashboard", label: "Overview" },
  { href: "/alliance/onboarding", label: "Onboarding" },
  { href: "/alliance/credentials", label: "Credentials" },
  { href: "/alliance/toolbelt", label: "Tool Belt" },
  { href: "/alliance/compliance", label: "Compliance" },
  { href: "/alliance/jobs", label: "Jobs" },
  { href: "/alliance/payouts", label: "Payouts" },
  { href: "/alliance/resources", label: "Resources" },
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

        <nav className="ap-nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="ap-nav-item">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="ap-content">{children}</div>
    </div>
  );
}
