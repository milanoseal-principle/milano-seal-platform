"use client";

import { ReactNode } from "react";
import Link from "next/link";
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
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/intake", label: "Intake", icon: FilePlus2 },
  { href: "/dashboard/deals", label: "Matters", icon: Briefcase },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/dashboard/compliance", label: "Compliance Map", icon: Globe2 },
  { href: "/dashboard/admin", label: "Command Center", icon: ShieldAlert },
  { href: "/dashboard/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/follow-ups", label: "Follow-ups", icon: ListTodo },
];

function MilanoMark() {
  return (
    <Link href="/dashboard">
      <div className="flex items-center gap-3 cursor-pointer group">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center font-serif text-lg font-semibold border flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(38 47% 56% / .15), hsl(38 30% 18% / .25))",
            borderColor: "hsl(38 47% 56% / .45)",
            color: "#C6A55A",
            boxShadow: "inset 0 0 0 1px hsl(38 47% 56% / .15)",
          }}
        >
          M
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="font-serif text-sm text-foreground">
            The Milano Seal
          </span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground truncate">
            Intl. Document Execution
          </span>
        </div>
      </div>
    </Link>
  );
}

export function MilanoShell({ children }: { children: ReactNode }) {
  const location = usePathname();

  return (
    <div className="min-h-screen flex text-foreground bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 w-56 flex flex-col border-r border-border bg-background">
        <div className="px-4 py-5 border-b border-border">
          <MilanoMark />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? location === "/dashboard"
                : location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  data-testid={`nav-${item.label
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
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
        </nav>

        {/* CTA */}
        <div className="px-3 pb-3">
          <Link href="/dashboard/intake" className="block">
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
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 ml-56">
        <main className="flex-1 px-8 md:px-12 py-8 pb-16">{children}</main>

        <footer className="border-t border-border ml-0">
          <div className="px-8 md:px-12 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
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
