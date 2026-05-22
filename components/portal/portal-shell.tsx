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
  const imgH = Math.round(size * (383 / 275));
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, overflow: "hidden", flexShrink: 0, position: "relative" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/milano-seal-gold-transparent-512.png"
        alt=""
        style={{
          height: imgH,
          width: "auto",
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
    </div>
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
          <div className="ps-brand-sub">Secure Matter Control Portal</div>
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
                    {d.destination_country ?? d.country ?? "—"} ·{" "}
                    {d.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span
                    className="ps-switcher-item-status"
                    style={{
                      color: d.status === "completed" ? "#4a9e6b" : "#C6A55A",
                    }}
                  >
                    {(d.status ?? "").replace(/_/g, " ")}
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

        {deal?.status && (
          <>
            <div className="ps-nav-sec" style={{ marginTop: 18 }}>
              Live Status
            </div>
            <div className="ps-status-wrap">
              <div className="ps-status-card">
                <div className="ps-status-row">
                  <div className="ps-notif" />
                  <span className="ps-status-l">
                    {deal.status.replace(/_/g, " ")}
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
            {(deal?.client_name ?? deal?.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="ps-foot-name">
              {deal?.client_name ?? "Client"}
            </div>
            <div className="ps-foot-email">
              {deal?.email ?? ""}
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
                The Milano Seal™ · Secure Matter Control Portal
              </div>
            </div>
          </div>
          {deal?.status && (
            <div className="ps-topbar-status">
              <span className="ps-topbar-badge">
                {deal.status.replace(/_/g, " ")}
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
