"use client";
import { VADashboardShell } from "@/components/layout/VADashboardShell";
import { FadeUp } from "@/components/motion/FadeUp";

export function VADashboardPage() {
  return (
    <VADashboardShell>
      <div className="p-8">
        <FadeUp>
          <h1 className="font-serif text-2xl text-[#D3B35A] mb-2">VA Dashboard</h1>
          <p className="text-sm text-[#B0B0B0]">Your assigned tasks and document queue.</p>
        </FadeUp>
      </div>
    </VADashboardShell>
  );
}
