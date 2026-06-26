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

import { vaDashboardModules } from "@/lib/modules/vaDashboardModules";
import { MilanoRouteTransition } from "@/components/motion/MilanoRouteTransition";

export function VADashboardPage() {
  return (
    <MilanoRouteTransition className="min-h-screen bg-[#0A0A0A] text-[#F6F1E6]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C6A65B]">
          THE MILANO SEAL™
        </p>
        <h1 className="mt-3 text-4xl font-semibold">VA Execution Workbench</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#d8cfbd]">
          Assigned preparation, packet, upload, and follow-up tasks only.
        </p>
        <div className="sr-only">{vaDashboardModules.join(",")}</div>
      </section>
    </MilanoRouteTransition>
  );
}
