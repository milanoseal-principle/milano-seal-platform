"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FilePlus2,
  Briefcase,
  Kanban,
  Globe2,
  ShieldAlert,
  ListTodo,
  ArrowRight,
  LogOut,
  CreditCard,
  Menu,
  X,
  Terminal,
  Receipt,
} from "lucide-react";

const NAV = [
  { href: "/dashboard/admin", label: "Command Center", icon: ShieldAlert },
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/intake", label: "Intake", icon: FilePlus2 },
  { href: "/dashboard/deals", label: "Matters", icon: Briefcase },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/dashboard/compliance", label: "Global Document Intelligence", icon: Globe2 },
  { href: "/dashboard/invoices", label: "Invoice Studio", icon: Receipt },
  { href: "/dashboard/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/follow-ups", label: "Follow-ups", icon: ListTodo },
  { href: "/dashboard/terminal", label: "Operational Ledger", icon: Terminal },
];

function MilanoMark() {
  return (
    <Link href="/dashboard">
      <Image
        src="/milano-seal-gold-transparent-512.png"
        alt="The Milano Seal"
        width={160}
        height={40}
        style={{ height: "40px", width: "auto" }}
        priority
      />
    </Link>
  );
}

function NavLinks({ onNav }: { onNav?: () => void }) {
  const location = usePathname();
  return (
    <>
      {NAV.map((item) => {
        const isActive =
          item.href === "/dashboard" || item.href === "/dashboard/admin"
            ? location === item.href
            : location.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} onClick={onNav}>
            <div
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? "text-primary bg-gold-soft border border-gold"
                  : "text-foreground/60 hover:text-foreground hover:bg-secondary/60 border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </div>
          </Link>
        );
      })}
    </>
  );
}

export function MilanoShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (onNav?: () => void) => (
    <>
      <div className="px-4 py-5 border-b border-border">
        <MilanoMark />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NavLinks onNav={onNav} />
      </nav>

      {/* CTA */}
      <div className="px-3 pb-3">
        <Link href="/dashboard/intake" className="block" onClick={onNav}>
          <Button
            data-testid="cta-begin-execution"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gold-glow font-medium text-sm"
          >
            Begin Execution <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Operator info + sign out */}
      <div className="border-t border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{
              background: "hsl(38 47% 56% / .15)",
              border: "1px solid hsl(38 47% 56% / .35)",
              color: "#C6A55A",
            }}
          >
            NM
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium text-foreground">
              Nicholas Milano
            </span>
            <span className="text-[10px] text-muted-foreground">
              FL Notary #668288
            </span>
          </div>
        </div>
        <div className="px-3 pb-3">
          <form action="/api/auth/signout" method="post">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground text-xs h-8"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex text-foreground bg-background">
      {/* ── Desktop sidebar — starts below ticker ── */}
      <aside className="hidden lg:fixed lg:flex lg:top-9 lg:bottom-0 lg:left-0 lg:z-40 lg:w-56 flex-col border-r border-border bg-background">
        {sidebarContent()}
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer — starts below ticker ── */}
      <aside
        className={`fixed top-9 bottom-0 left-0 z-50 w-64 flex flex-col border-r border-border bg-background transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent(() => setMobileOpen(false))}
      </aside>

      {/* ── Main area — offset sidebar width + ticker height ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-56 pt-9">
        {/* Mobile top bar — sticks below global ticker */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background sticky top-9 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <MilanoMark />
        </div>

        <main className="flex-1 px-4 md:px-8 lg:px-12 py-6 lg:py-8 pb-16 overflow-x-hidden">
          {children}
        </main>

        <footer className="border-t border-border">
          <div className="px-4 md:px-8 lg:px-12 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gold font-serif">The Milano Seal</span>
              <span>
                · Milano Seal International LLC · Florida Notary #668288
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>Hague Apostille</span>
              <span className="text-foreground/40">·</span>
              <span>RON Approved</span>
              <span className="text-foreground/40">·</span>
              <span>Mobile Florida</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
