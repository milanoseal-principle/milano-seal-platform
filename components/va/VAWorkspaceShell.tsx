"use client";

import { ReactNode, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Shield, Circle, CheckCircle2, ShieldCheck } from "lucide-react";

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
            exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden select-none"
            style={{ background: "#060503", paddingTop: "var(--sa-top,0px)", paddingBottom: "var(--sa-bottom,0px)" }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(ellipse 55% 50% at 50% 30%, rgba(212,175,55,0.06) 0%, transparent 70%)",
            }} />

            {/* Seal medallion */}
            <div className="relative flex items-center justify-center mb-6" style={{ width: 190, height: 190 }}>
              <motion.div className="absolute rounded-full border border-dashed" style={{ inset: 0, borderColor: "rgba(212,175,55,0.11)" }}
                animate={{ rotate: 360 }} transition={{ duration: 90, repeat: Infinity, ease: "linear" }} />
              <motion.div className="absolute rounded-full border" style={{ inset: 20, borderColor: "rgba(212,175,55,0.17)", borderStyle: "dashed" }}
                animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} />
              <motion.div className="absolute rounded-full border" style={{ inset: 38, borderColor: "rgba(212,175,55,0.25)" }}
                animate={{ rotate: 360 }} transition={{ duration: 35, repeat: Infinity, ease: "linear" }} />
              {[0, 72, 144, 216, 288].map((deg) => {
                const r = 95; const x = 95 + r * Math.cos((deg * Math.PI) / 180); const y = 95 + r * Math.sin((deg * Math.PI) / 180);
                return <div key={deg} className="absolute rounded-full" style={{ width: 4, height: 4, left: x - 2, top: y - 2, background: "rgba(212,175,55,0.4)" }} />;
              })}
              <div className="absolute rounded-full" style={{ inset: 38, background: "radial-gradient(circle, rgba(212,175,55,0.09) 0%, transparent 70%)", filter: "blur(10px)" }} />
              <motion.div initial={{ scale: 0.82, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex items-center justify-center rounded-full overflow-hidden"
                style={{ width: 104, height: 104, background: "radial-gradient(circle, rgba(212,175,55,0.09) 0%, #050503 70%)", border: "1px solid rgba(212,175,55,0.42)", boxShadow: "0 0 44px rgba(212,175,55,0.15), 0 0 90px rgba(212,175,55,0.06)" }}
              >
                <Image src="/milano-seal-gold-transparent-512.png" alt="The Milano Seal" width={76} height={76} className="object-contain" priority />
              </motion.div>
            </div>

            {/* Wordmark */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-center mb-1">
              <p className="font-mono text-[9px] tracking-[0.26em] uppercase mb-2" style={{ color: "rgba(212,175,55,0.4)" }}>VA Workspace</p>
              <h1 className="font-serif font-normal tracking-[0.12em] uppercase" style={{
                fontSize: "clamp(1.15rem, 3vw, 1.5rem)",
                background: "linear-gradient(105deg, #c6a55a 38%, #f4e5b8 50%, #c6a55a 62%)",
                backgroundSize: "240% 100%",
                WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 20px rgba(212,175,55,0.28))",
              }}>The Milano Seal™</h1>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase mt-1.5" style={{ color: "rgba(212,175,55,0.42)" }}>Sealing Trust With Every Signature™</p>
            </motion.div>

            {/* Divider */}
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, delay: 0.35 }} className="flex items-center gap-2 mb-5" style={{ width: 240 }}>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.28), transparent)" }} />
              <span style={{ color: "rgba(212,175,55,0.5)", fontSize: 7 }}>◆</span>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.28), transparent)" }} />
            </motion.div>

            {/* Checklist */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} style={{ width: "min(100%, 300px)", padding: "0 16px" }}>
              <p className="font-mono text-center mb-3" style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(176,176,176,0.32)" }}>Preparing Coordination Environment</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {VA_RITUAL_STEPS.map((label, idx) => {
                  const done = ritualStep > idx;
                  return (
                    <li key={idx} style={{ position: "relative", display: "flex", alignItems: "center", gap: 11, fontSize: 12, fontFamily: "system-ui, sans-serif", color: done ? "rgba(212,175,55,0.85)" : "rgba(176,176,176,0.3)", transition: "color 0.4s ease" }}>
                      {idx > 0 && <div style={{ position: "absolute", left: 7.5, top: -8, width: 1, height: 8, background: done ? "rgba(212,175,55,0.4)" : "rgba(176,176,176,0.12)", transition: "background 0.4s ease" }} />}
                      {done ? <CheckCircle2 size={16} style={{ flexShrink: 0, color: "#d4af37" }} /> : <Circle size={16} style={{ flexShrink: 0, color: "rgba(176,176,176,0.2)" }} />}
                      <span>{label}</span>
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: ritualStep >= VA_RITUAL_STEPS.length ? 1 : 0 }} transition={{ duration: 0.5 }}
              className="flex items-center gap-2 mt-6"
              style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(212,175,55,0.65)" }}>
              <ShieldCheck size={14} style={{ color: "#d4af37" }} />
              <span>Workspace Ready</span>
            </motion.div>
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
            RESTRICTED ACCESS · VA PORTAL
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
