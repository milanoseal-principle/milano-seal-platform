"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const VA_RITUAL_STEPS = [
  "Preparing Coordination Workspace...",
  "Loading Assigned Task Queue...",
  "Syncing Follow-Up Operations...",
  "Reviewing Pending Intake Actions...",
  "Preparing Restricted Task Workspace...",
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
  const [ritualStep, setRitualStep] = useState(0);

  useEffect(() => {
    if (ritualDone) return;
    let i = 0;
    const advance = () => {
      if (i >= VA_RITUAL_STEPS.length) {
        sessionStorage.setItem(VA_RITUAL_KEY, "1");
        setTimeout(() => setRitualDone(true), 300);
        return;
      }
      setRitualStep(i + 1);
      i++;
      setTimeout(advance, 380);
    };
    setTimeout(advance, 200);
  }, [ritualDone]);

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
      <AnimatePresence>
        {!ritualDone && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            style={{
              background: "rgba(8,5,1,0.98)",
              paddingTop: "var(--sa-top, 0px)",
              paddingBottom: "var(--sa-bottom, 0px)",
            }}
          >
            <div className="flex flex-col items-center w-full max-w-[280px] px-6 select-none">
              <div
                className="mb-6 text-center"
                style={{ fontFamily: "var(--font-playfair),Georgia,serif", fontSize: 15, color: "rgba(255,255,255,0.75)", letterSpacing: "0.03em" }}
              >
                The Milano Seal™
              </div>
              <div
                className="mb-6 text-center font-mono text-[8px] tracking-[0.26em] uppercase"
                style={{ color: "rgba(212,175,55,0.35)" }}
              >
                VA ENVIRONMENT
              </div>
              <div className="w-full space-y-0">
                {VA_RITUAL_STEPS.map((label, idx) => {
                  const isDone = ritualStep > idx;
                  const isCurrent = ritualStep === idx;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3"
                      style={{
                        padding: "7px 0",
                        borderBottom: idx < VA_RITUAL_STEPS.length - 1 ? "1px solid rgba(212,175,55,0.05)" : "none",
                        opacity: idx > ritualStep ? 0.12 : 1,
                        transition: "opacity 0.25s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: isDone ? "1px solid rgba(212,175,55,0.4)" : isCurrent ? "1px solid rgba(212,175,55,0.55)" : "1px solid rgba(255,255,255,0.06)",
                          background: isDone ? "rgba(212,175,55,0.1)" : "transparent",
                        }}
                      >
                        {isDone && <span style={{ color: "#C6A55A", fontSize: 8, fontWeight: 700 }}>✓</span>}
                        {isCurrent && (
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                            style={{ width: 4, height: 4, borderRadius: "50%", background: "#C6A55A" }}
                          />
                        )}
                      </div>
                      <span style={{
                        fontSize: 11, color: isDone ? "rgba(255,255,255,0.4)" : isCurrent ? "#fff" : "rgba(255,255,255,0.2)",
                        letterSpacing: "0.015em",
                      }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
