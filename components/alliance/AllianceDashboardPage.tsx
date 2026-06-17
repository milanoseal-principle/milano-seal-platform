"use client";
import { AllianceDashboardShell } from "@/components/layout/AllianceDashboardShell";
import { FadeUp } from "@/components/motion/FadeUp";

export function AllianceDashboardPage() {
  return (
    <AllianceDashboardShell>
      <div className="p-8">
        <FadeUp>
          <h1 className="font-serif text-2xl text-[#D3B35A] mb-2">Alliance Dashboard</h1>
          <p className="text-sm text-[#B0B0B0]">Track referrals and earnings from your network.</p>
        </FadeUp>
      </div>
    </AllianceDashboardShell>
  );
}
