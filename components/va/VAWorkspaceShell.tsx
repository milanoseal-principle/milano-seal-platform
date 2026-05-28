"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Shield, Circle } from "lucide-react";

const VA_NAV = [
  // TASKS
  { href: "/va/dashboard", label: "My Tasks", group: "TASKS" },
  { href: "/va/dashboard?tab=follow-ups", label: "Follow-Ups", group: "TASKS" },
  { href: "/va/dashboard?tab=intake", label: "Intake Support", group: "TASKS" },
  // COORDINATION
  { href: "/va/dashboard?tab=scheduling", label: "Scheduling", group: "COORDINATION" },
  { href: "/va/dashboard?tab=documents", label: "Documents", group: "COORDINATION" },
  { href: "/va/dashboard?tab=translation", label: "Translation Flags", group: "COORDINATION" },
  { href: "/va/dashboard?tab=courier", label: "Courier Follow-Up", group: "COORDINATION" },
  // SUPPORT
  { href: "/va/dashboard?tab=sops", label: "SOP Library", group: "SUPPORT" },
  { href: "/va/dashboard?tab=escalations", label: "Escalations", group: "SUPPORT" },
];

const NAV_GROUPS = Array.from(
  VA_NAV.reduce((map, item) => {
    if (!map.has(item.group)) map.set(item.group, []);
    map.get(item.group)!.push(item);
    return map;
  }, new Map<string, typeof VA_NAV>())
);

export function VAWorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtcTime(
        now.toUTCString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1") + " UTC"
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const isActive = (href: string) => {
    const url = new URL(href, "http://x");
    const tab = url.searchParams.get("tab");
    if (tab) {
      return pathname === url.pathname && currentTab === tab;
    }
    // Base dashboard link is active only when no tab is selected
    return pathname === url.pathname && !currentTab;
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "rgba(8,5,1,0.99)" }}
    >
      {/* Topbar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{
          background: "rgba(8,5,1,0.99)",
          borderBottom: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="h-7 w-7 rounded-sm flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(212,175,55,0.12)" }}
          >
            <Shield size={14} style={{ color: "rgba(212,175,55,0.7)" }} />
          </div>
          <div>
            <div
              className="text-xs font-light tracking-widest"
              style={{
                color: "rgba(255,255,255,0.75)",
                fontFamily: "var(--font-playfair),Georgia,serif",
              }}
            >
              The Milano Seal™
            </div>
            <div
              className="text-[9px] font-mono tracking-[0.25em]"
              style={{ color: "rgba(212,175,55,0.45)" }}
            >
              VA ENVIRONMENT
            </div>
          </div>
        </div>

        {/* Desktop Nav — grouped */}
        <nav className="hidden md:flex items-center gap-4">
          {NAV_GROUPS.map(([groupLabel, items]) => (
            <div key={groupLabel} className="flex items-center gap-1">
              {/* Group label separator */}
              <span
                className="text-[8px] font-mono tracking-[0.2em] mr-1"
                style={{ color: "rgba(212,175,55,0.3)" }}
              >
                {groupLabel}
              </span>
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-1.5 rounded-sm text-[11px] font-mono tracking-wider transition-colors"
                    style={{
                      color: active
                        ? "rgba(212,175,55,0.85)"
                        : "rgba(255,255,255,0.35)",
                      background: active
                        ? "rgba(212,175,55,0.06)"
                        : "transparent",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Mobile Nav — horizontal scrollable strip (no group headers) */}
        <nav
          className="flex md:hidden items-center gap-1 overflow-x-auto"
          style={{ maxWidth: "60vw" }}
        >
          {VA_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-sm text-[11px] font-mono tracking-wider transition-colors whitespace-nowrap flex-shrink-0"
                style={{
                  color: active
                    ? "rgba(212,175,55,0.85)"
                    : "rgba(255,255,255,0.35)",
                  background: active
                    ? "rgba(212,175,55,0.06)"
                    : "transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Status indicators */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Circle
                size={6}
                fill="rgba(212,175,55,0.7)"
                style={{ color: "rgba(212,175,55,0.7)" }}
              />
            </motion.div>
            <span
              className="text-[9px] font-mono tracking-wider"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              VA ACTIVE
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 md:px-6 py-6">{children}</main>

      {/* Footer */}
      <footer
        className="px-6 py-3 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-4">
          <span
            className="text-[9px] font-mono tracking-wider"
            style={{ color: "rgba(255,255,255,0.18)" }}
          >
            {utcTime}
          </span>
          <span
            className="hidden sm:inline text-[9px] font-mono tracking-wider"
            style={{ color: "rgba(255,255,255,0.12)" }}
          >
            ·
          </span>
          <span
            className="hidden sm:inline text-[9px] font-mono tracking-wider"
            style={{ color: "rgba(255,255,255,0.18)" }}
          >
            RESTRICTED ACCESS · VA PORTAL
          </span>
        </div>
        <span
          className="text-[9px] font-mono tracking-wider"
          style={{ color: "rgba(212,175,55,0.2)" }}
        >
          THE MILANO SEAL™
        </span>
      </footer>
    </div>
  );
}
