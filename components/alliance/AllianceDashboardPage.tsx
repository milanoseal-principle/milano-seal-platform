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

import { allianceDashboardModules } from "@/lib/modules/allianceDashboardModules";
import { MilanoRouteTransition } from "@/components/motion/MilanoRouteTransition";

export function AllianceDashboardPage() {
  return (
    <MilanoRouteTransition className="min-h-screen bg-[#0A0A0A] text-[#F6F1E6]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C6A65B]">
          THE MILANO SEAL™
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Alliance Partner Portal</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#d8cfbd]">
          Referral submission, onboarding readiness, Tool Belt resources, and partner matter visibility.
        </p>
        <div className="sr-only">{allianceDashboardModules.join(",")}</div>
      </section>
    </MilanoRouteTransition>
  );
}
