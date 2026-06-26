"use client";
import { OperatorDashboardShell } from "@/components/layout/OperatorDashboardShell";
import { FadeUp } from "@/components/motion/FadeUp";

export function OperatorDashboardPage() {
  return (
    <OperatorDashboardShell>
      <div className="p-8">
        <FadeUp>
          <h1 className="font-serif text-2xl text-[#D3B35A] mb-2">Operator Dashboard</h1>
          <p className="text-sm text-[#B0B0B0]">Manage all active matters, clients, and execution workflow.</p>
        </FadeUp>
      </div>
    </OperatorDashboardShell>

import { operatorDashboardModules } from "@/lib/modules/operatorDashboardModules";
import { MilanoRouteTransition } from "@/components/motion/MilanoRouteTransition";

export function OperatorDashboardPage() {
  return (
    <MilanoRouteTransition className="min-h-screen bg-[#0A0A0A] text-[#F6F1E6]">
      <section className="mx-auto max-w-[1500px] px-6 py-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C6A65B]">
          THE MILANO SEAL™
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Command Center</h1>
        <p className="mt-3 max-w-3xl text-sm text-[#d8cfbd]">
          Internal execution control for intake, payment, scheduling, apostille, custody, and release.
        </p>
        <div className="sr-only">{operatorDashboardModules.join(",")}</div>
      </section>
    </MilanoRouteTransition>
  );
}
