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
  );
}
