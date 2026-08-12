"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BadgeDollarSign,
  Boxes,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  Compass,
  FilePlus2,
  Handshake,
  PackageCheck,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Today", icon: Activity },
  { href: "/dashboard/command-center", label: "Command Center", icon: Compass },
  { href: "/dashboard/deals", label: "Matters", icon: BriefcaseBusiness },
  { href: "/dashboard/intake", label: "Intake", icon: FilePlus2 },
  { href: "/dashboard/dispatch", label: "Dispatch", icon: Boxes },
  { href: "/alliance/dashboard", label: "Alliance", icon: Handshake },
  { href: "/dashboard/compliance-atlas", label: "Compliance", icon: ClipboardCheck },
  { href: "/dashboard/discounts", label: "Payments", icon: BadgeDollarSign },
  { href: "/dashboard/packaging-delivery", label: "Packaging / Delivery", icon: PackageCheck },
  { href: "/dashboard/acquisition", label: "Acquisition", icon: Building2 },
  { href: "/dashboard/operator-spine", label: "Intelligence", icon: Activity },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function OperatorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-svh bg-[#050505] text-[#F6F1E6] md:grid md:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[#C6A55A]/10 bg-[#080808] md:flex md:min-h-svh md:flex-col md:sticky md:top-0 md:h-svh">
        <div className="border-b border-[#C6A55A]/10 px-5 py-6">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#C6A55A]">The Milano Seal™</div>
          <div className="mt-1 text-xs text-[#8e897f]">Operator Execution OS</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-all duration-200 ${
                  active
                    ? "border-[#C6A55A]/30 bg-[#C6A55A]/8 text-[#F6F1E6] shadow-[inset_2px_0_0_#C6A55A]"
                    : "border-transparent text-[#A8A29A] hover:border-[#C6A55A]/10 hover:bg-white/[0.02] hover:text-[#F6F1E6]"
                }`}
              >
                <Icon className="h-4 w-4 text-[#C6A55A] opacity-80" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#C6A55A]/10 px-5 py-4 text-[10px] font-mono uppercase tracking-[0.18em] text-[#6f6a61]">
          Milano Seal International LLC
        </div>
      </aside>

      <div className="min-w-0">
        <div className="sticky top-0 z-30 border-b border-[#C6A55A]/10 bg-[#050505]/90 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C6A55A]">Execution Center</div>
              <div className="text-xs text-[#8e897f]">Trust · Payment · Execution · Delivery</div>
            </div>
            <Link href="/dashboard/intake" className="rounded-md border border-[#C6A55A]/30 bg-[#C6A55A]/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#F6E8B8] transition hover:bg-[#C6A55A]/15">
              New Matter
            </Link>
          </div>
        </div>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-5 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
