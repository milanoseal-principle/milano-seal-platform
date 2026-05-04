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
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/intake", label: "Intake", icon: FilePlus2 },
  { href: "/dashboard/deals", label: "Matters", icon: Briefcase },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/dashboard/compliance", label: "Compliance Map", icon: Globe2 },
  { href: "/dashboard/admin", label: "Command Center", icon: ShieldAlert },
  { href: "/dashboard/follow-ups", label: "Follow-ups", icon: ListTodo },
];

function MilanoMark() {
  return (
    <Link href="/dashboard">
      <div className="flex items-center gap-3 cursor-pointer group">
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center font-serif text-xl font-semibold border"
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
        <div className="flex flex-col leading-tight">
          <span className="font-serif text-base text-foreground">
            The Milano Seal
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            International Document Execution
          </span>
        </div>
      </div>
    </Link>
  );
}

export function MilanoShell({ children }: { children: ReactNode }) {
  const location = usePathname();

  return (
    <div className="min-h-screen w-full text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-[1480px] mx-auto px-4 md:px-8 h-16 flex items-center gap-6">
          <MilanoMark />
          <nav className="hidden md:flex items-center gap-1 ml-4">
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "text-primary bg-gold-soft border border-gold"
                        : "text-foreground/70 hover:text-foreground hover:bg-secondary/60 border border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden lg:flex flex-col text-right leading-tight">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Notary &amp; Apostille Coordinator
              </span>
              <span className="text-xs text-foreground/80">
                Nicholas Milano · FL #668288
              </span>
            </div>
            <Link href="/dashboard/intake">
              <Button
                data-testid="cta-begin-execution"
                className="bg-primary text-primary-foreground hover:bg-primary/90 gold-glow font-medium"
              >
                Begin Execution <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <form action="/api/auth/signout" method="post">
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                title="Sign out"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
        <div className="gold-rule" />
      </header>

      <main className="max-w-[1480px] mx-auto px-4 md:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-border mt-16">
        <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-muted-foreground">
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
  );
}
