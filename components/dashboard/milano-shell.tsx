"use client";

import { ReactNode, useState, useEffect } from "react";
import { CredentialTicker } from "@/components/landing/credential-ticker";
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
  Menu,
  X,
  Terminal,
  Receipt,
  Scale,
  Target,
  TrendingUp,
  ShieldCheck,
  ClipboardList,
  Truck,
  Wrench,
  BookOpen,
  FileText,
  Zap,
  Layers,
  Radio,
  Activity,
  PlayCircle,
  AlertOctagon,
  ScrollText,
  BadgePercent,
  Sparkles,
  SearchCheck,
  Network,
  Landmark,
} from "lucide-react";


// Grouped command-center navigation. Every existing route is preserved; only the
// organization + a few labels change ("VA Tasks" -> "Execution Support"). The
// /dashboard/va route is unchanged technically — only its visible label.
const NAV_GROUPS: {
  group: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard }[];
}[] = [
  {
    group: "Command",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/intake", label: "Intake", icon: FilePlus2 },
      { href: "/dashboard/deals", label: "Matters", icon: Briefcase },
      { href: "/dashboard/pipeline", label: "Pipeline", icon: Kanban },
      { href: "/dashboard/follow-ups", label: "Follow-ups", icon: ListTodo },
      { href: "/dashboard/terminal", label: "Operator Terminal", icon: Terminal },
    ],
  },
  {
    group: "Control",
    items: [
      { href: "/dashboard/compliance", label: "Compliance", icon: Globe2 },
      { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
      { href: "/dashboard/courier", label: "Courier", icon: Truck },
    ],
  },
  {
    group: "Finance Admin",
    items: [
      { href: "/dashboard/admin", label: "Admin Control", icon: ShieldAlert },
      { href: "/dashboard/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/dashboard/admin/reconciliation", label: "Reconciliation", icon: Scale },
      { href: "/dashboard/discounts", label: "Discount Control", icon: BadgePercent },
    ],
  },

  {
    group: "Revenue Operations",
    items: [
      { href: "/dashboard/conversion", label: "Conversion Recovery", icon: TrendingUp },
      { href: "/dashboard/seo-revenue", label: "SEO Revenue", icon: SearchCheck },
      { href: "/dashboard/matter-ops", label: "Matter Ops QA", icon: ClipboardList },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { href: "/dashboard/intelligence/acquisition", label: "Acquisition", icon: Target },
      { href: "/dashboard/intelligence/revenue", label: "Revenue", icon: TrendingUp },
      { href: "/dashboard/intelligence/autopilot", label: "Autopilot", icon: Zap },
      { href: "/dashboard/intelligence/compliance", label: "Compliance Intel", icon: ShieldCheck },
      { href: "/dashboard/intelligence/sales-lab", label: "Sales Intelligence Lab", icon: Sparkles },
      { href: "/dashboard/government-intelligence", label: "Government Intelligence", icon: Landmark },
      { href: "/dashboard/acquisition", label: "Acquisition", icon: Target },
      { href: "/dashboard/jurisdictions", label: "Jurisdictions", icon: Globe2 },
    ],
  },
  {
    group: "Network",
    items: [
      { href: "/dashboard/referrals", label: "Referral Intelligence", icon: Network },
      { href: "/dashboard/va", label: "Execution Support", icon: ClipboardList },
      { href: "/dashboard/alliance/intelligence-platform", label: "Trust Network", icon: Network },
      { href: "/dashboard/dispatch", label: "Dispatch", icon: Network },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/dashboard/government", label: "Government", icon: Scale },
      { href: "/dashboard/matter-intelligence", label: "Matter Intelligence", icon: Layers },
      { href: "/dashboard/execution-jobs", label: "Execution Jobs", icon: PlayCircle },
      { href: "/dashboard/needs-review", label: "Needs Review", icon: AlertOctagon },
      { href: "/dashboard/stagnation", label: "Stagnation Alerts", icon: AlertOctagon },
      { href: "/dashboard/ledger", label: "Operational Ledger", icon: ScrollText },
      { href: "/dashboard/monitoring", label: "Monitoring", icon: Activity },
      { href: "/dashboard/founder", label: "Founder OS", icon: Activity },
      { href: "/dashboard/build-center", label: "Build Center", icon: Radio },
      { href: "/dashboard/tools", label: "Tools", icon: Wrench },
      { href: "/dashboard/sops", label: "SOPs", icon: BookOpen },
      { href: "/dashboard/docs/human-touch-trust-engine", label: "Trust Engine", icon: FileText },
    ],
  },
];

function MilanoCrest({ size = 32 }: { size?: number }) {
  const g = "var(--ms-gold)";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="46" style={{ stroke: g, strokeWidth: 1.8, fill: "none" }} />
      <path d="M60 20 C76 24 80 44 74 60 C68 50 62 45 56 43 C68 39 68 27 60 20Z" style={{ fill: g, opacity: 0.88 }} />
      <path d="M22,72 L22,28 L50,53" style={{ stroke: g, strokeWidth: 5.5, fill: "none", strokeLinecap: "butt" as const, strokeLinejoin: "miter" as const }} />
      <path d="M78,72 L78,28 L50,53" style={{ stroke: g, strokeWidth: 5.5, fill: "none", strokeLinecap: "butt" as const, strokeLinejoin: "miter" as const }} />
      <line x1="15" y1="28" x2="29" y2="28" style={{ stroke: g, strokeWidth: 3.5 }} />
      <line x1="15" y1="72" x2="29" y2="72" style={{ stroke: g, strokeWidth: 3.5 }} />
      <line x1="71" y1="28" x2="85" y2="28" style={{ stroke: g, strokeWidth: 3.5 }} />
      <line x1="71" y1="72" x2="85" y2="72" style={{ stroke: g, strokeWidth: 3.5 }} />
    </svg>
  );
}

function MilanoMark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <MilanoCrest size={32} />
      <div className="flex flex-col leading-tight min-w-0">
        <span className="font-serif text-sm text-foreground">The Milano Seal</span>
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground truncate">
          Intl. Document Execution
        </span>
      </div>
    </Link>
  );
}

function NavLinks({ onNav }: { onNav?: () => void }) {
  const location = usePathname();
  return (
    <>
      {NAV_GROUPS.map((group) => (
        <div key={group.group} className="mb-3">
          <p className="px-3 pb-1.5 pt-2 font-mono text-[8px] uppercase tracking-[0.24em] text-muted-foreground/60">
            {group.group}
          </p>
          {group.items.map((item) => {
            const isActive =
              item.href === "/dashboard" || item.href === "/dashboard/admin"
                ? location === item.href
                : location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onNav}>
                <div
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "text-primary bg-gold-soft border border-gold"
                      : "text-foreground/60 hover:text-foreground hover:bg-secondary/60 border border-transparent"
                  }`}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full"
                      style={{ background: "var(--ms-gold)" }}
                    />
                  )}
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

export function MilanoShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setUtcTime(
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "UTC" }) + " UTC"
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const sidebarContent = (onNav?: () => void) => (
    <>
      <div className="px-4 py-5 border-b border-border">
        <MilanoMark />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overscroll-y-contain">
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
              color: "var(--ms-gold)",
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
    <div className="min-h-screen flex text-foreground bg-background" style={{ minHeight: "100svh" }}>
      {/* Ticker: paddingTop clears notch/Dynamic Island (requires viewport-fit=cover) */}
      <div className="fixed top-0 left-0 right-0 z-50" style={{ paddingTop: "var(--sa-top)" }}>
        <CredentialTicker />
      </div>

      {/* ── Desktop sidebar — starts below ticker + safe-area ── */}
      <aside
        className="hidden lg:fixed lg:flex lg:bottom-0 lg:left-0 lg:z-40 lg:w-56 flex-col border-r border-border bg-background"
        style={{ top: "calc(3.25rem + var(--sa-top))" }}
      >
        {sidebarContent()}
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer — starts below ticker + safe-area ── */}
      <aside
        className={`fixed bottom-0 left-0 z-50 w-64 flex flex-col border-r border-border bg-background transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ top: "calc(3.25rem + var(--sa-top))" }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent(() => setMobileOpen(false))}
      </aside>

      {/* ── Main area — offset sidebar width + ticker + safe-area ── */}
      <div
        className="flex-1 flex flex-col min-w-0 lg:ml-56"
        style={{ paddingTop: "calc(3.25rem + var(--sa-top))" }}
      >
        {/* Mobile top bar — sticks below global ticker + safe-area */}
        <div
          className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background sticky z-30"
          style={{ top: "calc(3.25rem + var(--sa-top))" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <MilanoMark />
        </div>

        <main
          className="flex-1 px-4 md:px-8 lg:px-12 py-6 lg:py-8 overflow-x-hidden"
          style={{ paddingBottom: "max(4rem, calc(var(--sa-bottom) + 2rem))" }}
        >
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
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-[10px]" style={{ color: "rgba(212,175,55,0.5)" }}>
                {utcTime}
              </span>
              <span className="text-foreground/20">·</span>
              <span>Hague Apostille</span>
              <span className="text-foreground/40">·</span>
              <span>RON Active</span>
              <span className="text-foreground/40">·</span>
              <span>Courier Ready</span>
              <span className="text-foreground/40">·</span>
              <span>Custody Verified</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
