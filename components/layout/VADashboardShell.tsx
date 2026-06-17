"use client";
import Link from "next/link";
import { vaDashboardModules } from "@/lib/modules/vaDashboardModules";

export function VADashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <aside className="w-60 shrink-0 border-r border-[#2A2A2A] flex flex-col py-8 px-4 gap-1">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8B743C] mb-4 px-2">VA Portal</p>
        {vaDashboardModules.map((m) => (
          <Link key={m.id} href={m.href} className="px-3 py-2 rounded-lg text-sm text-[#B0B0B0] hover:text-[#C6A55A] hover:bg-[#C6A55A]/5 transition-all">
            {m.label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
