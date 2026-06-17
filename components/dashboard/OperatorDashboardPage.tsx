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
  );
}
