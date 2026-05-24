"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Receipt,
  Truck,
  FolderOpen,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { usePortal } from "./portal-context";
import { CredentialTicker } from "@/components/landing/credential-ticker";

const NAV = [
  { href: "/portal", label: "My Matter", icon: ClipboardList },
  { href: "/portal/invoice", label: "Invoice", icon: Receipt },
  { href: "/portal/tracking", label: "Tracking", icon: Truck },
  { href: "/portal/documents", label: "Documents", icon: FolderOpen },
];

function LogoMark({ size = 32 }: { size?: number }) {
  const g = "#C6A55A";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
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

export function PortalShell({ children }: { children: ReactNode }) {
  const { deals, deal, activeDealId, setActiveDealId } = usePortal();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const pathname = usePathname();

  const sidebar = (onNav?: () => void) => (
    <>
      <div className="ps-brand">
        <LogoMark size={32} />
        <div>
          <div className="ps-brand-name">Milano Seal™</div>
          <div className="ps-brand-sub">Private Matter Access</div>
        </div>
      </div>

      {deals.length > 1 && (
        <div className="ps-switcher-wrap">
          <div className="ps-nav-sec ps-switcher-label">Your Matters</div>
          <button
            type="button"
            onClick={() => setSwitcherOpen((o) => !o)}
            className="ps-switcher-toggle"
          >
            <div className="ps-switcher-toggle-inner">
              <div className="ps-switcher-cur-name">
                {deal?.document_type ?? "Matter"}
              </div>
              <div className="ps-switcher-cur-id">
                {deal?.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 ps-chevron${switcherOpen ? " open" : ""}`}
            />
          </button>
          {switcherOpen && (
            <div className="ps-switcher-dd">
              {deals.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setActiveDealId(d.id);
                    setSwitcherOpen(false);
                    onNav?.();
                  }}
                  className="ps-switcher-item"
                  style={{
                    background:
                      d.id === activeDealId
                        ? "rgba(198,165,90,.10)"
                        : "transparent",
                    borderLeft:
                      d.id === activeDealId
                        ? "2px solid #C6A55A"
                        : "2px solid transparent",
                  }}
                >
                  <span className="ps-switcher-item-name">
                    {d.document_type ?? "Matter"}
                  </span>
                  <span className="ps-switcher-item-meta">
                    {d.destination_country ?? "—"} ·{" "}
                    {d.display_id?.slice(0, 8).toUpperCase() ?? d.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span
                    className="ps-switcher-item-status"
                    style={{
                      color: d.matter_status === "completed" ? "#4a9e6b" : "#C6A55A",
                    }}
                  >
                    {(d.matter_status ?? "").replace(/_/g, " ")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="ps-nav">
        <div className="ps-nav-sec">Navigation</div>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onNav}>
              <div className={`ps-btn ${active ? "active" : ""}`}>
                <Icon className="w-4 h-4" style={{ color: "#C6A55A" }} />
                {item.label}
              </div>
            </Link>
          );
        })}

        {deal?.matter_status && (
          <>
            <div className="ps-nav-sec" style={{ marginTop: 18 }}>
              Live Status
            </div>
            <div className="ps-status-wrap">
              <div className="ps-status-card">
                <div className="ps-status-row">
                  <div className="ps-notif" />
                  <span className="ps-status-l">
                    {deal.client_facing_status ?? deal.matter_status.replace(/_/g, " ")}
                  </span>
                </div>
                {deal.payment_status && (
                  <div className="ps-status-sub">
                    Payment · {deal.payment_status}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </nav>

      <div className="ps-foot">
        <div className="ps-foot-user">
          <div className="ps-avatar">
            {(deal?.client_name ?? "C").charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="ps-foot-name">
              {deal?.client_name ?? "Client"}
            </div>
            <div className="ps-foot-email">
              {deal?.display_id ? `#${deal.display_id.slice(0, 8).toUpperCase()}` : ""}
            </div>
          </div>
        </div>
        <form
          action="/api/auth/signout"
          method="post"
          className="ps-signout-form"
        >
          <button type="submit" className="ps-signout">
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="ps-bg">
      <div className="ps-ticker-fixed">
        <CredentialTicker />
      </div>
      <aside className={`ps-sb ${mobileOpen ? "open" : ""}`}>
        {sidebar(() => setMobileOpen(false))}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="ps-close-btn"
          style={{ display: mobileOpen ? "block" : "none" }}
        >
          <X className="w-4 h-4" />
        </button>
      </aside>

      {mobileOpen && (
        <div className="ps-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <div className="ps-main">
        <div className="ps-topbar">
          <div className="ps-topbar-left">
            <button
              type="button"
              className="ps-mobile-trigger"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="ps-tb-title">
                {NAV.find((n) =>
                  n.href === "/portal"
                    ? pathname === "/portal"
                    : pathname.startsWith(n.href),
                )?.label ?? "Portal"}
              </div>
              <div className="ps-tb-sub">
                The Milano Seal™ · Private Matter Access
              </div>
            </div>
          </div>
          {deal?.matter_status && (
            <div className="ps-topbar-status">
              <span className="ps-topbar-badge">
                {deal.client_facing_status ?? deal.matter_status.replace(/_/g, " ")}
              </span>
              {deal.payment_status === "paid" && (
                <span className="ps-topbar-badge-paid">Paid</span>
              )}
            </div>
          )}
        </div>

        <main className="ps-content">{children}</main>
      </div>
    </div>
  );
}
