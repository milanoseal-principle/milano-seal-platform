"use client";
import { ClientPortalShell } from "@/components/layout/ClientPortalShell";
import { FadeUp } from "@/components/motion/FadeUp";

export function ClientPortalPage() {
  return (
    <ClientPortalShell>
      <div className="p-8">
        <FadeUp>
          <h1 className="font-serif text-2xl text-[#D3B35A] mb-2">Your Portal</h1>
          <p className="text-sm text-[#B0B0B0]">Welcome back. Your matters and documents are ready for review.</p>
        </FadeUp>
      </div>
    </ClientPortalShell>

import { clientPortalModules } from "@/lib/modules/clientPortalModules";
import { MilanoRouteTransition } from "@/components/motion/MilanoRouteTransition";

export function ClientPortalPage() {
  return (
    <MilanoRouteTransition className="min-h-screen bg-[#0A0A0A] text-[#F6F1E6]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C6A65B]">
          THE MILANO SEAL™
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Client Portal</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#d8cfbd]">
          Your matter, documents, payment status, and release tracking in one secure view.
        </p>
        <div className="sr-only">{clientPortalModules.join(",")}</div>
      </section>
    </MilanoRouteTransition>
  );
}
