"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Shield, Circle } from "lucide-react";
import { RitualEntryLock } from "@/components/ritual/RitualEntryLock";

const VA_NAV = [
  // TASKS
  { href: "/va/dashboard", label: "Overview", group: "TASKS" },
  { href: "/va/tasks", label: "My Tasks", group: "TASKS" },
  { href: "/va/follow-ups", label: "Follow-Ups", group: "TASKS" },
  // COORDINATION
  { href: "/va/matters", label: "My Matters", group: "COORDINATION" },
  { href: "/va/uploads", label: "Document Uploads", group: "COORDINATION" },
  // SUPPORT
  { href: "/va/dashboard", label: "SOP Library", group: "SUPPORT" },
];

const VA_RITUAL_STEPS = [
  "Verifying assistant access",
  "Loading assigned task queue",
  "Syncing matter coordination tools",
  "Reviewing pending intake actions",
  "Workspace ready",
];
const VA_RITUAL_KEY = "ms_va_ritual_seen";

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

  const [ritualDone, setRitualDone] = useState(() => {
    if (typeof window === "undefined") return true;
    return !!sessionStorage.getItem(VA_RITUAL_KEY);
  });

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
      {/* VA Entry Ritual — session-once */}
      {!ritualDone && (
        <RitualEntryLock
          eyebrow="VA Workspace"
          steps={VA_RITUAL_STEPS}
          sectionLabel="Preparing coordination environment"
          footerText="WORKSPACE READY"
          onComplete={() => setRitualDone(true)}
        />
      )}

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
          {/* Matter Ref Jump */}
          <div className="hidden lg:flex items-center gap-1.5 border border-[rgba(212,175,55,0.1)] rounded-sm px-2 py-1">
            <span className="font-mono text-[8px] tracking-wider" style={{ color: "rgba(212,175,55,0.3)" }}>REF</span>
            <input
              type="text"
              placeholder="MATTER-ID"
              maxLength={16}
              className="bg-transparent font-mono text-[9px] w-20 outline-none"
              style={{ color: "rgba(255,255,255,0.4)", caretColor: "rgba(212,175,55,0.6)" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  e.currentTarget.blur();
                }
              }}
            />
          </div>

          {/* Financial Lockout */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-sm"
            style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.08)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(212,175,55,0.4)" }} />
            <span className="font-mono text-[8px] tracking-[0.18em] uppercase" style={{ color: "rgba(212,175,55,0.35)" }}>
              FINANCIAL LOCKOUT ACTIVE
            </span>
          </div>

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
      <main className="flex-1 min-w-0 overflow-x-hidden px-4 md:px-6 py-6">{children}</main>

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
            RESTRICTED ACCESS · OPERATIONS DESK
          </span>
        </div>

        {/* Compliance track */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="font-mono text-[9px] tracking-wider" style={{ color: "rgba(255,255,255,0.12)" }}>
            ACTIVE QUEUE
          </span>
          <span style={{ color: "rgba(255,255,255,0.06)" }}>·</span>
          <span className="font-mono text-[9px] tracking-wider" style={{ color: "rgba(255,255,255,0.12)" }}>
            DATA SCOPE: MATTER ENFORCED
          </span>
          <span style={{ color: "rgba(255,255,255,0.06)" }}>·</span>
          <span className="font-mono text-[9px] tracking-wider" style={{ color: "rgba(255,255,255,0.12)" }}>
            AI: SERVER-SIDE VERIFIED
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
