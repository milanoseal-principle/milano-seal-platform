"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Search, Circle } from "lucide-react";

const VA_NAV = [
  { href: "/va/dashboard", label: "Workspace" },
];

export function VAWorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {VA_NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
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
